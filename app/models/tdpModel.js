const { Sequelize } = require("sequelize");
const sequelize = require("../sequelize");

const tdpSchema = {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  rep: { type: Sequelize.INTEGER, allowNull: false },
  reglette_type: { type: Sequelize.INTEGER, allowNull: false },
  reglette_nbr: { type: Sequelize.STRING(2), allowNull: false },
  salle: { type: Sequelize.INTEGER, allowNull: false },
  rco: { type: Sequelize.INTEGER, allowNull: false },
  ferme: { type: Sequelize.INTEGER, allowNull: false },
  level: { type: Sequelize.INTEGER, allowNull: false },
  opts: { type: Sequelize.INTEGER, allowNull: true },
};
module.exports = sequelize.define("tdps", tdpSchema, {
  tableName: "tdps",
  timestamps: false,
  underscored: true,
});
