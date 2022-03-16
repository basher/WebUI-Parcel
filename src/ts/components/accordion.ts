import { disclosure } from '../utils/disclosure';
import { svgPath } from '../utils/svg-path';
import { addJSClass } from '../utils/progressive-enhancement';

export class Accordion {
    private accordion: HTMLElement;

    constructor(accordion: HTMLElement) {
        this.accordion = accordion;

        this.init();
    }

    public static start(): void {
        const accordionContainers = document.querySelectorAll('.ui-accordion');

        if (accordionContainers) {
            [...(accordionContainers as any)].map((accordion) => {
                addJSClass(accordion);

                const instance = new Accordion(accordion);

                return instance;
            });
        }
    }

    private init(): void {
        this.initAccordion();
    }

    private initAccordion(): void {
        const titles = this.accordion.querySelectorAll('.ui-accordion__title');

        // For every '.ui-accordion' instance, loop through the titles.
        [...(titles as any)].map((title) => {
            const titleText = title.childNodes[0];
            const content = title.nextElementSibling;

            // Programatically create accordion <button>.
            const button = this.createAccordionButton(titleText);

            // Replace title DOM with <button>.
            title.replaceChild(button, titleText);

            // Implement show|hide functionality.
            disclosure({
                button,
                content,
            });

            // Make accordion content keyboard focusable.
            content.setAttribute('tabIndex', '0');

            return true;
        });

        // Open 1st accordion.
        if (this.accordion.dataset.open) {
            const firstButton = this.accordion.querySelector(
                '.ui-accordion__button'
            ) as HTMLButtonElement;
            firstButton.click();
        }
    }

    private createAccordionButton(title: any): HTMLButtonElement {
        const button: HTMLButtonElement = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('aria-expanded', 'false');
        button.classList.add('ui-accordion__button');
        button.classList.add('ui-button--toggle');

        const svgHref = svgPath();
        const buttonContent = `
            <span class="ui-accordion__button__inner">
                ${title.textContent}
                <svg
                    aria-hidden="true"
                    focusable="false"
                    class="ui-icon"
                >
                    <use href="${svgHref}#SVG015" />
                </svg>
                <svg
                    aria-hidden="true"
                    focusable="false"
                    class="ui-icon"
                >
                    <use href="${svgHref}#SVG014" />
                </svg>
            </span>
        `;

        button.innerHTML = buttonContent;

        return button;
    }
}
