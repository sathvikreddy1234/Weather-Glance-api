const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Middleware
app.use(express.json());
app.use(cors());

// ✅ MongoDB Connection (FIXED)
const MONGO_URI = "mongodb+srv://user1:pass123@default.mrkeo.mongodb.net/Weather_Forecast?retryWrites=true&w=majority";
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Failed:", err));

// ✅ MongoDB Schema & Model
const UserSchema = new mongoose.Schema({
    username: String,
    email: String
});
const User = mongoose.model("User", UserSchema);

// ✅ Signup Route
app.post("/signup", async (req, res) => {
    const { username, email } = req.body;

    try {
        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists!" });

        const newUser = new User({ username, email });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Error registering user", error: err.message });
    }
});

// ✅ OpenWeatherMap API Key (Using Your Key)
const WEATHER_API_KEY = "a02dc950949cb13d1c5fd633c8ff1a2b";

// ✅ 5-Day Weather Forecast with Hourly Data, Wind Speed, Alerts
app.get("/forecast", async (req, res) => {
    const { city } = req.query;

    if (!city) return res.status(400).json({ message: "City is required!" });

    try {
        const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);

        const forecastData = weatherResponse.data.list.map(entry => {
            const date = new Date(entry.dt * 1000);
            const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            const weatherCondition = entry.weather[0].main.toLowerCase();
            let alertMessage = "✅ No alerts";

            if (weatherCondition.includes("rain")) alertMessage = "⚠️ Rain expected. Carry an umbrella!";
            if (entry.wind.speed > 10) alertMessage = "🌬️ Strong wind alert. Be careful!";
            if (entry.main.temp > 35) alertMessage = "☀️ It's too hot outside. Stay hydrated!";

            return {
                date: date.toDateString(),
                time,
                temperature: entry.main.temp,
                wind_speed: entry.wind.speed,
                condition: entry.weather[0].description,
                alert: alertMessage
            };
        });

        res.json({ city: weatherResponse.data.city.name, forecast: forecastData });
    } catch (err) {
        res.status(500).json({ message: "Error fetching weather data", error: err.message });
    }
});

// ✅ Start Server (Handles Port Conflict)
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
    .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`❌ Port ${PORT} is already in use. Try using another port.`);
        } else {
            console.error("❌ Server Error:", err);
        }
    });
