const { Sequelize } = require("sequelize");
const sequelize = require("../sequelize");

const optSchema = {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  opt_label: { type: Sequelize.STRING(3), allowNull: false },
};
module.exports = sequelize.define("opts", optSchema, {
  tableName: "opts",
  timestamps: false,
  underscored: true,
});