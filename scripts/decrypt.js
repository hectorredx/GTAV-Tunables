const fs = require('fs');
const http = require('http-wrapper');
const beautify = require('js-beautify').js_beautify;
const aesjs = require('aes-js');

const key = Buffer.from('F06F12F49B843DADE4A7BE053505B19C9E415C95D93753450A269144D59A0115', 'hex');
const url = 'http://prod.cloud.rockstargames.com/titles/gta5/pcros/0x1a098062.json';

function decryptTunables(encrypted) {
    const encryptedLength = encrypted.length - (encrypted.length % 16);
    const aesEcb = new aesjs.ModeOfOperation.ecb(key);
    const decryptedBytes = aesEcb.decrypt(encrypted.slice(0, encryptedLength));
    return Buffer.from(decryptedBytes).toString() + encrypted.slice(encryptedLength, encrypted.length).toString();
};


http.get(url).then(res => {
    const filename = 'tunables-encrypted.json';
    let decrypted = decryptTunables(res.content);
    const beautified = beautify(decrypted);
    fs.writeFile(`output/${filename}`, beautified, null, () => console.log('Encrypted Tunables downloaded'));
});
