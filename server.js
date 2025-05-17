require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const Admin = require("./models/Admin");
const Inquiry = require("./models/Inquiry");

const app = express();

// Middleware
app.use(express.json());
app.use(helmet());

// Sanitize req.body, req.params, req.query
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] = mongoSanitize.sanitize(req.query[key]);
    });
  }
  next();
});

// CORS config
const allowedOrigins = [
  "https://vidarbhabioenergysolutions.com",
  "http://localhost:3000"
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Rate limiter for login route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many login attempts. Try again later.",
});
app.use("/api/admin-login", loginLimiter);

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/contactDB";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Contact Schema & Model (for /api/contact route)
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  company: { type: String },
  message: { type: String, required: true },
}, { timestamps: true });
const Contact = mongoose.model("Contact", contactSchema);

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied. Token required." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid token. Access forbidden." });
  }
};

// Admin login route
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

// Contact form submission route
app.post("/api/contact", async (req, res) => {
  const { name, email, contactNo, company, message } = req.body;
  if (!name?.trim() || !email?.trim() || !contactNo?.trim() || !message?.trim()) {
    return res.status(400).json({ message: "Name, email, contactNo, and message are required." });
  }

  try {
    const newContact = new Contact({
      name: name.trim(),
      email: email.trim(),
      contactNo: contactNo.trim(),
      company: company?.trim() || "",
      message: message.trim(),
    });
    await newContact.save();
    res.status(201).json({ message: "Message received successfully!" });
  } catch (error) {
    console.error("❌ Contact form error:", error);
    res.status(500).json({ message: "Failed to save message." });
  }
});

// Inquiry form submission route
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

// Get all contacts (protected route)
app.get("/api/contacts", verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    console.error("❌ Get contacts error:", error);
    res.status(500).json({ message: "Failed to retrieve contacts." });
  }
});

// Get all inquiries (protected route)
app.get("/api/inquiries", verifyToken, async (req, res) => {
  try {
    const inquiries = await Inquiry.find();
    res.json(inquiries);
  } catch (error) {
    console.error("❌ Get inquiries error:", error);
    res.status(500).json({ message: "Failed to retrieve inquiries." });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send({ status: "API is live 🚀" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
