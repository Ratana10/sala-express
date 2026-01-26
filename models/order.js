"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsTo(models.Customer, {
        foreignKey: "customerId",
        as: "customer"
      })

      Order.hasMany(models.OrderDetail, {
        foreignKey: "orderId",
        as: "orderDetails"
      })
    }
  }
  Order.init(
    {
      customerId: DataTypes.INTEGER,
      orderNumber: DataTypes.STRING,
      total: DataTypes.DECIMAL(10, 2),
      discount: DataTypes.DECIMAL(10, 2),
      orderDate: DataTypes.DATE,
      location: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Order",
    },
  );
  return Order;
};
