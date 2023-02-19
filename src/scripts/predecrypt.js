const fs = require('fs');
const upath = require('upath');
const http = require('http-wrapper');
const joaat = require('../lib/joaat');
const CONFIG = require('../config');
const jobsDictionary = require(upath.normalize(`../static/${CONFIG.FILE_NAMES.JOBS_DICTIONARY}`));

const contexts = {};
const tunables = {};
const jobs = {};
const other = {};

http.get(CONFIG.URLS.TUNABLE_NAMES).then((response) => {
    for (const line of response.content.toString().split(/\r?\n/)) {
        if (line.length) {
            const { hex: hash } = joaat(line);
            tunables[line] = { hash, sum: {} };
            const sumHex = (x, y) => (parseInt(x, 16) + parseInt(y, 16)).toString(16).toLocaleUpperCase();
            for (context of CONFIG.TUNABLE_CONTEXTS) {
                const contextJoaat = joaat(context);
                contexts[context] = contextJoaat;
                tunables[line].sum[context] = sumHex(hash, contextJoaat.hex);
            }
        }
    }

    http.get(CONFIG.URLS.GTA_DICTIONARY).then((response) => {
        for (const line of response.content.toString().split(/\r?\n/)) {
            if (line.length) {
                const [hash, key] = line.split(/\t/);
                other[key] = hash;
            }
        };

        for (const [key, value] of Object.entries(jobsDictionary)) {
            jobs[joaat(key.toLowerCase()).signed] = value;
        }

        http.get(CONFIG.URLS.GTA_LABELS_DICTIONARY).then((response) => {
            for (const line of response.content.toString().split(/\r?\n/)) {
                if (line.length) {
                    other[line] = joaat(line).signed.toString();
                }
            };

            fs.writeFile(upath.normalize(`./src/static/${CONFIG.FILE_NAMES.DICTIONARY}`), JSON.stringify({
                contexts,
                tunables,
                jobs,
                other,
            }), () => { if (CONFIG.DEBUG) console.log('Tunables Dictionary downloaded'); });
        });

    });
});
