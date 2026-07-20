const { Sequelize } = require("sequelize");
// console.log(process.env.PG_URL);
// Ici on crée l'objet de type sequelize que tout mes models vont utiliser pour communiquer avec la BDD
const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env;

// ✅ ENCODAGE ICI
const encodedPassword = encodeURIComponent(DB_PASSWORD);

const connectionString = `postgres://${DB_USER}:${encodedPassword}@${DB_HOST}/geolockbdd`;

console.log(connectionString); // debug
const geoSeq = new Sequelize(connectionString, {
  // ici on peut rajouter des options
  // comme par exemple des elements que l'on veut ajouter à tout les models
  define: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
});

module.exports = geoSeq;