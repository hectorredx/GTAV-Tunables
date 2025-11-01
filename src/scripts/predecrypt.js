const fs = require('fs');
const upath = require('upath');
const { getGithubFile } = require('../utils');
const joaat = require('../lib/joaat');
const CONFIG = require('../config');
const jobsDictionary = require(upath.normalize(`../static/${CONFIG.FILE_NAMES.JOBS_DICTIONARY}`));
const outpath = upath.normalize(`./src/static/${CONFIG.FILE_NAMES.DICTIONARY}`)

const contexts = {};
const tunables = {};
const jobs = {};
const other = {};

if (!CONFIG.REBUILD_DICTIONARY && fs.existsSync(outpath)) {
    console.log('Rebuild dictionary is disabled. Skipping dictionary generation.');
    process.exit(0);
}

// To help figure out what takes so long.
console.profile("predecrypt");

// Getting TUNABLE_NAMES and GTA_DICTIONARY has no dependency on any other variable,
// so spawn independent promises for them both to speed things up.
const parse_tune_ctx = getGithubFile(CONFIG.URLS.TUNABLE_NAMES).then(function parse_tunables({ text }) {
    for (const line of text.split(/\r?\n/)) {
        if (line.length) {
            const { unsigned: uhash, signed: shash } = joaat(line);
            const hash = joaat.hex(uhash);
            tunables[line] = { hash, sum: {} };
            // Safety
            other[line] = hash;
            for (const context of CONFIG.TUNABLE_CONTEXTS) {
                const contextJoaat = joaat(context);
                // Only signed is used for now, might as well
                contexts[context] = { signed: contextJoaat.signed };
                tunables[line].sum[context] = (uhash + contextJoaat.unsigned).toString(16).toUpperCase();
            }
        }
    }
});

const parse_other_dict = getGithubFile(CONFIG.URLS.GTA_DICTIONARY).then(function parse_gta_dict({ text }) {
    for (const line of text.split(/\r?\n/)) {
        if (line.length) {
            const [hash, key] = line.split('\t');
            other[key] = hash;
        }
    }

    for (const [key, value] of Object.entries(jobsDictionary)) {
        jobs[joaat(key.toLowerCase()).signed] = value;
    }
});

// This one has a potential to fight over "other", but because JS async is single-threaded, nothing bad will happen.
const parse_other_labels = getGithubFile(CONFIG.URLS.GTA_LABELS_DICTIONARY).then(function parse_gta_labels_dict({ text }) {
    for (const line of text.split(/\r?\n/)) {
        if (line.length) {
            other[line] = joaat(line).signed.toString();
        }
    }
});

Promise.all([parse_tune_ctx, parse_other_dict, parse_other_labels]).then(function write_dictionary() {
    fs.writeFile(outpath, JSON.stringify({
        contexts,
        tunables,
        jobs,
        other,
    }, null, CONFIG.DEBUG ? 1 : null), () => { if (CONFIG.DEBUG) console.log('Tunables Dictionary processed'); });
});

console.profileEnd("predecrypt");
