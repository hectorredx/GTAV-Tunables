const fs = require('fs');
const http = require('http-wrapper');
const beautify = require('js-beautify').js_beautify;
const aesjs = require('aes-js');
const CONFIG = require('../config');

const key = Buffer.from(CONFIG.KEY, 'hex');
const url = CONFIG.URLS.TUNABLES.replace(new RegExp('{platform}', 'g'), CONFIG.PLATFORMS[6]);

function decryptTunables(encrypted) {
    const encryptedLength = encrypted.length - (encrypted.length % 16);
    const aesEcb = new aesjs.ModeOfOperation.ecb(key);
    const decryptedBytes = aesEcb.decrypt(encrypted.slice(0, encryptedLength));
    return Buffer.from(decryptedBytes).toString() + encrypted.slice(encryptedLength, encrypted.length).toString();
};


http.get(url).then(res => {
    let decrypted = decryptTunables(res.content);
    const beautified = beautify(decrypted);
    fs.writeFile(`output/${CONFIG.FILE_NAMES.ENCRYPTED}`, beautified, null, () => console.log('Encrypted Tunables downloaded'));
});
