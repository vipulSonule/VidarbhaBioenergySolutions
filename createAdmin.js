// createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

mongoose.connect("mongodb://localhost:27017/contactDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = new Admin({ username: "admin", password: hashedPassword });
  await admin.save();
  console.log("Admin created");
  mongoose.disconnect();
}

createAdmin();
