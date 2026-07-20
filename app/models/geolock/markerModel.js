const { Sequelize } = require("sequelize");
const sequelize = require("../../geoSeq");

const markerSchema = {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true  },
  longitude: { type: Sequelize.INTEGER, allowNull: false },
  latitude: { type: Sequelize.INTEGER, allowNull: false },
  author: {type: Sequelize.TEXT, allowNull: true},
  adresse: {type: Sequelize.TEXT, allowNull: true},
  accesNbr: {type: Sequelize.INTEGER, allowNull: true},
  createdDate: {type: Sequelize.DATE, allowNull: true}
};
module.exports = sequelize.define("m", markerSchema, {
  tableName: "marker",
  timestamps: false,
  // underscored: true,
});