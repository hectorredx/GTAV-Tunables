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


// findKey(dictionary.other, x => x == value);
function invertOther(other) {
    const inverted = {};
    for (const [key, value] of Object.entries(other)) {
        inverted[value] = key;
    }
    return inverted;
}
/**
 * 
 * @param {record<number, string>} iother 
 * @param {number} value 
 * @returns {string|undefined}
 */
function findOtherKey(iother, value) {
    return iother[value];
}

// findKey(dictionary.tunables, x => x.sum[contextKey] == keyWithoutPrefix);
function invertTunablesSum(tunables) {
    const inverted = {};
    for (const [key, value] of Object.entries(tunables)) {
        for (const [contextKey, contextValue] of Object.entries(value.sum)) {
            if (!inverted[contextKey]) inverted[contextKey] = {};
            inverted[contextKey][contextValue] = key;
        }
    }
    return inverted;
}
/**
 * 
 * @param {string} contextKey 
 * @param {string} value 
 * @returns {string|undefined}
 */
function findTunablesSumKey(isum, contextKey, value) {
    if (isum[contextKey]) {
        return isum[contextKey][value];
    }
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

/**
 * Fetch a URL and return arrayBuffer (for binary content).
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer, text: string }>}
 */
async function get(url) {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = buffer.toString('utf-8');
    return { buffer, text };
}

/**
 * Try to get a URL via the fast jsDelivr CDN first, then fallback to the original GitHub raw URL if that fails.
 * @param {string} url - The GitHub raw URL to fetch
 * @returns {Promise<{ buffer: Buffer, text: string }>}
 */
async function get_gh(url) {
    const parts = url.split('/');
    let fallback;
    if (parts.length >= 5 || parts[2] === 'raw.githubusercontent.com') {
        const name = parts[3];
        const repo = parts[4];
        const branch = parts[5];
        const path = parts.slice(6).join('/');
        fallback = url;
        url = `https://cdn.jsdelivr.net/gh/${name}/${repo}@${branch}/${path}`;
    } else {
        console.warn('get_gh: URL does not appear to be a GitHub raw URL:', url);
    }
    try {
        return await get(url);
    } catch (e) {
        if (fallback) {
            return await get(fallback);
        } else {
            throw e;
        }
    }
}

/**
 * Alias for get_gh to match newer naming conventions.
 */
const getGithubFile = get_gh;

module.exports = {
    get,
    get_gh,
    getGithubFile,
    set,
    omit,
    findKey,
    invertOther,
    findOtherKey,
    invertTunablesSum,
    findTunablesSumKey,
    mapToObject,
    objectToMap,
    stripHexPrefix,
};
