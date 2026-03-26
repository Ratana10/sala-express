const app = require("express");
const { Order, Customer, OrderDetail, Product } = require("../../models");
const generateDoc = require("../utils/generateOrderDoc");
const { getReqTime } = require("../utils/payway");

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
    const finalTotal = Math.max(subTotal - Number(discount || 0), 0);
    // Generate PayWay tran_id
    const paywayTranId = `ORD-${Date.now()}`;

    // Create order into db
    const createdOrder = await Order.create({
      customerId,
      orderNumber: orderNumber,
      total: total,
      discount: discount,
      orderDate: new Date(),
      location,
      paymentStatus: "PENDING",
      paymentMethod: "ABA_PAYWAY",
      paywayTranId,
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

    const req_time = getReqTime();
    const paywayItems = JSON.stringify(
      completedOrder.orderDetails?.map((detail) => ({
        name: detail?.productName,
        quantity: detail?.qty,
        price: Number(detail?.productPrice),
      })),
    );

    const paymentPayload = {
      req_time,
      merchant_id: process.env.ABA_PAYWAY_MERCHANT_ID,
      tran_id: paywayTranId,
      amount: Number(finalTotal).toFixed(2),
      items: paywayItems,
      shipping: "0.00",
      firstname: completedOrder.customer?.name?.split(" ")[0] || "Customer",
      lastname:
        completedOrder.customer?.name?.split(" ").slice(1).join(" ") || "NA",
      email: completedOrder.customer?.email || "no-email@example.com",
      phone: completedOrder.customer?.phone || "000000000",
      type: "purchase",
      payment_option: "",
      return_url: `${process.env.FRONTEND_URL}/payment-return`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      currency: "USD",
    };

    const hash = buildPurchaseHash(paymentPayload);

    res.json({
      message: "Order completed",
      data: completedOrder,
          payment: {
        action: `${process.env.ABA_PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/purchase`,
        method: "POST",
        fields: {
          ...paymentPayload,
          hash,
        },
      },
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

module.exports = router;
