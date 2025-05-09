const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Load environment variables

const router = express.Router();

// Dummy Admin Data (This should be replaced with a database)
const admins = [
  { email: "admin@example.com", password: bcrypt.hashSync("admin123", 10) },
];

// Admin Login API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = admins.find((a) => a.email === email);
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Validate JWT Secret Key
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not set" });
    }

    // Generate JWT Token
    const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
