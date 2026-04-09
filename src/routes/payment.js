const app = require("express");
const { Payment, Customer, Order, OrderDetail } = require("../../models");
const { Op } = require("sequelize");
const {
  getReqTime,
  encodeBase64,
  buildPurchaseHash,
} = require("../utils/payway");

const router = app.Router();

// Create payment
router.post("/:orderId", async (req, res) => {
  console.log("FONTEND_URL", process.env.FRONTEND_URL)
  const { orderId } = req.params;
  try {
    // 1. Fetch order
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    if (!order) {
      return res.status(404).json({
        message: `Order id=${orderId} not found`,
      });
    }

    console.log("Order", order);

    // 2. Prevent duplicate payment
    let payment = await Payment.findOne({
      where: { orderId, status: "PENDING" },
    });

    let paywayTranId;

    // 3 create payment
    paywayTranId = `ORD-${Date.now()}`;

    payment = await Payment.create({
      orderId: order.id,
      paywayTranId: paywayTranId,
      method: "ABA_PAYWAY",
      status: "PENDING",
      remark: "Pay via aba payway",
      amount: order.total,
    });

    const req_time = getReqTime();
    console.log("req_time", req_time);
    let paywayItems = JSON.stringify(
      order.orderDetails?.map((detail) => ({
        name: detail.productName,
        quantity: detail.qty,
        price: Number(detail.productPrice),
      })),
    );

    paywayItems = encodeBase64(paywayItems);
    const encodedReturnUrl = `${process.env.FRONTEND_URL}/admin/pos`;

    const paymentPayload = {
      merchant_id: process.env.ABA_PAYWAY_MERCHANT_ID,
      req_time,
      tran_id: paywayTranId,
      amount: Number(order.total).toFixed(2),
      items: paywayItems,
      shipping: "0.00",
      firstname: order.customer?.name || "NA",
      lastname: order.customer?.name || "NA",
      email: order.customer?.email || "NA@gmail.com",
      phone: order.customer?.phone || "000000000",
      type: "purchase",
      view_type: "popup",
      payment_option: "abapay_khqr",
      return_url: encodedReturnUrl,
      cancel_url: `${process.env.FRONTEND_URL}/admin/pos`,
      continue_success_url: `${process.env.FRONTEND_URL}/admin/pos`,
      currency: "USD",
      payment_gate: 0,
    };

    const hash = buildPurchaseHash(paymentPayload);

    return res.json({
      message: "Payment created successfully",
      data: {
        payment,
        payway: {
          action: `${process.env.ABA_PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/purchase`,
          method: "POST",
          target: "aba_webservice",
          id: "aba_merchant_request",
          fields: {
            ...paymentPayload,
            hash,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error", error);
  }
});

module.exports = router;
