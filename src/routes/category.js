const express = require("express");

const { Category } = require("../../models");
const router = express.Router();

router.post("", async (req, res) => {
  const name = req.body.name;

  const created = await Category.create({ name, isActive: true });

  res.json({
    message: "Category created successfully",
    data: created,
  });
});

router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  let category = await Category.findByPk(id);
  if (!category) {
    res.json({
      message: `Category id=${id} not found`,
    });
  }
  category = await category.update({ name });

  res.json({
    message: "Category updated successfully",
    data: category,
  });
});

router.get("", async (req, res) => {
  const categories = await Category.findAll({
    include: [
      {
        model: Product,
        as: "products",
      },
    ],
  });

  res.json({
    message: "Category fetched successfully",
    data: categories,
  });
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    let category = await Category.findByPk(id);

    if (!category) {
      res.json({
        message: `Category id=${id} not found`,
      });
    }

    await category.destroy();

    res.json({
      data: category,
    });
  } catch (error) {}
});

module.exports = router;
