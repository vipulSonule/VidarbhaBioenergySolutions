const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Contact = require("../models/Contact");
const Inquiry = require("../models/Inquiry");

const router = express.Router();

// Middleware: Verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied. Token required." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token. Access forbidden." });
  }
};

// Admin Login Route
router.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials. User not found." });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials. Password mismatch." });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Contact Form Submission
router.post("/contact", async (req, res) => {
  const { name, email, contactNo, company, message } = req.body;
  try {
    if (!name || !email || !contactNo || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newContact = new Contact({ name, email, contactNo, company, message });
    await newContact.save();
    res.status(201).json({ message: "Message received successfully!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Failed to save message." });
  }
});

// Inquiry Form Submission
router.post("/inquiry", async (req, res) => {
  const { name, mobile, email, company, capacity, message } = req.body;
  try {
    if (!name || !mobile || !email || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newInquiry = new Inquiry({ name, mobile, email, company, capacity, message });
    await newInquiry.save();
    res.status(201).json({ message: "Inquiry submitted successfully!" });
  } catch (error) {
    console.error("Inquiry form error:", error);
    res.status(500).json({ message: "Failed to save inquiry." });
  }
});

// Get All Contacts (Protected)
router.get("/contacts", verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve contacts." });
  }
});

// Get All Inquiries (Protected)
router.get("/inquiries", verifyToken, async (req, res) => {
  try {
    const inquiries = await Inquiry.find();
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve inquiries." });
  }
});

module.exports = router;
