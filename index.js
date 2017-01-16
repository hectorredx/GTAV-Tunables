var http        = require('http-request');
var fs          = require('fs');
var util        = require('./util');
var aesjs       = require('aes-js');
var beautify    = require('js-beautify').js_beautify;
var key         = "F06F12F49B843DADE4A7BE053505B19C9E415C95D93753450A269144D59A0115";

console.log('Fetching latest tunables...');

http.get({
    url: 'http://prod.cloud.rockstargames.com/titles/gta5/pcros/0x1a098062.json',
    progress: function(current,total) {
        console.log('%d% fetched...', Math.round(current / total * 100));
    }
}, function(err, res){
    if(err) {
        console.log('Couldn\'t fetch tunables - strange...');
		return;
    }
    console.log('Done fetching!');
    console.log('Decrypting tunables...');

    var decryptedTunables = decryptTunables(res.buffer);

    if(decryptedTunables.substring(0,5) == 'error') {
        console.log('Couldn\'t decrypt tunables - error: ' + decryptedTunables.substring(6));
        return;
    }
	
	//fs.unlink('tunables.json');
	fs.writeFileSync('tunables.json', beautify(decryptedTunables));
	console.log('Done!');
});

function decryptTunables(encrypted) {
    var encryptedLength = Math.floor(encrypted.length / 16);

    var nipples = new Buffer(encrypted.toString('hex').substring(encryptedLength * 16 * 2), 'hex').toString('utf8'); //Data that is not encrypted (because rockstar doesn't know how to ^16bit)
    var body = new Buffer(encryptedLength * 16);
    for(var c = 0; c < encryptedLength * 16; c++) {
        body[c] = encrypted[c];
    }

    var aesEcb = new aesjs.ModeOfOperation.ecb(new Buffer(key, 'hex'));
    var decryptedBytes = aesEcb.decrypt(body);
    return aesjs.util.convertBytesToString(decryptedBytes) + nipples;
}
