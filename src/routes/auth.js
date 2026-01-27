const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../../models");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, gender } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      gender,
      isActive: true,
    });

    res.json({
      message: "User created successfully",
      data: createdUser,
    });
  } catch (error) {
    console.log("Error", error);
    res.json({
      message: error,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, "ratana-system");
    res.json({
      message: "User logged in successfully",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.log("Error", error);
    res.json({
      message: error,
    });
  }
});

module.exports = router;
