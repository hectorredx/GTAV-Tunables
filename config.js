module.exports = {
    KEY: 'F06F12F49B843DADE4A7BE053505B19C9E415C95D93753450A269144D59A0115',
    PLATFORMS: ['xbox360', 'xboxone', 'xboxsx', 'ps3', 'ps4', 'ps5', 'pcros'],
    URLS: {
        TUNABLES: 'http://prod.cloud.rockstargames.com/titles/gta5/{platform}/0x1a098062.json',
        TUNABLE_NAMES: 'https://raw.githubusercontent.com/Wildbrick142/V-Tunable-Names/main/tunable_list.txt',
        TUNEABLES_PROCESSING: 'https://raw.githubusercontent.com/root-cause/v-decompiled-scripts/master/tuneables_processing.c',
    },
    FILE_NAMES: {
        ENCRYPTED: 'tunables-encrypted.json',
        DECRYPTED: 'tunables-decrypted.json',
        NOT_FOUND: 'tunables-not-found.json',
        DICTIONARY: 'dictionary.json',
        TUNEABLES_PROCESSING: 'tuneables_processing.c',
    },
};
