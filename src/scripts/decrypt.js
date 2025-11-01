const fs = require('fs');
const upath = require('upath');
const { js_beautify: beautify } = require('js-beautify');
const aesjs = require('aes-js');
const CONFIG = require('../config');
const { get } = require('../utils/http');

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

console.profile("decrypt");
console.log("Getting tunables and UnAES-ing ...")
CONFIG.PLATFORMS.slice(0).forEach(platform => {
    const url = CONFIG.URLS.TUNABLES.replace(new RegExp('{platform}', 'g'), platform);
    const path = upath.normalize(`./${CONFIG.FILE_NAMES.ENCRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));
    return get(url).then(({ buffer }) => {
        fs.writeFile(path, beautify(decryptTunablesToHex(buffer, platform)), null, () => { if (CONFIG.DEBUG) console.log(`${platform.toUpperCase()} Encrypted [hex] Tunables downloaded`); });
    })
});
console.profileEnd("decrypt");
