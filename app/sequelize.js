const { Sequelize } = require("sequelize");

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env;

// ✅ ENCODAGE ICI
const encodedPassword = encodeURIComponent(DB_PASSWORD);

const connectionString = `postgres://${DB_USER}:${encodedPassword}@${DB_HOST}:${DB_PORT}/maptdpbdd`;

console.log(connectionString); // debug

const sequelize = new Sequelize(connectionString, {
  define: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
});

module.exports = sequelize;
