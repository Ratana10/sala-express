const app = require("express");
const {
  Order,
  Customer,
  OrderDetail,
  Product,
  Payment,
} = require("../../models");
const generateDoc = require("../utils/generateOrderDoc");
const libre = require("libreoffice-convert");

libre.convertAsync = (buffer, ext, filter) =>
  new Promise((resolve, reject) => {
    libre.convert(buffer, ext, filter, (err, done) => {
      if (err) reject(err);
      else resolve(done);
    });
  });

const router = app.Router();

router.post("", async (req, res) => {
  try {
    console.log("Request body", req.body);
    const { orderNumber, customerId, location, items, discount } = req.body;

    const customer = await Customer.findByPk(customerId);
    console.log("Customer", customer);

    if (!customer) {
      res.json({
        message: "Customer not found",
      });
    }

    const orderDetailsData = [];
    let subTotal = 0;
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
      subTotal += amount;

      orderDetailsData.push({
        productId,
        productName: product.name,
        productPrice: product.price,
        qty,
        amount,
      });
    }

    console.log("OrderDetails", orderDetailsData);
    const finalTotal = Math.max(subTotal - Number(discount || 0), 0);

    // Create order into db
    const createdOrder = await Order.create({
      customerId,
      orderNumber: orderNumber,
      total: finalTotal,
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
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    res.status(201).json({
      message: "Order created",
      data: completedOrder,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:orderId/generate-doc", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
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

    console.log(JSON.stringify(order, null, 2));
    console.log("Order", order);
    const buffer = generateDoc(order);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${order.orderNumber}.docx`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:orderId/generate-pdf", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // 1. Generate DOCX buffer
    const docxBuffer = generateDoc(order);

    // 2. Convert to PDF
    const pdfBuffer = await libre.convertAsync(docxBuffer, ".pdf", undefined);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${order.orderNumber}.pdf`,
    );
    res.setHeader("Content-Type", "application/pdf");

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF conversion error:", error);
    res.status(500).json({
      message: "Failed to generate PDF",
    });
  }
});

module.exports = router;
