// Custom Type Guard.
const isHtmlElement = (e: any): e is HTMLElement => {
    return e && !!e.tagName;
};

/**
 * Function - Check we have an HTML element that triggers event.
 *
 * @param {EventTarget} e - DOM element that triggers event.
 *
 * @return {EventTarget}
 *
 * @example
 *
 *      myDOMelement.addEventListener('click', (e: MouseEvent) => {
 *          const target = getEventElement(e.currentTarget);
 *      )};
 */
export const getEventElement = (e: EventTarget | null): HTMLElement | null => {
    return isHtmlElement(e) ? e : null;
};

/**
 * Function - Trigger (i.e. fire) event.
 *
 * @param {HTMLElement} el - DOM element.
 * @param {any} type - event type.
 *
 * @return {void}
 *
 * @example
 *
 *      triggerEvent(myDOMelement, 'click');
 */
export const triggerEvent = (el: HTMLElement, type: any): void => {
    if ('createEvent' in document) {
        const e = document.createEvent('HTMLEvents');
        e.initEvent(type, false, true);
        el.dispatchEvent(e);
    }
};

/**
 * Function - Handle 'keydown' event in tab component, to properly manage keyboard focus and improve accessibility.
 *
 * @param {NodeListOf<HTMLElement>} tabButtons - e.g. list of tab titles or tab buttons.
 * @param {KeyboardEvent} e - keyboard event.
 * @param {number} index - position of tab button in the list.
 * @param {HTMLElement} tablist - parent element for tab buttons.
 * @param {string} tabSelector - e.g. fully qualified selector for tab button (e.g. class name with the '.').
 *
 * @return {void}
 *
 * @example
 *
 *      bindTabsKeyboardEvent(titles, e, index, tablist, '.ui-tabs__title');
 */
export const bindTabsKeyboardEvent = (
    tabButtons: NodeListOf<HTMLElement>,
    e: KeyboardEvent,
    index: number,
    tablist: HTMLElement,
    tabSelector: string
): void => {
    const nextTab: any = tablist.querySelectorAll(tabSelector);

    // Stop page jumping with certain key events with 'e.preventDefault()'.
    switch (e.code) {
        case 'ArrowRight':
        case 'ArrowDown':
            e.preventDefault();
            if (tabButtons.length - index > 1) {
                nextTab[index + 1].focus();
                nextTab[index + 1].click();
            }
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            e.preventDefault();
            if (index > 0) {
                nextTab[index - 1].focus();
                nextTab[index - 1].click();
            }
            break;
        case 'Home':
            e.preventDefault();
            if (index !== 0) {
                nextTab[0].focus();
                nextTab[0].click();
            }
            break;
        case 'End':
            e.preventDefault();
            if (index !== tabButtons.length - 1) {
                nextTab[tabButtons.length - 1].focus();
                nextTab[tabButtons.length - 1].click();
            }
            break;
        default:
            break;
    }
};

/**
 * Function - Handle 'click' event in tab component, to properly manage keyboard focus and improve accessibility.
 *
 * @param {HTMLElement} target - event's current target.
 * @param {NodeListOf<HTMLElement>} tabButtons - e.g. list of tab titles or tab buttons.
 *
 * @return {boolean}
 *
 * @example
 *
 *      bindTabsClickEvent(target, titles);
 */
export const bindTabsClickEvent = (
    target: HTMLElement | null,
    tabButtons: NodeListOf<HTMLElement>
): boolean => {
    const isSelected =
        target?.getAttribute('aria-selected') === 'true' || false;

    // Prevent selected tab button from being clicked again.
    if (isSelected) {
        return false;
    }

    // De-select other tab buttons first.
    [...(tabButtons as any)].map((otherButton) => {
        otherButton.setAttribute('aria-selected', 'false');
        otherButton.setAttribute('tabIndex', '-1');
        return true;
    });

    // Set correct attributes on selected button.
    target?.setAttribute('aria-selected', Boolean(!isSelected).toString());
    target?.setAttribute('tabIndex', isSelected ? '-1' : '0');

    return true;
};
