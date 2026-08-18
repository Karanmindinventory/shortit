require('dotenv').config();
const Hashids = require("hashids");

const salt = process.env.HASHIDS_SALT || "dont-stall-it-gonna-fall";
const minLength = parseInt(process.env.HASHIDS_MIN_LENGTH || "12", 10);
const hashids = new Hashids(salt, minLength);

function encryptorFunction(table_id, id) {
    const valueString = table_id + "0" + id;
    return hashids.encode(Number(valueString))
}
function decryptFunction(code) {
    const value = String(hashids.decode(code)[0]);
    let zeroIndex = value.indexOf('0');

    const table_id = value.substring(0, zeroIndex);
    const id = value.substring(zeroIndex + 1);

    return { "table_id": table_id, "id": id }
}
module.exports = { encryptorFunction, decryptFunction };