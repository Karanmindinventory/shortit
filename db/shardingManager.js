const { sequelizeConnection } = require("./config");
const { DataTypes, QueryTypes } = require("sequelize");

const MAX_ROWS_PER_TABLE = 25000;

const ShardMetadata = sequelizeConnection.define('shard_metadata', {
    active_table_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    current_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'shard_metadata',
    timestamps: false
});

async function initializeShards() {
    await ShardMetadata.sync();

    const metadata = await ShardMetadata.findOne();
    if (!metadata) {
        await ShardMetadata.create({
            active_table_id: '1',
            current_count: 0
        });
    }

    await createDataTable('1');
}

async function createDataTable(tableName) {
    const query = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            original_url TEXT NOT NULL
        ) ENGINE=InnoDB;
    `;
    await sequelizeConnection.query(query);
}

function getNextSafeTableName(currentName) {
    let num = parseInt(currentName, 10);
    while (true) {
        num++;
        if (!num.toString().includes('0')) {
            return num.toString();
        }
    }
}

async function insertUrl(url) {
    let metadata = await ShardMetadata.findOne();

    if (metadata.current_count >= MAX_ROWS_PER_TABLE) {
        const newTableName = getNextSafeTableName(metadata.active_table_id);
        await createDataTable(newTableName);

        await metadata.destroy();
        metadata = await ShardMetadata.create({
            active_table_id: newTableName,
            current_count: 0
        });
    }

    const currentTable = metadata.active_table_id;

    const insertQuery = `INSERT INTO \`${currentTable}\` (original_url) VALUES (?)`;
    const [result] = await sequelizeConnection.query(insertQuery, {
        replacements: [url],
        type: QueryTypes.INSERT
    });

    const newId = result;
    await metadata.increment('current_count');

    return { table_id: currentTable, id: newId };
}

async function getUrl(table_id, id) {
    const selectQuery = `SELECT * FROM \`${table_id}\` WHERE id = ?`;
    const rows = await sequelizeConnection.query(selectQuery, {
        replacements: [id],
        type: QueryTypes.SELECT
    });

    if (rows && rows.length > 0) {
        return rows[0].original_url;
    }
    return null;
}

module.exports = {
    initializeShards,
    insertUrl,
    getUrl
};
