const app = require("express");
const {
  getReqTime,
  buildPurchaseHash,
  encodeBase64,
} = require("../utils/payway");
const { Order, Customer, OrderDetail, Payment } = require("../../models");

const router = app.Router();

router.post("/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { method = "ABA_PAYWAY" } = req.body;

  try {
    //1. Fetch order
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    //2. Prevent duplicate payment
    const existingPayment = await Payment.findOne({
      where: { orderId, status: "PENDING" },
    });

    if (existingPayment) {
      return res
        .status(400)
        .json({ message: "A pending payment already exists for this order" });
    }

    //3. Create Payment record
    const paywayTranId = `ORD-${Date.now()}`;
    const createdPayment = await Payment.create({
      orderId: order.id,
      paywayTranId,
      amount: order.total,
      method,
      status: "PENDING",
    });

    //4. Build PayWay payload (only if ABA_PAYWAY)
    if (method !== "ABA_PAYWAY") {
      return res.json({
        message: "Payment initiated",
        data: createdPayment,
      });
    }

    const req_time = getReqTime();
    let paywayItems = JSON.stringify(
      order.orderDetails?.map((detail) => ({
        name: detail.productName,
        quantity: detail.qty,
        price: Number(detail.productPrice),
      })),
    );

    paywayItems = await encodeBase64(paywayItems);
    const encodedReturnUrl = `${process.env.FRONTEND_URL}/payment-return`;

    const paymentPayload = {
      merchant_id: process.env.ABA_PAYWAY_MERCHANT_ID,
      req_time,
      tran_id: paywayTranId,
      amount: Number(order.total).toFixed(2),
      items: paywayItems,
      shipping: "0.00",
      firstname: order.customer?.name?.split(" ")[0] || "Customer",
      lastname: order.customer?.name?.split(" ").slice(1).join(" ") || "NA",
      email: order.customer?.email || "no-email@example.com",
      phone: order.customer?.phone || "000000000",
      type: "purchase",
      view_type: "popup",
      payment_option: "abapay_khqr",
      return_url: encodedReturnUrl,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      continue_success_url: `${process.env.FRONTEND_URL}/success-url`,
      currency: "USD",
    };

    const hash = buildPurchaseHash(paymentPayload);
    console.log("hash", hash);
    return res.json({
      message: "Payment initiated",
      data: {
        order: createdPayment,
        payway: {
          action: `${process.env.ABA_PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/purchase`,
          method: "POST",
          fields: {
            ...paymentPayload,
            hash,
          },
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

module.exports = router;
