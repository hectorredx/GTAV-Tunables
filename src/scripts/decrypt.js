const fs = require('fs');
const upath = require('upath');
const http = require('http-wrapper');
const { js_beautify: beautify } = require('js-beautify');
const aesjs = require('aes-js');
const CONFIG = require('../config');

const key = Buffer.from(CONFIG.KEY, 'hex');

function decryptTunablesToHex(encrypted, platform) {
    const encryptedLength = encrypted.length - (encrypted.length % 16);
    const aesEcb = new aesjs.ModeOfOperation.ecb(key);
    const decryptedBytes = aesEcb.decrypt(encrypted.slice(0, encryptedLength));
    const output = JSON.parse(Buffer.from(decryptedBytes).toString() + encrypted.slice(encryptedLength, encrypted.length).toString());
    return JSON.stringify(
        ['xbox360', 'ps3'].includes(platform)
            ? output
            : {
                ...output,
                tunables: Object.keys(output.tunables).reduce((a, c) => (a[`_0x${c}`] = output.tunables[c][0].value, a), {}),
            }, null, 4);
};

CONFIG.PLATFORMS.slice(CONFIG.DEBUG ? 5 : 0).forEach(platform => {
    const url = CONFIG.URLS.TUNABLES.replace(new RegExp('{platform}', 'g'), platform);
    const path = upath.normalize(`./${CONFIG.FILE_NAMES.ENCRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));
    return http.get(url).then(res => {
        fs.writeFile(path, beautify(decryptTunablesToHex(res.content, platform)), null, () => { if (CONFIG.DEBUG) console.log(`${platform.toUpperCase()} Encrypted Tunables downloaded`); });
    })
});
