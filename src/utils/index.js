function set(obj, path, value) {
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);

    pathArray.reduce((acc, key, i) => {
        if (acc[key] === undefined) acc[key] = {};
        if (i === pathArray.length - 1) acc[key] = value;
        return acc[key];
    }, obj);
}

function omit(obj, props) {
    obj = { ...obj };
    props.forEach(prop => delete obj[prop]);
    return obj;
}

function findKey(obj, predicate = o => o) {
    return Object.keys(obj).find(key => predicate(obj[key], key, obj));
}

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
    set,
    omit,
    findKey,
    mapToObject,
    objectToMap,
    stripHexPrefix,
};
