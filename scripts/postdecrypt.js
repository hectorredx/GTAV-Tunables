const fs = require('fs');
const upath = require('upath');
const { js_beautify: beautify } = require('js-beautify');
const CONFIG = require('../config');


const dictionaryFileRawData = fs.readFileSync(upath.normalize(`./output/${CONFIG.FILE_NAMES.DICTIONARY}`));
const tuneablesProcessing = fs.readFileSync(upath.normalize(`./output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`));

const dictionary = JSON.parse(dictionaryFileRawData);
let tunablesDataDecryptedStringified;
let totalDecryptedTunables;

console.log('Decrypting ...');

CONFIG.PLATFORMS.slice(CONFIG.DEBUG ? 6 : 0).forEach((platform, index) => {
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

        for (const [key, value] of Object.entries(tunablesData.tunables)) {
            const hasName = lookupTunable(key, value);
            if (!hasName && !Object.keys(tunablesWithoutNames).includes(key)) tunablesWithoutNames[key] = value;
        };

        for (const [key, value] of Object.entries(tunablesWithoutNames)) {
            lookupTunable(key, value, true);
        }

        fs.writeFileSync(decryptedPath, beautify(tunablesDataDecryptedStringified.concat('}}'), { indent_size: 2 }));
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
    for (const [contextKey, contextValue] of Object.entries(dictionary.contexts)) {
        if (missingName) {
            const hashSigned = parseInt(key, 16) - contextValue.signed;
            const hashUnsigned = parseInt(key, 16) - contextValue.unsigned;
            const isHashInTuneablesProcessing = tuneablesProcessing.includes(hashSigned) || tuneablesProcessing.includes(hashUnsigned);
            if (isHashInTuneablesProcessing) {
                tunablesDataDecryptedStringified = stringify(tunablesDataDecryptedStringified, contextKey, hashSigned, value);
                totalDecryptedTunables++;
                return true;;
            }
        } else {
            const dictionaryKey = findKey(dictionary.tunables, x => x.sum[contextKey].includes(key));
            if (dictionaryKey) {
                if (CONFIG.DEBUG) console.log(`found key ${key} in ${contextKey} as ${dictionaryKey}`);
                tunablesDataDecryptedStringified = stringify(tunablesDataDecryptedStringified, contextKey, dictionaryKey, value);
                totalDecryptedTunables++;
                return true;
            }
        }
    }
    return false;
}

// Workaround Node.js large string size limit when stringifying with JSON.stringify
function stringify(mainString, context, key, value) {
    const valueString = ['boolean', 'number'].includes(typeof value[0].value) ? value[0].value : `"${value[0].value}"`;
    if (mainString.includes(context)) {
        const first = mainString.substring(0, mainString.indexOf(`"${context}":`));
        const last = mainString.substring(mainString.indexOf(`"${context}":`));
        return first.concat(last.replace('}', `,"${key}":${valueString}}`));
    } else {
        return mainString.concat(mainString.endsWith('{') ? '' : ',', `"${context}":{"${key}":${valueString}}`);
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
