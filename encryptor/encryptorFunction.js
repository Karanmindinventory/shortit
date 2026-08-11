const Hashids = require("hashids");

const hashids = new Hashids("dont-stall-it-gonna-fall", 12);

function encryptorFunction(dataBaseID) {
    return hashids.encode(dataBaseID)
}

function decryptFunction(code) {
    return hashids.decode(code)
}

module.exports = { encryptorFunction, decryptFunction };