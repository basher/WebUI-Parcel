/**
 * Function - generates new QueryString parameters.
 *
 * @param {string} uri - URL of current page.
 * @param {string} key - new key to be added to URL.
 * @param {string} value - new value to be assigned to key.
 *
 * @return {string}
 *
 * @example
 *      updateQueryStringParameter(url, key, value);
 *
 *      generates 'url?key=value' or 'url&key=value'
 */

export const updateQueryStringParameter = (
    uri: string,
    key: string,
    value: string
): string => {
    const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
    const separator = uri.indexOf('?') !== -1 ? '&' : '?';
    if (uri.match(re)) {
        return uri.replace(re, `$1${key}=${value}$2`);
    }
    return `${uri + separator + key}=${value}`;
};

/**
 * Function - removes QueryString parameters.
 *
 * @param {string} uri - URL of current page.
 * @param {string} key - new key to be added to URL.
 *
 * @return {string}
 *
 * @example
 *      removeQueryStringParameter(url, key);
 *
 *      generates 'url'
 */

export const removeQueryStringParameter = (
    uri: string,
    key: string
): string => {
    const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
    if (uri.match(re)) {
        return uri.replace(re, '');
    }

    return uri;
};
