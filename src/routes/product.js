const app = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { Product, ProductImage } = require("../../models");

const router = app.Router();

// Image upload
router.post("/:id/upload", async (req, res) => {
  try {
    // const file = req.files.file;
    // const productId = req.files.productId

    const { file } = req.files;
    const productId = req.params.id;

    // validate product id
    const product = await Product.findByPk(productId);
    if (!product) {
      res.json({
        message: `Product id=${productId} not found`,
      });
    }

    console.log("File", file);

    // UUI + file extension
    const fileName = `${uuidv4()}${path.extname(file.name)}`;

    //  Upload file to folder uploads/products
    //  Create file upload path
    const uploadPath = path.join(process.cwd(), "uploads/products", fileName);

    await file.mv(uploadPath);

    // Domain + fileName // domain.com/uploads/products/9871923712.png
    const domain = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${domain}/uploads/products/${fileName}`;

    const savedImage = await ProductImage.create({
      productId,
      imageUrl,
    });

    res.json({
      message: "Upload image successfully",
      data: savedImage,
    });
  } catch (error) {}
});

router.get("/images/:imageId/download", async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await ProductImage.findByPk(imageId);
    if (!image) {
      res.json({
        message: `Product image id=${imageId} not found`,
      });
    }

    const fileName = image.imageUrl.split("/").pop();
    console.log("File name", fileName);

    const filePath = path.join(process.cwd(), "uploads/products", fileName);

    if (!fs.existsSync(filePath)) {
      res.json({
        message: "File not found",
      });
    }

    res.download(filePath, fileName);


  } catch (error) {}
});
module.exports = router;
