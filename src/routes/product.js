const app = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { Product, ProductImage, Category } = require("../../models");
const { Op } = require("sequelize");

const router = app.Router();

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    let whereCondition = {};
    if (req.query.search) {
      whereCondition.name = {
        [Op.iLike]: `%${req.query.search}%`,
      };
    }

    if(req.query.categoryId){
      whereCondition.categoryId = {
        [Op.eq]: req.query.categoryId,
      }
    }

    const offset = (page - 1) * limit;

    const { rows: products, count: total } = await Product.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      include: [
        {
          model: Category,
          as: "category",
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
      fileName: file.name,
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

    console.log("Image data", image);
    res.download(filePath, image.fileName);
  } catch (error) {}
});
module.exports = router;
