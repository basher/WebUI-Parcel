/* eslint-disable no-prototype-builtins, no-undef */
/**
 * Function - generates translated string, or fallback.
 *
 * @param {string} translation - translation KBconfig object property.
 * @param {string} fallback - fallback string in English.
 * @param {string} [replacement] - optional token replacement text.
 *
 * @return {string}
 *
 * @example
 *      const myTranslation = translate(KBconfig.property, 'fallback');
 *      const myTokenisedTranslation =
 *              translate(KBconfig.property, 'fallback', 'replacement');
 */
export const translate = (
    translation: string,
    fallback: string,
    replacement?: string
): string => {
    let translated = '';

    // Does KBconfig translation property exist?
    if (KBconfig.translations.hasOwnProperty(translation)) {
        const re = /{\d}/;

        // Does property contain a placeholder token?
        if (replacement && re.test(KBconfig.translations[translation])) {
            translated = KBconfig.translations[translation].replace(
                re,
                replacement
            );
        } else {
            translated = KBconfig.translations[translation];
        }
    } else {
        translated = fallback;
    }

    return translated;
};
