const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const dayjs = require("dayjs");

const generateOrderDoc = (order) => {
  const templatePath = path.join(__dirname, "../templates/order-template.docx");

  const content = fs.readFileSync(templatePath, "binary");

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    orderNumber: order.orderNumber,
    orderDetails: order.orderDetails,
    total: order.total,
    date: dayjs(order.orderDate).format("DD MMM YYYY"),
  });

  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buffer;
};

module.exports = generateOrderDoc;
