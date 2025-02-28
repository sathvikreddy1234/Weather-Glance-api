require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 6000;
const MONGO_URI = process.env.MONGO_URI;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET; // ✅ Fix Missing JWT_SECRET

app.use(express.json());
app.use(cors());

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI, {})
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ User Model
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = mongoose.model("User", UserSchema);

// ✅ Sign Up Route
app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // ✅ Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error signing up", error: error.message });
    }
});

// ✅ Sign In Route
app.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // ✅ Generate JWT Token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Error signing in", error: error.message });
    }
});

// ✅ 5-Day Hourly Weather Forecast Route
app.get("/weather", async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) return res.status(400).json({ message: "City is required" });

        const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
        );

        const forecastData = weatherResponse.data.list.map((item) => ({
            dateTime: item.dt_txt,
            temperature: item.main.temp,
            humidity: item.main.humidity,
            pressure: item.main.pressure,
            windSpeed: item.wind.speed,
            visibility: item.visibility,
            cloudCover: item.clouds.all,
            airQuality: item.main.aqi || "N/A"
        }));

        res.json({
            city: weatherResponse.data.city.name,
            forecast: forecastData
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching weather data", error: error.message });
    }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
