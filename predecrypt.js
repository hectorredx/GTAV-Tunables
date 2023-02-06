const fs = require('fs');
const http = require('http-wrapper');
const beautify = require('js-beautify').js_beautify;
const joaat = require('./lib/joaat');

const tunableNamesUrl = 'https://raw.githubusercontent.com/Wildbrick142/V-Tunable-Names/main/tunable_list.txt';
const tuneablesProcessingUrl = 'https://raw.githubusercontent.com/Aure7138/GTAV-Decompiled-Scripts/94da660931956e4d57cdc735479973b135d84723/decompiled_scripts/tuneables_processing.c';

const dictionary = {};

http.get(tunableNamesUrl).then((response) => {
    response.content.toString().split(/\r?\n/).forEach(line => {
        if (line.length) dictionary[line] = joaat(line).hex
    });
    if (Object.keys(dictionary).length) fs.writeFileSync('dictionary.json', beautify(JSON.stringify(dictionary)));
    console.log('Tunables Dictionary downloaded')
})

http.get(tuneablesProcessingUrl).then((response) => {
    fs.writeFileSync('tuneables_processing.c', response.content.toString());
    console.log('Decompiled tuneables_processing.c downloaded')
})
