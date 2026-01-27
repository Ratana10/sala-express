const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../../models");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json({
      message: "Customers fetched successfully",
    });
  } catch (error) {
    console.log("Error", error);
    res.json({
      message: error,
    });
  }
});

module.exports = router;
