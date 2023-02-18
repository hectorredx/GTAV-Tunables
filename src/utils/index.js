function mapToObject(m) {
    let lo = {}
    for (let [k, v] of m) {
        if (v instanceof Map) {
            lo[k] = mapToObject(v)
        }
        else {
            lo[k] = v
        }
    }
    return lo
};

function objectToMap(o) {
    let m = new Map()
    for (let k of Object.keys(o)) {
        if (o[k] instanceof Object) {
            m.set(k, objectToMap(o[k]))
        }
        else {
            m.set(k, o[k])
        }
    }
    return m
};

const stripHexPrefix = (hex) => hex.substring(3, hex.length);

module.exports = {
    mapToObject,
    objectToMap,
    stripHexPrefix,
};
