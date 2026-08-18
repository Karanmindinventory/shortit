const { DataTypes } = require("sequelize");
const { sequelizeConnection } = require("./config");

const User = sequelizeConnection.define('user', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: true 
});

const Metadata = sequelizeConnection.define('metadata', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    short_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    original_url: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'metadata',
    timestamps: true,
    updatedAt: false 
});

User.hasMany(Metadata, { foreignKey: 'user_id' });
Metadata.belongsTo(User, { foreignKey: 'user_id' });

const syncModels = async () => {
    await User.sync();
    await Metadata.sync();
};

module.exports = {
    User,
    Metadata,
    syncModels
};
