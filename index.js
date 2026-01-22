const express = require("express");
const db = require("./models");
const app = express();
const port = 3000;
const { Category, Product } = require("./models");

app.use(express.json());

db.sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Unable connect to database", err));

app.get("/api/v1/products", async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          as: "category"
        }
      ]
    });
    res.json({
      message: "Product fetched successfully",
      data: products,
    });
  } catch (error) {
    console.log("Creating product error:", error);
  }
});

app.post("/api/v1/products", async (req, res) => {
  // const name = req.body.name
  // const price = req.body.price
  // const categroyId = req.body.categroyId
  try {
    const { name, price, categoryId, isActive } = req.body;

    const createdProduct = await Product.create({
      name,
      price,
      categoryId,
      isActive,
    });
    res.json({
      message: "Product created successfully",
      data: createdProduct,
    });
  } catch (error) {
    console.log("Creating product error:", error);
  }
});

app.post("/api/v1/categories", async (req, res) => {
  // Business logic

  const name = req.body.name;
  const isActive = req.body.isActive;

  const created = await Category.create({ name, isActive });

  res.json({
    message: "Category created successfully",
    data: created,
  });
});

app.get("/api/v1/categories", async (req, res) => {
  const categories = await Category.findAll({
    include: [
      {
        model: Product,
        as: "products"
      },
    ]
  });

  res.json({
    message: "Category fetched successfully",
    data: categories,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
