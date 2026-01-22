const express = require("express");
const router = express.Router();

const { Product, Category } = require("../../models");

router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category, as: "category" }],
    });

    res.json({
      message: "Fetch products successfully",
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

/**
 * @desc    Create product
 */
router.post("/", async (req, res) => {
  try {
    const { name, description, color, price, categoryId, qty, isActive } =
      req.body;

    const product = await Product.create({
      name,
      description,
      color,
      price,
      categoryId,
      qty,
      isActive,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
});

module.exports = router;
