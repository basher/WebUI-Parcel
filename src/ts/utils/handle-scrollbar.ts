/**
 * Function - calculates scrollbar width to ensure that modal overlays don't make the page jump when scrollbar is hidden.
 *
 * @param {boolean} reset - boolean to add HTML document margin or reset.
 *
 * @return {void}
 *
 * @example
 *      accountForScrollbar(true);
 */
export const accountForScrollbar = (reset?: boolean): void => {
    const elemHtml = document.documentElement;
    const documentWidth = elemHtml.clientWidth;
    const windowWidth = window.innerWidth;

    if (reset) {
        elemHtml.style.marginInlineEnd = `${windowWidth - documentWidth}px`;
    } else {
        elemHtml.style.marginInlineEnd = '0';
    }
};
