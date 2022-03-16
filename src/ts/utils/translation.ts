/* eslint-disable no-prototype-builtins, no-undef */
/**
 * Function - generates translated string, or fallback.
 *
 * @param {string} translation - translation UIconfig object property.
 * @param {string} fallback - fallback string in English.
 * @param {string} [replacement] - optional token replacement text.
 *
 * @return {string}
 *
 * @example
 *      const myTranslation = translate(UIconfig.property, 'fallback');
 *      const myTokenisedTranslation =
 *              translate(UIconfig.property, 'fallback', 'replacement');
 */
export const translate = (
    translation: string,
    fallback: string,
    replacement?: string
): string => {
    let translated = '';

    // Does UIconfig translation property exist?
    if (UIconfig.translations.hasOwnProperty(translation)) {
        const re = /{\d}/;

        // Does property contain a placeholder token?
        if (replacement && re.test(UIconfig.translations[translation])) {
            translated = UIconfig.translations[translation].replace(
                re,
                replacement
            );
        } else {
            translated = UIconfig.translations[translation];
        }
    } else {
        translated = fallback;
    }

    return translated;
};
