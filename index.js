const express = require("express");
const db = require("./models");
const fileUpload = require("express-fileupload");

const app = express();
const port = 3000;
const { Category, Product, Customer, Order, OrderDetail } = require("./models");

app.use(express.json());
app.use(fileUpload());

db.sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Unable connect to database", err));

app.post("/api/v1/upload", function (req, res) {
  // When a file has been uploaded
  //Checks whether a file exists
  // 	req.files comes from middleware like express-fileupload
  if (req.files && Object.keys(req.files).length !== 0) {
    //ensures at least one file was uploaded
    // Uploaded path
    const uploadedFile = req.files.file;

    // Logging uploading file
    console.log(uploadedFile);

    // Upload path
    const uploadPath = __dirname + "/uploads/" + uploadedFile.name;

    // To save the file using mv() function
    uploadedFile.mv(uploadPath, function (err) {
      if (err) {
        console.log(err);
        res.send("Failed !!");
      } else res.send("Successfully Uploaded !!");
    });
  } else res.send("No file uploaded !!");
});

app.get("/api/v1/download", function (req, res) {
  // The res.download() talking file path to be downloaded
  res.download(__dirname + "/uploads/file.xlsx", function (err) {
    if (err) {
      console.log(err);
    }
  });
});

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
