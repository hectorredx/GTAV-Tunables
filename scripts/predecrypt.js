const fs = require('fs');
const http = require('http-wrapper');
const beautify = require('js-beautify').js_beautify;
const joaat = require('../lib/joaat');

const filename = 'dictionary.json';
const tunableNamesUrl = 'https://raw.githubusercontent.com/Wildbrick142/V-Tunable-Names/main/tunable_list.txt';

const dictionary = {};

http.get(tunableNamesUrl).then((response) => {
    response.content.toString().split(/\r?\n/).forEach(line => {
        if (line.length) dictionary[line] = joaat(line);
    });
    if (Object.keys(dictionary).length) fs.writeFileSync(`output/${filename}`, beautify(JSON.stringify(dictionary)));
    console.log('Tunables Dictionary downloaded');
});
