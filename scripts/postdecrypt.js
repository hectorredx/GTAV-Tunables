const fs = require('fs');
const beautify = require('js-beautify').js_beautify;
const _findKey = require('lodash').findKey;
const _set = require('lodash').set;
const joaat = require('../lib/joaat');

const FILE_NAME_IN = `tunables-encrypted.json`;
const FILE_NAME_OUT = `tunables-decrypted.json`;
const FILE_NAME_DICTIONARY = `dictionary.json`;
const FILE_NAME_NOT_FOUND = `tunables-not-found.json`;

const CONTENT_MODIFIER_CONTEXT_BASE = 'CONTENT_MODIFIER_';

const TUNABLE_CONTEXT = {
    BASE_GLOBALS: 190769267,
    MP_Global: 953070135,
    CD_GLOBAL: 3819947453,
    MP_CNC: 1398379561,
    MP_CNC_TEAM_COP: 3999338632,
    MP_CNC_TEAM_VAGOS: 3137655631,
    MP_CNC_TEAM_LOST: 988790432,
    MP_FM: 1140746429,
    MP_FM_MEMBERSHIP: 3749990885,
    MP_FM_DM: 1882254284,
    MP_FM_RACES: 3273869472,
    MP_FM_RACES_CAR: 1031194139,
    MP_FM_RACES_BIKE: 3348486140,
    MP_FM_RACES_CYCLE: 3930343106,
    MP_FM_RACES_AIR: 4095171771,
    MP_FM_RACES_SEA: 3428321850,
    MP_FM_RACES_STUNT: 1144300534,
    MP_FM_MISSIONS: 539878179,
    MP_FM_SURVIVAL: 571975921,
    MP_FM_BASEJUMP: 818280646,
    MP_FM_CAPTURE: 4110989209,
    MP_FM_LTS: 4242440179,
    MP_FM_HEIST: 3899532542,
    MP_FM_CONTACT: 3184633077,
    MP_FM_RANDOM: 2912660566,
    MP_FM_VERSUS: 1453550531,
    MP_FM_GANG_ATTACK: 1744317449,
    MP_FMADVERSARY: 2615070496,
};
const TUNABLE_DYNAMIC_CONTEXT_CONTENT_MODIFIER = {};

const dictionaryFileRawData = fs.readFileSync(`output/${FILE_NAME_DICTIONARY}`);
const dictionary = JSON.parse(dictionaryFileRawData);
let tunablesData = {};
let tunablesDataDecrypted = {};

const tunablesFileRawData = fs.readFileSync(`output/${FILE_NAME_IN}`);
tunablesData = JSON.parse(tunablesFileRawData);
tunablesDataDecrypted = { ...tunablesData, tunables: {} };
tunablesData.contentlists[0].forEach((_, i) => {
    TUNABLE_DYNAMIC_CONTEXT_CONTENT_MODIFIER[CONTENT_MODIFIER_CONTEXT_BASE.concat(i)] = joaat(CONTENT_MODIFIER_CONTEXT_BASE.concat(i))
});
let totalDecryptedTunables = 0;
let notFound = [];
console.log('Decrypting ...');
for (const [key, value] of Object.entries(tunablesData.tunables)) {
    let found = false;
    for (const [contextKey, contextValue] of Object.entries(TUNABLE_CONTEXT)) {
        const hash = parseInt(key, 16) - contextValue;
        const tunableName = _findKey(dictionary, (x) => [x.signed, x.unsigned].includes(hash));
        if (tunableName) {
            _set(tunablesDataDecrypted.tunables, `${contextKey}.${tunableName}`, value);
            found = true;
            totalDecryptedTunables++;
            break;
        }
    }
    for (const [contextDynamicKey, contextDynamicValue] of Object.entries(TUNABLE_DYNAMIC_CONTEXT_CONTENT_MODIFIER)) {
        const hashSigned = parseInt(key, 16) - contextDynamicValue.signed;
        const hashUnsigned = parseInt(key, 16) - contextDynamicValue.unsigned;
        const tunableName = _findKey(dictionary, (x) => x.signed === hashSigned || x.unsigned === hashUnsigned);
        if (tunableName) {
            _set(tunablesDataDecrypted.tunables, `${contextDynamicKey}.${tunableName}`, value);
            found = true;
            totalDecryptedTunables++;
            break;
        }
    }
    if (!found && !Object.keys(notFound).includes(key)) notFound.push({
        [key]: tunablesData.tunables[key]
    });
};
console.log('\nTotal encrypted tunables = ', Object.keys(tunablesData.tunables).length);
console.log('Total decrypted tunables = ', totalDecryptedTunables);
console.log('Total not found tunables = ', notFound.length);
fs.writeFile(`output/${FILE_NAME_OUT}`, beautify(JSON.stringify(tunablesDataDecrypted)), null, () => console.log('\nDone!'));
fs.writeFile(`output/${FILE_NAME_NOT_FOUND}`, beautify(JSON.stringify(notFound)), null, () => console.log(''));
fs.unlinkSync(`output/${FILE_NAME_DICTIONARY}`);
