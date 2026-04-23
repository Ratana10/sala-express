const axios = require("axios");

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendOrderNotification(order, orderDetails) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

  const itemLines = orderDetails
    .map((item) => `  • ${item.productName} x${item.qty} = $${Number(item.amount).toFixed(2)}`)
    .join("\n");

  const subtotal = Number(order.total).toFixed(2);
  const discount = Number(order.discount || 0).toFixed(2);
  const grandTotal = (Number(order.total) - Number(order.discount || 0)).toFixed(2);

  const text =
    `<b>New Order Created</b>\n` +
    `Order: <code>${order.orderNumber}</code>\n\n` +
    `<b>Items:</b>\n${itemLines}\n\n` +
    `Subtotal: <b>$${subtotal}</b>\n` +
    `Discount: <b>$${discount}</b>\n` +
    `Total: <b>$${grandTotal}</b>`;

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: "HTML",
  });
}

module.exports = { sendOrderNotification };
