const https = require('https');
const querystring = require('querystring');

let globalCookies = [];

class Cookies {
    /**
     * Creates a Cookie Object for a Single Host
     * @param {string} host 
     * @returns {Cookies}
     */
	constructor(host) {
		this.host = host;
		this.cookie = {};
		return this;
    };
    /**
     * Adds Cookie as Object 
     * @param {string} cookie 
     * @returns {Cookies}
     */
	addCookie(cookie) {
		const copy = cookie;
		let [key] = copy.split('=');
		if (!!key) {
			this.cookie[key] = cookie;	
		}
		return this;
    };
    /**
     * You can just access it with 'host' aswell, just JS Style
     * @returns {string}
     */
	getHost() {
		return this.host;
    };
    /**
     * the ToString overrider
     * @returns {string}
     */
	toString() {
		let out = [];
		for (let k in this.cookie) {
			out.push(this.cookie[k]);
		}
		return out.join('; ');
	};
};


/**
 * The Cookie Wrapper Add Function
 * @param {string} host 
 * @param {string} cookie 
 */
function addCookie(host, cookie) {
	const cookieIndex = globalCookies.findIndex(v => v.getHost() === host);
	if (cookieIndex !== -1) {
		globalCookies[cookieIndex].addCookie(cookie);
		return;
	}
	const baker = new Cookies(host);
	baker.addCookie(cookie);
	globalCookies.push(baker);
}

/**
 * The Cookie Wrapper Get Function
 * @param {string} host 
 * @returns {string}
 */
function getCookie(host) {
	const cookieIndex = globalCookies.findIndex(v => v.getHost() === host);
	if (cookieIndex !== -1) {
		return globalCookies[cookieIndex].toString();
	}
	return null;
}

/**
 * Deletes a Cookie Associated to an Host
 * @param {string} host 
 */
function removeCookie(host) {
	let newCookieArray = [];
	for (let i = globalCookies.length - 1; i; i--) {
		if (globalCookies[i].getHost() === host) {
			continue;
		}
		newCookieArray.push(globalCookies[i]);
	}
	globalCookies = []; // wir haben einen GC ¯\_(ツ)_/¯
	globalCookies = newCookieArray;
}

/**
 * Clears all saved Cookies
 */
function clearCookies() {
	for (let i = globalCookies.length - 1; i; i--) {
		delete globalCookies[i];
	}
	globalCookies = [];
}

/**
 * It splits an Uri Request to an Map
 * @param {string} str 
 * @returns {Map<string, string>}
 */
function uriToMap(str) {
    let params = {};
    /**
     * @private
     * Just a lazy Wrapper
     * @param {string} v 
     */
	const pushFunc = v => {
		let [key, value] = v.split('=');
		params[key] = value;
	};
	if (!!str) {
        str.split('&').forEach(pushFunc);
	}
	return params;
}

/**
 * @typedef RequestObject
 * @property {string} host
 * @property {Map<string, string>} headers
 * @property {string} method
 */

/**
 * @typedef ResponseObject
 * @property {number} code
 * @property {Buffer} content
 * @property {Map<string, string>} headers
 */

/**
 * Extracts the Request Options out of the url and adds Cookies to the Request
 * @param {'get' | 'post'} method 
 * @param {string} url 
 * @returns {RequestObject}
 */
function extractRequestOptions(method, url) {
	let uri;
	[url, uri] = url.split('?');
	let buffer;
	[buffer, url] = url.split('://');
	if (!url) {
		url = buffer;
    }
    if (!url) {
        throw 'Invalid URL Request';
    }
	let params = uriToMap(uri);
	const parts = url.split('/');
	url = parts.splice(0, 1)[0];
	uri = parts.join('/');
	const prams = querystring.stringify(params);
	if (!!prams) {
		uri += '?' + prams;	
	}
	let reqObject = { host: url, path: '/' + uri, };
	const cookie = getCookie(url);
	if (!!cookie) {
		reqObject.headers = { Cookie: cookie };
	}
	if (method.toLowerCase() === 'post') {
		reqObject.method = 'POST';
	} 		
	return reqObject;
}

/**
 * The Request Object Wrapper for JavaScripts XML HTTP Request / NodeJS http(s) Module
 * @param {RequestObject} requestObject 
 * @param {any} content 
 * @param {function(ResponseObject): void} [callback] 
 * @returns {Promise<ResponseObject> | void} Returns void if callback is defined
 */
function request(requestObject, content, callback) {
    let dataStr = [];
    /**
     * @private
     * It gathers the response Chunks of http data event
     * @param {string} chunk 
     */
	const receiveData = chunk => {
		const b = Buffer.from(chunk);
		dataStr.push(b);
    };
    /**
     * @private
     * The HTTP Request Promise Handler
     * @param {function(ResponseObject): void} handler 
     */
	const promiseHandler = handler => {
		const responseHandler = (response) => {
			response.on('data', receiveData);
			response.on('end', () => {
				const cookie = response.headers['set-cookie'];
				if (!!cookie) {
					cookie.forEach(v => {
						addCookie(requestObject.host, v);
					});
				}
				const res = {
					headers: response.headers,
					code: response.statusCode,
					content: Buffer.concat(dataStr),
				};
				handler(res);
			});
		};
		const result = https.request(requestObject, responseHandler);
		if (!!content) {
			result.write(content);
		}
		result.end();
	};
	const result = new Promise(promiseHandler);
	if (typeof callback === 'function') {
		result.then(callback);
	}
	return result;
}

/**
 * The Get Request Wrapper
 * @param {string} url 
 * @param {function(ResponseObject): void} [callback] 
 * @returns {Promise<ResponseObject> | void} Returns void if callback is defined
 */
function get(url, callback) {
	return request(extractRequestOptions('get', url), null, callback);
};

/**
 * The Post Request Wrapper
 * @param {string} url 
 * @param {any} params It will be stringified
 * @param {function(ResponseObject): void} [callback] 
 * @returns {Promise<ResponseObject> | void} Returns void if callback is defined
 */
function post(url, params, callback) {
	let content = params;
	if (typeof params === 'object') {
		content = querystring.stringify(params);
	}
	return request(extractRequestOptions('post', url), content, callback);
};

module.exports = {
	get: get,
	post: post,
	request: request,
	extractRequestOptions: extractRequestOptions,
	addCookie: addCookie,
	getCookie: getCookie,
	clearCookies: clearCookies,
	removeCookie: removeCookie,
	https: https,
	querystring: querystring,
};