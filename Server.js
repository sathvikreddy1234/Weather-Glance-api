const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 6000; // Server running on port 6000

// Middleware
app.use(express.json());
app.use(cors());

// ✅ MongoDB Connection
const MONGO_URI = "mongodb+srv://user1:pass123@default.mrkeo.mongodb.net/Weather_Forecast?retryWrites=true&w=majority"; // Replace with your MongoDB URI
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

// ✅ Login Route (No password, just checking if user exists)
app.post("/login", async (req, res) => {
    const { email } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found!" });

        res.json({ message: "Login successful!", user });
    } catch (err) {
        res.status(500).json({ message: "Error logging in", error: err.message });
    }
});

// ✅ OpenWeatherMap API Key (Replace with your API Key)
const WEATHER_API_KEY = "a02dc950949cb13d1c5fd633c8ff1a2b"; 

// ✅ 7-Day Weather Forecast API
app.get("/forecast", async (req, res) => {
    const { city } = req.query;

    if (!city) return res.status(400).json({ message: "City is required!" });

    try {
        const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);

        const forecastData = weatherResponse.data.list.map(day => {
            const weatherCondition = day.weather[0].main.toLowerCase();
            let alertMessage = "✅ No weather alerts";

            if (weatherCondition.includes("rain")) alertMessage = "☔ Rain expected. Carry an umbrella!";
            if (day.wind.speed > 10) alertMessage = "🌬️ Strong wind alert. Be careful!";
            if (day.main.temp_max > 35) alertMessage = "☀️ It's too hot outside. Stay hydrated!";

            return {
                date: new Date(day.dt * 1000).toDateString(),
                temperature: {
                    min: day.main.temp_min,
                    max: day.main.temp_max
                },
                condition: day.weather[0].description,
                alert: alertMessage
            };
        });

        res.json({ city: weatherResponse.data.city.name, forecast: forecastData });
    } catch (err) {
        res.status(500).json({ message: "Error fetching weather data", error: err.message });
    }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
    .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`❌ Port ${PORT} is already in use. Try using another port.`);
        } else {
            console.error("❌ Server Error:", err);
        }
    });
