const fs = require('fs');
const http = require('http-wrapper');
const { js_beautify: beautify } = require('js-beautify');
const joaat = require('../lib/joaat');
const CONFIG = require('../config');

const dictionary = {};

http.get(CONFIG.URLS.TUNABLE_NAMES).then((response) => {
    response.content.toString().split(/\r?\n/).forEach(line => {
        if (line.length) dictionary[line] = joaat(line);
    });
    if (Object.keys(dictionary).length) fs.writeFile(`output/${CONFIG.FILE_NAMES.DICTIONARY}`, beautify(JSON.stringify(dictionary)), () => console.log('Tunables Dictionary downloaded'));;
});

http.get(CONFIG.URLS.TUNEABLES_PROCESSING).then((response) => {
    fs.writeFile(`output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`, response.content.toString(), () => console.log('Tunables Processing downloaded'));
});
