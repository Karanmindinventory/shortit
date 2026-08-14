const { Sequelize } = require("sequelize");

const sequelizeConnection = new Sequelize('shortIT', 'karan', 'karan8141', {
    host: '127.0.0.1',
    port: '3306',
    dialect: 'mysql',
    logging: false
});

module.exports = { sequelizeConnection };
