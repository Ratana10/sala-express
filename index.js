const express = require("express");
const app = express();
const port = 3000;
const products = [
  {
    id: 1,
    name: "Apple",
    price: 20,
    qty: 10,
  },
];
app.get("/", (req, res) => {
  res.send(products);
});

app.get("/products", (req, res) => {
  // Business logic

  res.send(products);
});

app.post("/products", (req, res) => {
  // Business logic

  res.send("Product created successfully");
});

const db = require("./models");

const { User } = require("./models/index");

app.get("/users", async (req, res) => {
  const users = await User.findAll();
  res.json({
    message: "Users get successfully",
    data: users,
  });
});

app.use(express.json())

app.post("/users", async (req, res) => {
  const { firstName, lastName, email } = req.body;
  const created = await User.create({ firstName, lastName, email });
  res.json({
    message: "User created successfully",
    data: created,
  });
});



db.sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully!"))
  .catch((err) => console.error("Unable to connect to the database:", err));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
