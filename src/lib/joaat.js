/**
 *
 * Author: PLTytus
 * Source: https://github.com/PLTytus/joaat/blob/master/index.js
 *
 *
 */

function int32(i) {
    return i & 0xFFFFFFFF;
}

function signedInt32(i) {
    return i | (-(i & 0x80000000));
}

function signedInt8(i) {
    return i | (-(i & 0x80));
}

function unsignedInt(i) {
    return i >>> 0;
}

function hex(i) {
    return i.toString(16).toUpperCase();
}

function joaat(s, c = null, m = 1/*1|-1*/) {
    s = unescape(encodeURIComponent(s.toLowerCase()));

    var hash = 0;

    for (let i = 0; i < s.length; i++) {
        hash = int32(hash + signedInt8(s.charCodeAt(i)));
        hash = int32(hash + (hash << 10));
        hash = int32(hash ^ (hash >>> 6));
    }

    hash = int32(hash + (hash << 3));
    hash = int32(hash ^ (hash >>> 11));
    hash = int32(hash + (hash << 15));

    if (c !== null) hash = int32(hash + joaat(c).signed * m);

    let uint = unsignedInt(hash);

    return {
        signed: hash,
        unsigned: uint,
        hex: hex(uint),
    };
}

module.exports = joaat
