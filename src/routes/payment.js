const app = require("express");
const {
  getReqTime,
  buildPurchaseHash,
  encodeBase64,
  buildCheckTransactionHash,
  buildQrHash,
} = require("../utils/payway");
const { Order, Customer, OrderDetail, Payment } = require("../../models");
const { default: axios } = require("axios");

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
    let payment = await Payment.findOne({
      where: { orderId, status: "PENDING" },
    });

    let paywayTranId;

    //3. Create Payment record
    if (!payment) {
      paywayTranId = `ORD-${Date.now()}`;
      payment = await Payment.create({
        orderId: order.id,
        paywayTranId,
        amount: order.total,
        method,
        status: "PENDING",
      });
    } else {
      paywayTranId = payment.paywayTranId;
    }

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
      // type: "purchase",
      view_type: "popup",
      payment_option: "cards",
      return_url: encodedReturnUrl,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      continue_success_url: `${process.env.FRONTEND_URL}/success-url`,
      currency: "USD",
      payment_gate: 0,
    };

    const hash = buildPurchaseHash(paymentPayload);
    console.log("hash", hash);
    return res.json({
      message: "Payment initiated",
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
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/:tranId/check-transaction", async (req, res) => {
  try {
    const { tranId } = req.params;

    const payment = await Payment.findOne({
      where: { paywayTranId: tranId },
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const req_time = getReqTime();
    const merchant_id = process.env.ABA_PAYWAY_MERCHANT_ID;
    const tran_id = payment.paywayTranId;

    const hash = buildCheckTransactionHash({
      req_time,
      merchant_id,
      tran_id,
    });

    const response = await axios.post(
      `${process.env.ABA_PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/check-transaction-2`,
      {
        req_time,
        merchant_id,
        tran_id,
        hash,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const abaData = response.data;
    const statusCode = abaData?.status?.code;
    const paymentStatusCode = abaData?.data?.payment_status_code;
    const paymentStatus = abaData?.data?.payment_status;

    if (statusCode == "00") {
      if (paymentStatusCode === 0 && paymentStatus === "APPROVED") {
        payment.status = "PAID";
        payment.paidAt = new Date();
      } else if (
        paymentStatus === "DECLINED" ||
        paymentStatus === "FAILED" ||
        paymentStatusCode !== 0
      ) {
        payment.status = "FAILED";
      } else {
        payment.status = "PENDING";
      }

      payment.remark = JSON.stringify(abaData);
      await payment.save();
    }

    return res.json({
      message: "Transaction checked successfully",
      data: {
        localPayment: payment,
        aba: abaData,
      },
    });
  } catch (error) {
    console.error(
      "Check transaction error:",
      error?.response?.data || error.message,
    );

    return res.status(500).json({
      message: "Failed to check transaction",
      error: error?.response?.data || error.message,
    });
  }
});

router.post("/:orderId/generate-qr", async (req, res) => {
  const { orderId } = req.params;
  const { method = "ABA_PAYWAY_QR" } = req.body;

  try {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let payment = await Payment.findOne({
      where: { orderId, status: "PENDING" },
    });

    let paywayTranId;

    if (!payment) {
      paywayTranId = `ORD-${Date.now()}`;
      payment = await Payment.create({
        orderId: order.id,
        paywayTranId,
        amount: order.total,
        method,
        status: "PENDING",
      });
    } else {
      paywayTranId = payment.paywayTranId;
    }

    const req_time = getReqTime();

    const itemsJson = JSON.stringify(
      (order.orderDetails || []).map((detail) => ({
        name: detail.productName,
        quantity: detail.qty,
        price: Number(detail.productPrice),
      })),
    );

    const callbackUrl = `${process.env.BACKEND_URL}/payment/webhook`;

    const qrPayload = {
      req_time,
      merchant_id: process.env.ABA_PAYWAY_MERCHANT_ID,
      tran_id: paywayTranId,
      first_name: order.customer?.name?.split(" ")[0] || "Customer",
      last_name: order.customer?.name?.split(" ").slice(1).join(" ") || "NA",
      email: order.customer?.email || "no-email@example.com",
      phone: order.customer?.phone || "000000000",
      amount: Number(order.total).toFixed(2),
      purchase_type: "purchase",
      payment_option: "abapay_khqr",
      items: encodeBase64(itemsJson),
      currency: "USD",
      callback_url: encodeBase64(callbackUrl),
      return_deeplink: "",
      custom_fields: "",
      return_params: "",
      payout: "",
      lifetime: 30,
      qr_image_template: "template4_color",
    };

    const hash = buildQrHash(qrPayload);

    console.log("QR RAW PAYLOAD:", qrPayload);
    console.log("QR HASH:", hash);

    const abaResponse = await axios.post(
      `${process.env.ABA_PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/generate-qr`,
      {
        ...qrPayload,
        hash,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    return res.json({
      message: "QR generated successfully",
      data: {
        payment,
        qr: abaResponse.data,
      },
    });
  } catch (error) {
    console.error("Generate QR error:", error?.response?.data || error.message);
    return res.status(500).json({
      message: "Failed to generate QR",
      error: error?.response?.data || error.message,
    });
  }
});

module.exports = router;
