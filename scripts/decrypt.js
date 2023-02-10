const fs = require('fs');
const upath = require('upath');
const http = require('http-wrapper');
const { js_beautify: beautify } = require('js-beautify');
const aesjs = require('aes-js');
const CONFIG = require('../config');

const key = Buffer.from(CONFIG.KEY, 'hex');

function decryptTunablesToHex(encrypted) {
    const encryptedLength = encrypted.length - (encrypted.length % 16);
    const aesEcb = new aesjs.ModeOfOperation.ecb(key);
    const decryptedBytes = aesEcb.decrypt(encrypted.slice(0, encryptedLength));
    return Buffer.from(decryptedBytes).toString() + encrypted.slice(encryptedLength, encrypted.length).toString();
};

CONFIG.PLATFORMS.forEach(platform => {
    const url = CONFIG.URLS.TUNABLES.replace(new RegExp('{platform}', 'g'), platform);
    const path = upath.normalize(`./output/${CONFIG.FILE_NAMES.ENCRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));
    return http.get(url).then(res => {
        fs.writeFile(path, beautify(decryptTunablesToHex(res.content)), null, () => { if (CONFIG.DEBUG) console.log(`${platform.toUpperCase()} Encrypted Tunables downloaded`); });
    })
});
