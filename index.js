const express = require("express");
const db = require("./models");
const path = require("path");

const authRoute = require("./src/routes/auth");
const customerRoute = require("./src/routes/customer");
const userRoute = require("./src/routes/user");
const productRoute = require("./src/routes/product");

const fileUpload = require("express-fileupload");

const authMiddleware = require("./src/middlewares/authMiddleware");

const app = express();
const port = 3000;
const { Category, Product, Customer, Order, OrderDetail } = require("./models");
const { Op, where } = require("sequelize");

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

app.use("/api/v1/users", userRoute);
app.use("/api/v1/products", productRoute);

app.post("/api/v1/orders", async (req, res) => {
  try {
    console.log("Request body", req.body);
    const { customerId, location, items, discount } = req.body;

    const customer = await Customer.findByPk(customerId);
    console.log("Customer", customer);

    if (!customer) {
      res.json({
        message: "Customer not found",
      });
    }

    const orderDetailsData = [];
    let total = 0;
    for (const item of items) {
      const { productId, qty } = item;

      // Get product info
      const product = await Product.findByPk(productId);
      if (!product) {
        res.json({
          message: `Product id=${productId} not found`,
        });
      }

      console.log("Product", product);
      const amount = product.price * qty;

      // total = total + amount
      total += amount;

      orderDetailsData.push({
        productId,
        productName: product.name,
        productPrice: product.price,
        qty,
        amount,
      });
    }

    console.log("OrderDetails", orderDetailsData);

    // Create order into db
    const createdOrder = await Order.create({
      customerId,
      orderNumber: 4,
      total: total,
      discount: discount,
      orderDate: new Date(),
      location,
    });

    console.log("Created order", createdOrder);

    // Create order detail into db

    const orderDetails = orderDetailsData.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      qty: item.qty,
      amount: item.amount,
      orderId: createdOrder.id,
    }));

    await OrderDetail.bulkCreate(orderDetails);

    const completedOrder = await Order.findByPk(createdOrder.id, {
      include: [
        {
          model: Customer,
          as: "customer",
        },
        {
          model: OrderDetail,
          as: "orderDetails",
        },
      ],
    });
    res.json({
      message: "Order completed",
      data: completedOrder,
    });
  } catch (error) {
    console.log("Error", error);
  }
});

app.get("/api/v1/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    let whereCondition = {};
    if (req.query.search) {
      whereCondition.name = {
        [Op.iLike]: `%${req.query.search}%`,
      };
    }

    if (req.query.price) {
      whereCondition.price = parsePriceQuery(req.query.price);
    }
    const { rows: products, count: total } = await Product.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      include: [
        {
          model: Category,
          as: "category",
        },
      ],
    });

    const totalPages = Math.ceil(total / limit);
    res.json({
      message: "Product fetched successfully",
      data: products,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.log("Creating product error:", error);
    res.status(500).json({
      message: error,
    });
  }
});

function parsePriceQuery(priceQuery) {
  if (!priceQuery) return null;
  const [operator, value] = priceQuery.split(":");
  const price = Number(value);

  if (operator === "greater") {
    return {
      [Op.gt]: price,
    };
  } else if (operator === "greater_equal") {
    return {
      [Op.gte]: price,
    };
  } else if (operator === "lower") {
    return {
      [Op.lt]: price,
    };
  } else if (operator === "lower_equal") {
    return {
      [Op.lte]: price,
    };
  } else if (operator === "equal") {
    return {
      [Op.eq]: price,
    };
  }
}

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

app.post("/api/v1/categories", authMiddleware, async (req, res) => {
  // Business logic

  const name = req.body.name;
  const isActive = req.body.isActive;

  const created = await Category.create({ name, isActive });

  res.json({
    message: "Category created successfully",
    data: created,
  });
});

app.get("/api/v1/categories", authMiddleware, async (req, res) => {
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
