const fs = require('fs');
const { js_beautify: beautify } = require('js-beautify');
const joaat = require('../lib/joaat');
const CONFIG = require('../config');


const dictionaryFileRawData = fs.readFileSync(`output/${CONFIG.FILE_NAMES.DICTIONARY}`);
const tunablesFileRawData = fs.readFileSync(`output/${CONFIG.FILE_NAMES.ENCRYPTED}`);
const tuneablesProcessing = fs.readFileSync(`output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`);

const dictionary = JSON.parse(dictionaryFileRawData);
const tunablesData = JSON.parse(tunablesFileRawData);
const tunablesDataDecrypted = { ...tunablesData, tunables: {} };
let tunablesDataDecryptedStringified = JSON.stringify(tunablesDataDecrypted).slice(0, -2);
let tunablesWithoutNames = {};
let totalDecryptedTunables = 0;

const TUNABLE_CONTEXT = {};
CONFIG.TUNABLE_CONTEXTS.forEach(context => TUNABLE_CONTEXT[context] = joaat(context));
tunablesData.contentlists[0].forEach((_, i) => {
    const { TUNABLE_CONTENT_CONTEXTS } = CONFIG;
    TUNABLE_CONTEXT[TUNABLE_CONTENT_CONTEXTS[0].concat('_', i)] = joaat(TUNABLE_CONTENT_CONTEXTS[0].concat('_', i))
    TUNABLE_CONTEXT[TUNABLE_CONTENT_CONTEXTS[1].concat('_', i)] = joaat(TUNABLE_CONTENT_CONTEXTS[1].concat('_', i))
});

console.log('Decrypting ...');
for (const [key, value] of Object.entries(tunablesData.tunables)) {
    const hasName = lookupTunable(key, value);
    if (!hasName && !Object.keys(tunablesWithoutNames).includes(key)) tunablesWithoutNames[key] = value;
};

for (const [key, value] of Object.entries(tunablesWithoutNames)) {
    lookupTunable(key, value, true);
}

fs.writeFile(`output/${CONFIG.FILE_NAMES.DECRYPTED}`, beautify(tunablesDataDecryptedStringified.concat('}}')), null, () => {
    if (CONFIG.DEBUG) {
        console.log('\nTotal Encrypted Tunables = ', Object.keys(tunablesData.tunables).length);
        console.log('Total Decrypted Tunables = ', totalDecryptedTunables);
    } else {
        fs.unlinkSync(`output/${CONFIG.FILE_NAMES.ENCRYPTED}`);
        fs.unlinkSync(`output/${CONFIG.FILE_NAMES.DICTIONARY}`);
        fs.unlinkSync(`output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`);
    }
    console.log('\nDone!');
});

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

function findKey(obj, predicate = o => o) {
    return Object.keys(obj).find(key => predicate(obj[key], key, obj))
}
