require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("./models/Admin");
const Inquiry = require("./models/Inquiry");

const app = express();

// CORS Configuration
const allowedOrigins = [
  "https://vidarbhabioenergysolutions.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Handle preflight OPTIONS requests
app.options("*", cors());

// Body Parser
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/contactDB";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Contact Schema & Model
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  contactNo: String,
  company: String,
  message: String,
});
const Contact = mongoose.model("Contact", contactSchema);

// JWT Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token. Access forbidden." });
  }
};

// Admin Login
app.post("/api/admin-login", async (req, res) => {
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
app.post("/api/contact", async (req, res) => {
  const { name, email, contactNo, company, message } = req.body;

  if (!name || !email || !contactNo || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const newContact = new Contact({ name, email, contactNo, company, message });
    await newContact.save();
    res.status(201).json({ message: "Message received successfully!" });
  } catch (error) {
    console.error("❌ Contact form error:", error);
    res.status(500).json({ message: "Failed to save message." });
  }
});

// Inquiry Form Submission
app.post("/api/inquiry", async (req, res) => {
  const { name, mobile, email, company, capacity, message } = req.body;

  if (!name?.trim() || !mobile?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ message: "Name, mobile, email, and message are required." });
  }

  try {
    const newInquiry = new Inquiry({
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      company: company?.trim() || "",
      capacity: capacity?.trim() || "",
      message: message.trim(),
    });
    await newInquiry.save();
    res.status(201).json({ message: "Inquiry submitted successfully!" });
  } catch (error) {
    console.error("❌ Inquiry save error:", error);
    res.status(500).json({ message: "Failed to save inquiry." });
  }
});

// Get Contacts (Protected)
app.get("/api/contacts", verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    console.error("❌ Get contacts error:", error);
    res.status(500).json({ message: "Failed to retrieve contacts." });
  }
});

// Get Inquiries (Protected)
app.get("/api/inquiries", verifyToken, async (req, res) => {
  try {
    const inquiries = await Inquiry.find();
    res.json(inquiries);
  } catch (error) {
    console.error("❌ Get inquiries error:", error);
    res.status(500).json({ message: "Failed to retrieve inquiries." });
  }
});

// Health Check Route
app.get("/", (req, res) => {
  res.send({ status: "API is live 🚀" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
