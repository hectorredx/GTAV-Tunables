const fs = require('fs');
const beautify = require('js-beautify').js_beautify;
const _findKey = require('lodash').findKey;
const _set = require('lodash').set;
const joaat = require('../lib/joaat');
const CONFIG = require('../config');

const TUNABLE_CONTEXT = {};
CONFIG.TUNABLE_CONTEXTS.forEach(context => TUNABLE_CONTEXT[context] = joaat(context));

const dictionaryFileRawData = fs.readFileSync(`output/${CONFIG.FILE_NAMES.DICTIONARY}`);
const dictionary = JSON.parse(dictionaryFileRawData);
const tuneablesProcessing = fs.readFileSync(`output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`);
let tunablesData = {};
let tunablesDataDecrypted = {};

const tunablesFileRawData = fs.readFileSync(`output/${CONFIG.FILE_NAMES.ENCRYPTED}`);
tunablesData = JSON.parse(tunablesFileRawData);
tunablesDataDecrypted = { ...tunablesData, tunables: {} };

tunablesData.contentlists[0].forEach((_, i) => {
    const { TUNABLE_CONTENT_CONTEXTS } = CONFIG;
    TUNABLE_CONTEXT[TUNABLE_CONTENT_CONTEXTS[0].concat('_', i)] = joaat(TUNABLE_CONTENT_CONTEXTS[0].concat('_', i))
    TUNABLE_CONTEXT[TUNABLE_CONTENT_CONTEXTS[1].concat('_', i)] = joaat(TUNABLE_CONTENT_CONTEXTS[1].concat('_', i))
});

let totalDecryptedTunables = 0;
let notFound = {};

console.log('Decrypting ...');
for (const [key, value] of Object.entries(tunablesData.tunables)) {
    let found = false;
    for (const [contextKey, contextValue] of Object.entries(TUNABLE_CONTEXT)) {
        const hashSigned = parseInt(key, 16) - contextValue.signed;
        const hashUnsigned = parseInt(key, 16) - contextValue.unsigned;
        const tunableName = _findKey(dictionary, (x) => x.signed == hashSigned || x.unsigned == hashUnsigned);
        if (tunableName) {
            _set(tunablesDataDecrypted.tunables, `${contextKey}.${tunableName}`, value);
            found = true;
            totalDecryptedTunables++;
            break;
        }
    }
    if (!found && !Object.keys(notFound).includes(key)) notFound[key] = value;
};

console.log('\nTotal Encrypted Tunables = ', Object.keys(tunablesData.tunables).length);
console.log('Total Decrypted Tunables = ', totalDecryptedTunables);
console.log('Total Not Found Tunables = ', Object.keys(notFound).length);

fs.writeFile(`output/${CONFIG.FILE_NAMES.DECRYPTED}`, beautify(JSON.stringify(tunablesDataDecrypted)), null, () => console.log('\nDone!'))
fs.writeFile(`output/${CONFIG.FILE_NAMES.NOT_FOUND}`, beautify(JSON.stringify(notFound)), null, () => console.log(''));
fs.unlinkSync(`output/${CONFIG.FILE_NAMES.DICTIONARY}`);
fs.unlinkSync(`output/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`);
