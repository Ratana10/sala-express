const express = require("express");
const path = require("path");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const { Product, Category, ProductImage } = require("../../models");

router.post("/:productId/images", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const image = req.files.image;

    // Validate image type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(image.mimetype)) {
      return res.status(400).json({ message: "Invalid image type" });
    }

    // path.extname() រក្សាទុក extension (.jpg, .png)

    const fileName = `${uuidv4()}${path.extname(image.name)}`;

    // file will save to project-root/uploads/products/
    const uploadPath = path.join(process.cwd(), "uploads/products", fileName);

    await image.mv(uploadPath);

    // បង្កើត URL រូបភាព (domain + path)
    // http://localhost:3000/uploads/products/uuid.jpg
    const domain = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${domain}/uploads/products/${fileName}`;

    const savedImage = await ProductImage.create({
      productId,
      imageUrl,
    });

    res.json({
      message: "Product image uploaded successfully",
      data: savedImage,
    });
  } catch (error) {
    console.error("Upload product image error:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
});

router.post("/:productId/images/multiple", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!req.files || !req.files.images) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Normalize to array
    const images = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const domain = `${req.protocol}://${req.get("host")}`;

    const savedImages = [];

    for (const image of images) {
      // Validate type
      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({
          message: `Invalid file type: ${image.name}`,
        });
      }

      const fileName = `${uuidv4()}${path.extname(image.name)}`;

      const uploadPath = path.join(process.cwd(), "uploads/products", fileName);

      await image.mv(uploadPath);

      const imageUrl = `${domain}/uploads/products/${fileName}`;

      const saved = await ProductImage.create({
        productId,
        imageUrl,
      });

      savedImages.push(saved);
    }

    res.json({
      message: "Product images uploaded successfully",
      data: savedImages,
    });
  } catch (error) {
    console.error("Upload multiple product images error:", error);
    res.status(500).json({ message: "Multiple image upload failed" });
  }
});

router.get("/images/:imageId/download", async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await ProductImage.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Extract filename safely
    // pop() យក element ចុងក្រោយ
    const fileName = image.imageUrl.split("/").pop();

    // បង្កើត Path ពេញលេញទៅ File
    const filePath = path.join(process.cwd(), "uploads/products", fileName);

    // Check file exists
    // /project-root/uploads/products/uuid.jpg
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Download file
    // រក្សាទុក filename ដើម
    res.download(filePath, fileName);
  } catch (error) {
    console.error("Download product image error:", error);
    res.status(500).json({ message: "Download failed" });
  }
});

router.delete("/images/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;

    // 1. Find image in DB
    const image = await ProductImage.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // 2. Extract filename from imageUrl
    const fileName = image.imageUrl.split("/").pop();

    const filePath = path.join(process.cwd(), "uploads/products", fileName);

    // 3. Delete file from disk (if exists)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 4. Delete record from DB
    await image.destroy();

    res.json({
      message: "Product image deleted successfully",
    });
  } catch (error) {
    console.error("Delete product image error:", error);
    res.status(500).json({ message: "Delete image failed" });
  }
});

module.exports = router;
