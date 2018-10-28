const fs = require('fs');
const http = require('./lwp');
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

console.log('Download Tunables...');
http.get(url).then(res => {
	const filename = `tunables-${new Date().getTime()}.json`;
	console.log('Done!\nDecrypting Files...');
	let decrypted = decryptTunables(res.content);
	console.log('Done!\nBeautify it...');
	const beautified = beautify(decrypted);
	console.log('Done!\nWrite to File ...');
	fs.writeFile(filename, beautified, null, () => console.log(`Done!\n${filename}`));
});