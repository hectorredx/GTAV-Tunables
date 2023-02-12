const fs = require('fs');
const upath = require('upath');
const http = require('http-wrapper');
const joaat = require('../lib/joaat');
const jobsDictionary = require('../static/jobs_dictionary.json');
const CONFIG = require('../config');

const dictionary = { contexts: {}, tunables: {}, jobs: {}, other: {} };

http.get(CONFIG.URLS.TUNABLE_NAMES).then((response) => {
    // TODO: Remove CH_* Tunables once they get added to the tunable names list
    response.content.toString().split(/\r?\n/).concat([
        'CH_VAULT_WEIGHTING_ART',
        'CH_VAULT_WEIGHTING_CASH',
        'CH_VAULT_WEIGHTING_GOLD',
        'CH_VAULT_WEIGHTING_DIAMONDS',
    ]).forEach(line => {
        if (line.length) {
            const { hex: hash } = joaat(line);
            dictionary.tunables[line] = { hash, sum: {} };
            const sumHex = (x, y) => (parseInt(x, 16) + parseInt(y, 16)).toString(16).toLocaleUpperCase();
            for (context of CONFIG.TUNABLE_CONTEXTS) {
                const contextJoaat = joaat(context);
                dictionary.contexts[context] = contextJoaat;
                dictionary.tunables[line].sum[context] = sumHex(hash, contextJoaat.hex);
            }
        }
    });

    http.get(CONFIG.URLS.GTA_DICTIONARY).then((response) => {
        response.content.toString().split(/\r?\n/).forEach((line, index) => {
            if (line.length && index) {
                const [hash, key] = line.split(/\t/);
                dictionary.other[key] = hash;
            }
        });
        for (const [key, value] of Object.entries(jobsDictionary)) {
            dictionary.jobs[joaat(key.toLowerCase()).signed] = value;
        }
        if (Object.keys(dictionary).length) fs.writeFile(upath.normalize(`./output/${CONFIG.FILE_NAMES.DICTIONARY}`), JSON.stringify(dictionary), () => { if (CONFIG.DEBUG) console.log('Tunables Dictionary downloaded'); });
    });
});



http.get(CONFIG.URLS.TUNEABLES_PROCESSING).then((response) => {
    fs.writeFile(upath.normalize(`./output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`), response.content.toString(), () => { if (CONFIG.DEBUG) console.log('Tunables Processing downloaded'); });
});
