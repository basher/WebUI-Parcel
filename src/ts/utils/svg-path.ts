/**
 * Function - generates correct SVG sprite HREF.
 * *
 * @return {string}
 *
 * @example
 *      const svgHref = svgPath();
 */
/* eslint-disable no-undef */
export const svgPath = (): string => {
    let path;

    if (window.location.hostname === 'localhost') {
        // Storybook or local .Net DEV?
        if (window.location.port === '9009') {
            // See Storybook docs for explanation about how we make external sprite available = http://localhost:9009/?path=/docs/ui-components-icons--icons.
            path = `${KBconfig.theme}.sprite.svg`;
        } else {
            // TODO: Local .Net DEV path is currently the same as PROD, but this might change in the future, so leave this 'else' statement for now.
            path = KBconfig.svgPath;
        }
    } else {
        // PROD.
        path = KBconfig.svgPath;
    }

    return path;
};
