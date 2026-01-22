const express = require("express");
const router = express.Router();

const { Category, Product } = require("../../models");

router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Product, as: "products" }],
    });

    res.json({
      message: "Fetch categories successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

/**
 * @desc    Create category
 */
router.post("/", async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const category = await Category.create({
      name,
      isActive,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
});

module.exports = router;
