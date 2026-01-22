const express = require("express");
const productRoutes = require("./src/routes/product.route");
const categoryRoutes = require("./src/routes/category.route");

const db = require("./models");
const app = express();
const port = 3000;

app.use(express.json());

db.sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Unable connect to database", err));

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
