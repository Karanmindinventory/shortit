const Hashids = require("hashids");

const hashids = new Hashids("dont-stall-it-gonna-fall", 12);

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