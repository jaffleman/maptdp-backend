const { Sequelize } = require("sequelize");
const sequelize = require("../sequelize");

const repSchema = {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  code_name: { type: Sequelize.STRING(3), allowNull: false },
  long_name: { type: Sequelize.STRING, allowNull: true },
  zip: { type: Sequelize.INTEGER, allowNull: false },
  nbr_salle: { type: Sequelize.INTEGER, allowNull: true },
  address: { type: Sequelize.STRING(400), allowNull: true },
};
module.exports = sequelize.define("repartiteurs", repSchema, {
  tableName: "repartiteurs",
  timestamps: false,
  underscored: true,
});
