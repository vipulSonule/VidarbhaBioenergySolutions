const express = require("express");
const router = express.Router();
const Inquiry = require("../models/Inquiry");

router.post("/", async (req, res) => {
  try {
    console.log("Received inquiry:", req.body); // 🔥 check incoming data

    const inquiry = new Inquiry(req.body);
    await inquiry.save();

    res.status(201).json({ message: "Inquiry submitted successfully" });
  } catch (error) {
    console.error("Error saving inquiry:", error);
    res.status(500).json({ message: "Error submitting inquiry" });
  }
});

module.exports = router;
