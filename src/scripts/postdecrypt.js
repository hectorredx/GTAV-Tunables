const fs = require('fs');
const upath = require('upath');
const { js_beautify: beautify } = require('js-beautify');
const jsonabc = require('jsonabc');
const CONFIG = require('../config');
const dictionary = require(upath.normalize(`../static/${CONFIG.FILE_NAMES.DICTIONARY}`));
const tuneablesProcessing = fs.readFileSync(upath.normalize(`./src/static/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`));

let tunablesDataDecryptedJson = {};
let tunablesDataDecryptedStringified;
let totalDecryptedTunables;

console.log('Decrypting ...');

CONFIG.PLATFORMS.slice(CONFIG.DEBUG ? 6 : 0).forEach((platform, index) => {
    const encryptedPath = upath.normalize(`./src/static/${CONFIG.FILE_NAMES.ENCRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));
    const decryptedPath = upath.normalize(`./${CONFIG.FILE_NAMES.DECRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));

    if (['ps3', 'xbox360'].includes(platform)) {
        fs.renameSync(encryptedPath, decryptedPath);
    } else {
        const tunablesFileRawData = fs.readFileSync(encryptedPath);
        const tunablesData = JSON.parse(tunablesFileRawData);
        const tunablesDataDecrypted = {
            ...tunablesData,
            contentlists: tunablesData.contentlists.map((contentlist) => contentlist.map((content) => getJobName(content))),
            tunables: {}
        };
        tunablesDataDecryptedJson = { ...tunablesDataDecrypted };
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

        const main = beautify(JSON.stringify(omit(tunablesDataDecryptedJson, ['contentlists', 'tunables'])), { indent_size: 4 });
        const contentlists = beautify(JSON.stringify({ contentlists: tunablesDataDecryptedJson.contentlists }), { indent_size: 4, wrap_line_length: 1, space_in_paren: true });
        const tunables = beautify(jsonabc.sort(JSON.stringify({ tunables: tunablesDataDecryptedJson.tunables })), { indent_size: 4 });
        fs.writeFileSync(decryptedPath, main.substring(0, main.length - 2)
            .concat(',', contentlists.substring(1, contentlists.length - 2),
                ',', tunables.substring(1, tunables.length - 1), '}'));
        console.log(`\n${platform.toUpperCase()} Tunables Decrypted`);
        if (CONFIG.DEBUG) {
            console.log('\nTotal Encrypted Tunables = ', Object.keys(tunablesData.tunables).length);
            console.log('Total Decrypted Tunables = ', totalDecryptedTunables);
        } else {
            fs.unlinkSync(encryptedPath);
            if (index === CONFIG.PLATFORMS.length - 1) {
                fs.unlinkSync(upath.normalize(`./src/static/${CONFIG.FILE_NAMES.DICTIONARY}`));
                fs.unlinkSync(upath.normalize(`./src/static/${CONFIG.FILE_NAMES.TUNEABLES_PROCESSING}`));
            }
        }
    }
});

console.log('\nDone!');

function getJobName(content) {
    if (content in dictionary.jobs) return dictionary.jobs[content];
    return content.toString();
}

function lookupTunable(key, value, missingName = false) {
    for (const [contextKey, contextValue] of Object.entries(dictionary.contexts)) {
        if (missingName) {
            const hashSigned = parseInt(key, 16) - contextValue.signed;
            const hashUnsigned = parseInt(key, 16) - contextValue.unsigned;
            const isHashInTuneablesProcessing = tuneablesProcessing.includes(hashSigned) || tuneablesProcessing.includes(hashUnsigned);
            if (isHashInTuneablesProcessing) {
                tunablesDataDecryptedStringified = stringify(tunablesDataDecryptedStringified, contextKey, key, value);
                totalDecryptedTunables++;
                return true;;
            }
        } else {
            const dictionaryKey = findKey(dictionary.tunables, x => x.sum[contextKey].includes(key));
            if (dictionaryKey) {
                if (CONFIG.DEBUG) console.log(`found key ${key} in ${contextKey} as ${dictionaryKey}`);
                const isRootContent = dictionaryKey.includes('ROOT_CONTENT_ID');
                if (isRootContent) value[0].value = getJobName(value[0].value);
                tunablesDataDecryptedStringified = stringify(tunablesDataDecryptedStringified, contextKey, dictionaryKey, value);
                totalDecryptedTunables++;
                return true;
            }
        }
    }
    return false;
}

// Hacky workaround Node.js large string size limit when stringifying with JSON.stringify
function stringify(mainString, context, key, value) {
    let vValue = value[0].value;

    if (typeof vValue === 'number') {
        const dictionaryKey = findKey(dictionary.other, x => x == vValue);
        if (dictionaryKey) vValue = dictionaryKey.toUpperCase();
        if (dictionaryKey && CONFIG.DEBUG) console.log(`found ${dictionaryKey} of hash ${vValue}`);
    }

    set(tunablesDataDecryptedJson, `tunables.${context}.${key}`, vValue);
    const valueString = ['boolean', 'number'].includes(typeof vValue) ? vValue : `"${vValue}"`;
    if (mainString.includes(context)) {
        const first = mainString.substring(0, mainString.indexOf(`"${context}":`));
        const last = mainString.substring(mainString.indexOf(`"${context}":`));
        return first.concat(last.replace('}', `,"${key}":${valueString}}`));
    } else {
        return mainString.concat(mainString.endsWith('{') ? '' : ',', `"${context}":{"${key}":${valueString}}`);
    }
}

function findKey(obj, predicate = o => o) {
    return Object.keys(obj).find(key => predicate(obj[key], key, obj));
}

function omit(obj, props) {
    obj = { ...obj };
    props.forEach(prop => delete obj[prop]);
    return obj;
}

function set(obj, path, value) {
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);

    pathArray.reduce((acc, key, i) => {
        if (acc[key] === undefined) acc[key] = {};
        if (i === pathArray.length - 1) acc[key] = value;
        return acc[key];
    }, obj);
}
