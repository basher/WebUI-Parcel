import { getEventElement, bindTabsClickEvent } from './event-handlers';
import { randomString } from './random-string';

/**
 * Function - used by any component that needs to show|hide content.
 *
 * @param {HTMLElement} button - usually a <button>.
 * @param {HTMLElement} content - usually a <div> whose content is shown|hidden.
 * @param {string} [buttonLabel] - initial button label (or null).
 * @param {string} [buttonLabelExpanded] - button label when content is shown (or null).
 * @param {NodeListOf<HTMLElement>} [multipleButtons] - list of button elements, ALL of which trigger show|hide on the SAME element.
 *
 * @return {void}
 *
 * @example
 *
 *      disclosure({ button, content, });
 *      disclosure({ button, content, multipleButtons, });
 */
interface Disclosure {
    button: HTMLElement;
    content: HTMLElement | null;
    buttonLabel?: string | null;
    buttonLabelExpanded?: string | null;
    multipleButtons?: NodeListOf<HTMLElement>;
}
export const disclosure = (arg: Disclosure): void => {
    arg.content?.classList.add('is-hidden');

    // In 'show|hide' or 'accordion' components, we use 'aria-expanded'.
    const hasAriaExpanded = arg.button.getAttribute('aria-expanded');
    // In 'tabs' component, we use 'aria-selected'.
    const hasAriaSelected = arg.button.getAttribute('aria-selected');

    // Auto-generate unique 'id' and 'aria-controls' attributes, using button 'parentElement' classname as a sensible prefix.
    if (arg.button.parentElement) {
        const unique = randomString(arg.button.parentElement.classList[0]);
        arg.content?.setAttribute('id', unique);

        // Some components can have multiple buttons that show|hide the same content. Apply the same 'aria-controls' to all buttons.
        if (arg.multipleButtons) {
            [...(arg.multipleButtons as any)].map((button) => {
                button.setAttribute('aria-controls', unique);
                return true;
            });
        } else {
            arg.button.setAttribute('aria-controls', unique);
        }
    }

    arg.button.addEventListener('click', (e: MouseEvent) => {
        const target = getEventElement(e.currentTarget);
        let isExpanded;

        // i.e. 'show|hide' or 'accordion' components.
        if (hasAriaExpanded) {
            isExpanded =
                target?.getAttribute('aria-expanded') === 'true' || false;
            target?.setAttribute(
                'aria-expanded',
                Boolean(!isExpanded).toString()
            );
        }

        // i.e. 'tabs' component.
        if (hasAriaSelected) {
            const tabList = target?.closest(
                '.ui-tabs__tablist'
            ) as HTMLDivElement;
            const tabButtons = tabList.childNodes as NodeListOf<HTMLElement>;
            bindTabsClickEvent(target, tabButtons);

            // Close any other open tab content.
            const tabContents =
                tabList.parentElement?.querySelectorAll('.ui-tabs__content');
            [...(tabContents as any)].map((tabContent) => {
                tabContent.classList.add('is-hidden');

                return true;
            });
        }

        // In 'show|hide' component, label is a text node that we need to toggle. But in 'accordion' or 'tabs' components, we already have a heading element so label will be NULL.
        const label = target?.childNodes[0];
        if (label && arg.buttonLabel && arg.buttonLabelExpanded) {
            label.textContent = isExpanded
                ? arg.buttonLabel
                : arg.buttonLabelExpanded;
        }

        // Toggle class to show or hide content.
        arg.content?.classList.toggle('is-hidden');

        return true;
    });
};
