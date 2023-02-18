const fs = require('fs');
const upath = require('upath');
const { findKey, mapToObject, stripHexPrefix } = require('../utils');
const CONFIG = require('../config');
const dictionary = require(upath.normalize(`../static/${CONFIG.FILE_NAMES.DICTIONARY}`));

let tunablesDataDecryptedJson = {};
let totalDecryptedTunables;
let previousContext = null;
let tunablesMap = new Map();

console.log('Decrypting ...');

CONFIG.PLATFORMS.slice(CONFIG.DEBUG ? 5 : 0).forEach((platform, index) => {
    const encryptedPath = upath.normalize(`./${CONFIG.FILE_NAMES.ENCRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));
    const decryptedPath = upath.normalize(`./${CONFIG.FILE_NAMES.DECRYPTED}`.replace(new RegExp('{platform}', 'g'), platform));

    if (['ps3', 'xbox360'].includes(platform)) {
        fs.renameSync(encryptedPath, decryptedPath.replace('-decrypted', ''));
    } else {
        const tunablesFileRawData = fs.readFileSync(encryptedPath);
        const tunablesData = JSON.parse(tunablesFileRawData);
        const tunablesDataDecrypted = {
            ...tunablesData,
            contentlists: tunablesData.contentlists.map((contentlist) => contentlist.map((content) => getJobName(content))),
            tunables: {},
        };
        tunablesDataDecryptedJson = { ...tunablesDataDecrypted };
        tunablesMap = new Map();
        totalDecryptedTunables = 0;
        const totalEncryptedTunables = Object.keys(tunablesData.tunables).length;

        for (const [key, value] of Object.entries(tunablesData.tunables)) {
            const isNamed = lookupTunable(key, value, platform);
            if (!isNamed) {
                const isReversed = lookupTunable(key, value, platform, true);
                if (!isReversed) {
                    saveTunable('UNKNOWN', stripHexPrefix(key), value);
                }
            }
        };

        tunablesDataDecryptedJson.tunables = mapToObject(tunablesMap);
        fs.writeFileSync(decryptedPath, JSON.stringify(tunablesDataDecryptedJson, null, 4));
        console.log(`\n${platform.toUpperCase()} Tunables Decrypted`);
        if (CONFIG.DEBUG) {
            console.log('\nTotal Encrypted Tunables = ', totalEncryptedTunables);
            console.log('Total Decrypted Tunables = ', totalDecryptedTunables);
            console.log('Total Unknown Tunables = ', totalEncryptedTunables - totalDecryptedTunables);
        } else {
            if (index === CONFIG.PLATFORMS.length - 1) {
                fs.unlinkSync(upath.normalize(`./src/static/${CONFIG.FILE_NAMES.DICTIONARY}`));
            }
        }
    }
});

console.log('\nDone!');

function getJobName(content) {
    if (content in dictionary.jobs) return dictionary.jobs[content];
    return content;
}

function saveTunable(contextKey, key, value) {
    if (tunablesMap.get(contextKey)) tunablesMap.get(contextKey).set(key, value);
    else tunablesMap.set(contextKey, new Map([[key, value]]));
}

function lookupTunable(key, value, platform, missingName = false) {
    const keyWithoutPrefix = stripHexPrefix(key);

    // TODO: Find a better way to do handle these edge cases
    if (key.includes('8B7D3320')) {
        return false;
    }

    if (key.includes('52BDAF86')) {
        saveTunable('MP_Global', '_0x19EEFD4F', value);
        totalDecryptedTunables++;
        return true;
    }

    if (typeof value === 'number') {
        const dictionaryKey = findKey(dictionary.other, x => x == value);
        if (dictionaryKey) value = dictionaryKey.toUpperCase();
        if (dictionaryKey && CONFIG.DEBUG) console.log(`found ${dictionaryKey} of hash ${value}`);
    }

    if (previousContext) {
        const { contextKey, contextValue } = previousContext;

        if (missingName) {
            const hashSigned = parseInt(keyWithoutPrefix, 16) - contextValue.signed;
            const reversedHash = '_0x'.concat((hashSigned >>> 0).toString(16).toLocaleUpperCase().padStart(8, '0'));
            if (CONFIG.DEBUG) console.log(`Reversed key ${key} in ${contextKey} as ${reversedHash}`);
            saveTunable(contextKey, reversedHash, value);
            totalDecryptedTunables++;
            return true;
        } else {
            const dictionaryKey = findKey(dictionary.tunables, x => x.sum[contextKey].includes(keyWithoutPrefix));
            if (dictionaryKey) {
                if (CONFIG.DEBUG) console.log(`found key ${key} in ${contextKey} as ${dictionaryKey}`);
                const isRootContent = dictionaryKey.includes('ROOT_CONTENT_ID');
                if (isRootContent) value = getJobName(value);
                saveTunable(contextKey, dictionaryKey, value);
                totalDecryptedTunables++;
                return true;
            }
        }
    }

    for (const [contextKey, contextValue] of Object.entries(dictionary.contexts)) {
        const isModifier = contextKey.includes('_MODIFIER_');
        const isNextGen = ['xboxsx', 'ps5'].includes(platform);

        if (!isNextGen && contextKey === 'MP_FM_MEMBERSHIP') return false;

        if (missingName && !isModifier) {
            const hashSigned = parseInt(keyWithoutPrefix, 16) - contextValue.signed;
            const reversedHash = '_0x'.concat((hashSigned >>> 0).toString(16).toLocaleUpperCase().padStart(8, '0'));
            if (CONFIG.DEBUG) console.log(`Reversed key ${key} in ${contextKey} as ${reversedHash}`);
            saveTunable(contextKey, reversedHash, value);
            previousContext = { contextKey, contextValue };
            totalDecryptedTunables++;
            return true;
        } else {
            const dictionaryKey = findKey(dictionary.tunables, x => x.sum[contextKey].includes(keyWithoutPrefix));
            if (dictionaryKey) {
                if (CONFIG.DEBUG) console.log(`found key ${key} in ${contextKey} as ${dictionaryKey}`);
                const isRootContent = dictionaryKey.includes('ROOT_CONTENT_ID');
                if (isRootContent) value = getJobName(value);
                saveTunable(contextKey, dictionaryKey, value);
                previousContext = { contextKey, contextValue };
                totalDecryptedTunables++;
                return true;
            }
        }
    }
    return false;
}
