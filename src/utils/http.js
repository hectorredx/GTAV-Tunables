/**
 * Perform a fetch-like request using Node's http/https modules.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
async function get(url, options = {}) {
    const response = await global.fetch(url, { credentials: 'include', ...options });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buf = Buffer.from(await response.arrayBuffer());
    return {
        text: buf.toString('latin1'),
        buffer: buf
    }
}

/**
 * Try to get a URL via the fast jsDelivr CDN first, then fallback to the original GitHub raw URL if that fails
 * @param {string} url - The GitHub raw URL to fetch
 * @returns {Promise<{ content: Buffer, text: string }>} Resolves with the response object
 */
async function getGithubFile(url) {
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
        console.warn('getGithubFile: URL does not appear to be a GitHub raw URL:', url);
    }

    try {
        return get(url);
    } catch (error) {
        if (fallback) {
            return get(fallback);
        }
        throw error;
    }
}

module.exports = {
    get,
    getGithubFile,
};
