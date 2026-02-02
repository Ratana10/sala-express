const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProductImage extends Model {
    static associate(models) {
      // Define association here
      ProductImage.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  ProductImage.init(
    {
      imageUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ProductImage",
      tableName: "ProductImages",
      timestamps: true,
    },
  );

  return ProductImage;
};
