const fs = require('fs');
const beautify = require('js-beautify').js_beautify;
const _findKey = require('lodash').findKey;
const _set = require('lodash').set;
const _uniqWith = require('lodash').unionWith;
const _isEqual = require('lodash').isEqual;


const TUNABLE_CONTEXT = {
    BASE_GLOBALS: 190769267,
    MP_Global: 953070135,
    MP_CNC: 1398379561,
    MP_CNC_TEAM_COP: 3999338632,
    MP_CNC_TEAM_VAGOS: 3137655631,
    MP_CNC_TEAM_LOST: 988790432,
    MP_FM: 1140746429,
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
const TUNABLE_CONTEXT_VALUES = Object.values(TUNABLE_CONTEXT);

const TUNEABLES_PROCESSING_FILE_PATH = "tuneables_processing.c";
const tuneablesProcessingRawData = fs.readFileSync(TUNEABLES_PROCESSING_FILE_PATH);

const dictionaryFileRawData = fs.readFileSync('dictionary.json');
const dictionary = JSON.parse(dictionaryFileRawData);
let tunablesData = {};
let tunablesDataDecrypted = {};

const filenameIn = `tunables-encrypted.json`;
const filenameOut = `tunables-decrypted.json`;

const tunablesFileRawData = fs.readFileSync(filenameIn);
tunablesData = JSON.parse(tunablesFileRawData);
tunablesDataDecrypted = { ...tunablesData, tunables: {} };
let notFound = [];

console.log('Total encrypted tunables = ', Object.keys(tunablesData.tunables).length);
Object.keys(tunablesData.tunables).forEach(async key => {
    let checkIndex = 0;
    let fallbacks = [];
    while (checkIndex < TUNABLE_CONTEXT_VALUES.length) {
        const hash = parseInt(key, 16) - TUNABLE_CONTEXT_VALUES[checkIndex];
        const result = _findKey(dictionary, (x) => x.toLowerCase() === hash.toString(16));
        if (result) {
            _set(tunablesDataDecrypted.tunables, _findKey(TUNABLE_CONTEXT, (x) => x === TUNABLE_CONTEXT_VALUES[checkIndex]) + '.' + result, tunablesData.tunables[key])
            checkIndex = 0;
            break;
        } else if (tuneablesProcessingRawData.includes(hash)) {
            fallbacks.push(hash);

            if (checkIndex === TUNABLE_CONTEXT_VALUES.length - 1) {
                const fallback = fallbacks.shift();
                _set(tunablesDataDecrypted.tunables, _findKey(TUNABLE_CONTEXT, (x) => x === TUNABLE_CONTEXT_VALUES[0]) + '.' + fallback, tunablesData.tunables[key])
                fallbacks = [];
                break;
            }
        } else {
            if (!Object.keys(notFound).includes(key)) notFound.push({
                [key]: tunablesData.tunables[key]
            })
        }

        checkIndex++;
    }
});
console.log('Total decrypted tunables = ', Object.keys(tunablesDataDecrypted.tunables.BASE_GLOBALS).length + Object.keys(tunablesDataDecrypted.tunables.MP_Global).length)
notFound = _uniqWith(notFound, _isEqual);
console.log('Total not found tunables = ', notFound.length);
fs.writeFile(filenameOut, beautify(JSON.stringify(tunablesDataDecrypted)), null, () => console.log('Done!'));
fs.writeFile('tunables-not-found.json', beautify(JSON.stringify(notFound)), null, () => console.log(''));
// fs.unlinkSync(filenameIn)
