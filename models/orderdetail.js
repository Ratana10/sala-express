"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OrderDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OrderDetail.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "order",
      });
      // OrderDetail belongs to Product
      OrderDetail.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }
  OrderDetail.init(
    {
      orderId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      productName: DataTypes.STRING,
      productPrice: DataTypes.DECIMAL(10, 2),
      qty: DataTypes.INTEGER,
      amount: DataTypes.DECIMAL(10, 2),
    },
    {
      sequelize,
      modelName: "OrderDetail",
    },
  );
  return OrderDetail;
};
