const express = require("express");
const db = require("./models");
const path = require("path");
const cors = require("cors");

const authRoute = require("./src/routes/auth");
const customerRoute = require("./src/routes/customer");
const userRoute = require("./src/routes/user");
const productRoute = require("./src/routes/product");
const orderRoute = require("./src/routes/order");
const categoryRoute = require("./src/routes/category");
const paymentRoute = require("./src/routes/payment");

require('dotenv').config();

const fileUpload = require("express-fileupload");

const authMiddleware = require("./src/middlewares/authMiddleware");

const app = express();
const port = 3000;
const { Category, Product, Customer, Order, OrderDetail } = require("./models");

const allowedOrigins = [
  "http://localhost:3000",
  "https://www.abc.com",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // or if the origin is in the whitelist
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE", // Specify allowed methods
  credentials: true, // Allow cookies to be sent with requests
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(
  fileUpload({
    limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
    createParentPath: true,
  }),
);

app.use(
  "/uploads/products",
  express.static(path.join(process.cwd(), "uploads/products")),
);

db.sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Unable connect to database", err));

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/customers", authMiddleware, customerRoute);

app.use("/api/v1/users", authMiddleware, userRoute);
app.use("/api/v1/products", authMiddleware, productRoute);
app.use("/api/v1/orders", authMiddleware, orderRoute);
app.use("/api/v1/categories", authMiddleware, categoryRoute);
app.use("/api/v1/payments", authMiddleware, paymentRoute);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
