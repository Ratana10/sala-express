const app = require("express");
const { Product, ProductImage, Category } = require("../../models");
const { Op, fn, col, where } = require("sequelize");
const multer = require("multer");

const { storage, cloudinary } = require("../../src/storage/storage");

const upload = multer({ storage });

const router = app.Router();

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    let whereCondition = {};

    if (req.query.search) {
      const search = req.query.search.replace(/\s+/g, "").toLowerCase();

      whereCondition = where(
        fn("REPLACE", fn("LOWER", col("Product.name")), " ", ""),
        {
          [Op.like]: `%${search}%`,
        },
      );
    }

    if (req.query.categoryId) {
      whereCondition.categoryId = {
        [Op.eq]: req.query.categoryId,
      };
    }

    const offset = (page - 1) * limit;

    const { rows: products, count: total } = await Product.findAndCountAll({
      where: whereCondition,
      distinct: true,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: ProductImage,
          as: "productImages",
          attributes: ["id", "productId", "imageUrl", "fileName", "publicId"],
        },
      ],
    });
    const totalPages = Math.ceil(total / limit);

    res.json({
      message: "Product fetched successfully",
      data: products,
      pagination: {
        currentPage: page,
        limit,
        total,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    });
  } catch (error) {
    console.log("Creating product error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("", async (req, res) => {
  router; // const name = req.body.name
  // const price = req.body.price
  // const categroyId = req.body.categroyId
  try {
    const { name, price, categoryId, isActive, qty } = req.body;

    const createdProduct = await Product.create({
      name,
      price,
      categoryId,
      qty,
      isActive,
    });
    res.json({
      message: "Product created successfully",
      data: createdProduct,
    });
  } catch (error) {
    console.log("Creating product error:", error);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, categoryId, isActive, qty } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        message: `Product id=${id} not found`,
      });
    }

    await product.update({
      name,
      price,
      categoryId,
      qty,
      isActive,
    });

    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
        },
      ],
    });

    res.json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.log("Updating product error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Image upload
router.post("/:id/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    const productId = req.params.id;

    // validate product id
    const product = await Product.findByPk(productId);
    if (!product) {
      res.json({
        message: `Product id=${productId} not found`,
      });
    }

    console.log("File", file);

    const savedImage = await ProductImage.create({
      productId,
      imageUrl: file.path,
      fileName: file.originalname,
      publicId: file.filename,
    });

    res.json({
      message: "Upload image successfully",
      data: savedImage,
    });
  } catch (error) {
    console.log("Upload image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/images/:imageId/download", async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await ProductImage.findByPk(imageId);
    if (!image) {
      return res.status(404).json({
        message: `Product image id=${imageId} not found`,
      });
    }

    return res.redirect(image.imageUrl);
  } catch (error) {
    console.log("Download image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/images/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await ProductImage.findOne({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({
        message: `Product Image id=${imageId} not found`,
      });
    }

    await cloudinary.uploader.destroy(image.publicId);
    await image.destroy();

    return res.json({
      message: "Product Image deleted successfully",
    });
  } catch (error) {
    console.log("Delete image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
