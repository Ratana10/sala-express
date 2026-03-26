const app = require("express");

const router = app.Router();

router.post("/create-payment", async (req, res) => {
  // Business logic
  const {
      amount,
      firstname,
      lastname,
      email,
      phone,
      items = [],
      currency = "USD",
      payment_option = "",
      shipping = "0.00",
      type = "purchase"
    } = req.body;

  const name = req.body.name;
  const isActive = req.body.isActive;

  const created = await Category.create({ name, isActive });

  res.json({
    message: "Category created successfully",
    data: created,
  });
});


module.exports = router;
