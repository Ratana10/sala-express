const express = require("express");
const generateOrderDoc = require("../utils/generateOrderDoc");

const { Order, Customer, OrderDetail } = require("../../models");
const router = express.Router();

router.get("/:id/generate", async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    console.log(JSON.stringify(order, null, 2));

    const docBuffer = generateOrderDoc(order);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${order.id}.docx`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.send(docBuffer);
  } catch (error) {
    console.error("Error generating order report", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

module.exports = router;
