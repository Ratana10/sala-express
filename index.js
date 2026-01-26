const express = require("express");
const db = require("./models");
const app = express();
const port = 3000;
const { Category, Product, Customer, Order, OrderDetail } = require("./models");

app.use(express.json());

db.sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Unable connect to database", err));

async function generateOrderNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const prefix = `ORD-${year}${month}${day}`;

  // Get count of orders today
  const count = await Order.count({
    where: {
      orderNumber: {
        [require("sequelize").Op.like]: `${prefix}%`,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `${prefix}-${sequence}`;
}
app.post("/api/v1/orders", async (req, res) => {
  try {
    const { customerId, location, discount = 0, items } = req.body;
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const orderNumber = await generateOrderNumber();
    let total = 0;
    const orderDetailsData = [];
    for (const item of items) {
      const { productId, qty } = item;

      // Get product info
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`,
        });
      }

      const amount = parseFloat(product.price) * qty;
      total += amount;

      orderDetailsData.push({
        productId,
        productName: product.name,
        productPrice: product.price,
        qty,
        amount,
      });
    }
    const finalTotal = total - parseFloat(discount);

    const order = await Order.create({
      customerId,
      orderNumber,
      total: finalTotal,
      discount,
      orderDate: new Date(),
      location,
    });

    const orderDetailsWithOrderId = orderDetailsData.map((detail) => ({
      ...detail,
      orderId: order.id,
    }));

    // Batch create order details
    await OrderDetail.bulkCreate(orderDetailsWithOrderId);

    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
        {
          model: OrderDetail,
          as: "orderDetails",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: completeOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
});
app.get("/api/v1/products", async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          as: "category",
        },
      ],
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
