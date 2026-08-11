const { Sequelize, DataTypes, where } = require("sequelize");
const { encryptorFunction } = require("./encryptor/encryptorFunction");

const sequelizeConnection = new Sequelize('shortIT', 'karan', 'karan8141', {
    host: '127.0.0.1',
    port: '3306',
    dialect: 'mysql',
    logging: false
});

(async function connectionToDB(params) {
    try {
        const connectionOBJ = await sequelizeConnection.authenticate();
        console.log("SQL IS CONNECTED SUCCESFULLY")
        await insertNewData('mahek')
        // await getAllUser()
    } catch (error) {
        console.error(error)
    }
    finally {
        sequelizeConnection.close()
    }
})()

const dummyData = sequelizeConnection.define('dummyData', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    userName: {
        type: DataTypes.STRING(150),
        allowNull: false
    }
}, {
    tableName: 'dummyData',
    timestamps: false
})

async function getAllUser() {
    const user = await dummyData.findAll();
    console.log(JSON.stringify(user, null, 2))
}

async function insertNewData(data) {
    try {
        const newUser = await dummyData.create({
            userName: data
        })
        console.log(newUser?.id)
        console.log(encryptorFunction(newUser?.id))
    } catch (error) {
        console.log(error)
    }
}

async function updateUserName(id, name) {
    try {
        await dummyData.update(
            { userName: name },
            { where: { id: id } }
        )
    } catch (error) {
        console.log(error)
    }
}

async function deleteUser(id) {
    try {
        await dummyData.destroy({
            where: { id: id }
        })
    } catch (error) {
        console.log(error)
    }
}