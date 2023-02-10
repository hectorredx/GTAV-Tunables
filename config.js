module.exports = {
    DEBUG: false,
    KEY: 'F06F12F49B843DADE4A7BE053505B19C9E415C95D93753450A269144D59A0115',
    PLATFORMS: ['xbox360', 'xboxone', 'xboxsx', 'ps3', 'ps4', 'ps5', 'pcros'],
    URLS: {
        TUNABLES: 'http://prod.cloud.rockstargames.com/titles/gta5/{platform}/0x1a098062.json',
        TUNABLE_NAMES: 'https://raw.githubusercontent.com/Wildbrick142/V-Tunable-Names/main/tunable_list.txt',
        TUNEABLES_PROCESSING: 'https://raw.githubusercontent.com/root-cause/v-decompiled-scripts/master/tuneables_processing.c',
    },
    FILE_NAMES: {
        ENCRYPTED: 'tunables-{platform}-encrypted.json',
        DECRYPTED: 'tunables-{platform}.json',
        DICTIONARY: 'dictionary.json',
        TUNEABLES_PROCESSING: 'tuneables_processing.c',
    },
    TUNABLE_CONTEXTS: ['BASE_GLOBALS', 'MP_Global', 'CD_GLOBAL', 'MP_CNC', 'MP_CNC_TEAM_COP', 'MP_CNC_TEAM_VAGOS', 'MP_CNC_TEAM_LOST', 'MP_FM', 'MP_FM_MEMBERSHIP', 'MP_FM_DM', 'MP_FM_RACES', 'MP_FM_RACES_CAR', 'MP_FM_RACES_BIKE', 'MP_FM_RACES_CYCLE', 'MP_FM_RACES_AIR', 'MP_FM_RACES_SEA', 'MP_FM_RACES_STUNT', 'MP_FM_MISSIONS', 'MP_FM_SURVIVAL', 'MP_FM_BASEJUMP', 'MP_FM_CAPTURE', 'MP_FM_LTS', 'MP_FM_HEIST', 'MP_FM_CONTACT', 'MP_FM_RANDOM', 'MP_FM_VERSUS', 'MP_FM_GANG_ATTACK', 'MP_FMADVERSARY'],
    TUNABLE_CONTENT_CONTEXTS: ['CONTENT_MODIFIER', 'CONTENT_MODIFIER_MEMBERSHIP'],
};
