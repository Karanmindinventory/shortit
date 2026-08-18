require('dotenv').config();
const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}

const sequelizeConnection = new Sequelize(databaseUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    }
});

module.exports = { sequelizeConnection };
