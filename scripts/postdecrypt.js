const fs = require('fs');
const upath = require('upath');
const { js_beautify: beautify } = require('js-beautify');
const joaat = require('../lib/joaat');
const CONFIG = require('../config');


const dictionaryFileRawData = fs.readFileSync(upath.normalize(`./output/${CONFIG.FILE_NAMES.DICTIONARY}`));
const tuneablesProcessing = fs.readFileSync(upath.normalize(`./output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`));

const dictionary = JSON.parse(dictionaryFileRawData);
let tunablesDataDecryptedStringified;
let totalDecryptedTunables;
let TUNABLE_CONTEXT = {};

console.log('Decrypting ...');

CONFIG.PLATFORMS.forEach((platform, index) => {
    const encryptedPath = upath.normalize(`./output/${CONFIG.FILE_NAMES.ENCRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));
    const decryptedPath = upath.normalize(`./output/${CONFIG.FILE_NAMES.DECRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));

    if (['ps3', 'xbox360'].includes(platform)) {
        fs.renameSync(encryptedPath, decryptedPath);
    } else {
        const tunablesFileRawData = fs.readFileSync(encryptedPath);
        const tunablesData = JSON.parse(tunablesFileRawData);
        const tunablesDataDecrypted = { ...tunablesData, tunables: {} };
        tunablesDataDecryptedStringified = JSON.stringify(tunablesDataDecrypted).slice(0, -2);
        totalDecryptedTunables = 0;
        let tunablesWithoutNames = {};
        TUNABLE_CONTEXT = {};
        CONFIG.TUNABLE_CONTEXTS.forEach(context => TUNABLE_CONTEXT[context] = joaat(context));
        tunablesData.contentlists[0].forEach((_, i) => {
            const { TUNABLE_CONTENT_CONTEXTS } = CONFIG;
            TUNABLE_CONTEXT[TUNABLE_CONTENT_CONTEXTS[0].concat('_', i)] = joaat(TUNABLE_CONTENT_CONTEXTS[0].concat('_', i))
            TUNABLE_CONTEXT[TUNABLE_CONTENT_CONTEXTS[1].concat('_', i)] = joaat(TUNABLE_CONTENT_CONTEXTS[1].concat('_', i))
        });

        for (const [key, value] of Object.entries(tunablesData.tunables)) {
            const hasName = lookupTunable(key, value);
            if (!hasName && !Object.keys(tunablesWithoutNames).includes(key)) tunablesWithoutNames[key] = value;
        };

        for (const [key, value] of Object.entries(tunablesWithoutNames)) {
            lookupTunable(key, value, true);
        }

        fs.writeFileSync(decryptedPath, beautify(tunablesDataDecryptedStringified.concat('}}')));
        console.log(`\n${platform.toUpperCase()} Tunables Decrypted`)
        if (CONFIG.DEBUG) {
            console.log('\nTotal Encrypted Tunables = ', Object.keys(tunablesData.tunables).length);
            console.log('Total Decrypted Tunables = ', totalDecryptedTunables);
        } else {
            fs.unlinkSync(encryptedPath);
            if (index === CONFIG.PLATFORMS.length - 1) {
                fs.unlinkSync(upath.normalize(`./output/${CONFIG.FILE_NAMES.DICTIONARY}`));
                fs.unlinkSync(upath.normalize(`./output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`));
            }
        }
    }
});

if (!CONFIG.DEBUG) updateReadMe();
console.log('\nDone!');

function lookupTunable(key, value, missingName = false) {
    for (const [contextKey, contextValue] of Object.entries(TUNABLE_CONTEXT)) {
        const hashSigned = parseInt(key, 16) - contextValue.signed;
        const hashUnsigned = parseInt(key, 16) - contextValue.unsigned;
        if (missingName) {
            const isHashInTuneablesProcessing = tuneablesProcessing.includes(hashSigned) || tuneablesProcessing.includes(hashUnsigned);
            if (isHashInTuneablesProcessing) {
                const hash = tuneablesProcessing.includes(hashSigned) ? hashSigned : hashUnsigned;
                tunablesDataDecryptedStringified = stringify(tunablesDataDecryptedStringified, contextKey, hash, value);
                totalDecryptedTunables++;
                return true;;
            }
        } else {
            const tunableName = findKey(dictionary, (x) => x.signed == hashSigned || x.unsigned == hashUnsigned);
            if (tunableName) {
                tunablesDataDecryptedStringified = stringify(tunablesDataDecryptedStringified, contextKey, tunableName, value);
                totalDecryptedTunables++;
                return true;
            }
        }
    }
    return false;
}

function stringify(mainString, context, key, value) {
    const valueString = ['boolean', 'number'].includes(typeof value[0].value) ? value[0].value : `"${value[0].value}"`;
    if (mainString.includes(context)) {
        const first = mainString.substring(0, mainString.indexOf(`"${context}":`));
        const last = mainString.substring(mainString.indexOf(`"${context}":`));
        return first.concat(last.replace('}]}', `}],"${key}": [{"value":${valueString}}]}`));
    } else {
        return mainString.concat(mainString.endsWith('{') ? '' : ',', `"${context}":{"${key}": [{"value":${valueString}}]}`);
    }
}

function updateReadMe() {
    const readMePath = './README.md';
    const readMeFile = fs.readFileSync(readMePath);
    const date = new Date();
    const dateFormatted = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    const dateLine = readMeFile.toString().split(/\r?\n/).find(line => line.includes(date.getFullYear()));
    const dateLineUpdated = dateLine.substring(0, dateLine.indexOf(date.getFullYear()) - 8).concat(dateFormatted);
    fs.writeFileSync(readMePath, readMeFile.toString().replace(dateLine, dateLineUpdated));
}

function findKey(obj, predicate = o => o) {
    return Object.keys(obj).find(key => predicate(obj[key], key, obj))
}
