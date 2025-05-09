const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contactNo: { type: String, required: true }, // Added contact number field
  company: { type: String, required: true }, // Added company field
  capacity: { type: String, required: true }, // Added capacity field
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Inquiry", inquirySchema);
