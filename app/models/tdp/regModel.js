const { Sequelize } = require("sequelize");
const sequelize = require("../sequelize");

const regSchema = {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  reglette_label: { type: Sequelize.STRING(5), allowNull: false },
};
module.exports = sequelize.define("reglettes", regSchema, {
  tableName: "reglettes",
  timestamps: false,
  underscored: true,
});