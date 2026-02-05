const app = require("express");
const { Order, Customer, OrderDetail } = require("../../models");
const generateDoc = require("../utils/generateOrderDoc");

const router = app.Router();

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
