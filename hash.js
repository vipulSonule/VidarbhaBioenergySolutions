const bcrypt = require("bcryptjs");

const password = "vipuladmin@12345"; // ← Replace with your new password

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error("❌ Error hashing password:", err);
  } else {
    console.log("✅ Hashed password:", hash);
  }
});
