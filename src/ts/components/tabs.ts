import { disclosure } from '../utils/disclosure';
import { randomString } from '../utils/random-string';
import { bindTabsKeyboardEvent } from '../utils/event-handlers';
import { addJSClass } from '../utils/progressive-enhancement';
import { Accordion } from './accordion';

export class Tabs {
    private tabs: HTMLElement;
    private index: number;
    private tabsMinWidth: number;
    private tabsToAccordion: any[];
    private onPageLoad: boolean;

    constructor(tabs: HTMLElement, index: number) {
        this.tabs = tabs;
        this.index = index; // Numeric reference to each set of tabs.
        this.tabsMinWidth = 768; // Same value as Sass $bp-small.
        this.tabsToAccordion = [];
        this.onPageLoad = true;

        this.init();
    }

    public static start(): void {
        const tabsContainers = document.querySelectorAll('.ui-tabs');

        if (tabsContainers) {
            [...(tabsContainers as any)].map((tabs, index) => {
                addJSClass(tabs);

                const instance = new Tabs(tabs, index);

                return instance;
            });
        }
    }

    private init(): void {
        this.initTabs();
    }

    private initTabs(): void {
        // Clone original DOM (prior to any JS manipulation) so we can convert the clean HTML to tabs or accordion.
        const clonedTabsDOM = this.tabs.cloneNode(true);

        // Do NOT convert tabs to accordion if data-tabs-no-accordion="true".
        const isNotConvertedToAccordion =
            this.tabs.getAttribute('data-tabs-no-accordion') === 'true';

        // Determine overall width of tabs and convert to accordion when appropriate on [1] page load, and [2] screen resize.
        // [1]
        this.handleTabSize(clonedTabsDOM, isNotConvertedToAccordion);

        // [2]
        const resizeCallback = (): void => {
            this.onPageLoad = false;
            this.handleTabSize(clonedTabsDOM, isNotConvertedToAccordion);
        };
        window.setTimeout(() => {
            window.addEventListener('resize', resizeCallback);
        }, 500);
    }

    private handleTabSize(
        clonedTabsDOM: any,
        isNotConvertedToAccordion: boolean
    ): void {
        // On page load, create tabs (or accordion) as appropriate, based on 'tabs' or 'body' width.
        if (this.onPageLoad) {
            // Tabs may be initially hidden in the DOM (e.g. in header nav dropdown). Therefore, we cannot calculate the width, so get BODY width too.
            const body = document.body;

            if (
                isNotConvertedToAccordion ||
                this.tabs.getBoundingClientRect().width > this.tabsMinWidth ||
                body.getBoundingClientRect().width > this.tabsMinWidth
            ) {
                this.createTabs();
            } else {
                !isNotConvertedToAccordion &&
                    this.convertToAccordion(this.tabs);

                // Update local state so we don't keep creating accordion.
                this.tabsToAccordion[this.index] = this.index;
            }
        } else if (
            // On screen resize, convert tabs to accordion (if necessary) using original HTML markup.
            !isNotConvertedToAccordion &&
            this.tabsToAccordion[this.index] !== this.index &&
            this.tabs.getBoundingClientRect().width !== 0 &&
            this.tabs.getBoundingClientRect().width <= this.tabsMinWidth
        ) {
            this.tabs.after(clonedTabsDOM);
            this.tabs.remove();
            this.convertToAccordion(clonedTabsDOM);

            // Update local state so we don't keep creating accordion.
            this.tabsToAccordion[this.index] = this.index;
        }
    }

    private createTabs(): void {
        const titles: NodeListOf<HTMLElement> =
            this.tabs.querySelectorAll('.ui-tabs__title') ||
            this.tabs.querySelectorAll('.ui-accordion__title');

        // Create 'tablist' container.
        const tablist = this.createTabList();

        // For every '.ui-tabs' instance, loop through the titles.
        [...(titles as any)].map((title, index) => {
            const titleText = title.childNodes[0];
            const content = title.nextElementSibling;

            // Programatically create tab <button>.
            const button = this.createTabButton(titleText);

            // Hide original title.
            title.style.display = 'none';

            // Move new tab buttons into 'tablist'. The buttons must be direct children in order that ARIA 'tab' roles work correctly without throwing errors.
            tablist.appendChild(button);

            // Make sure content 'tabpanel' has correct ARIA properties.
            this.modifyTabPanel(content, button);

            // Implement show|hide functionality.
            disclosure({
                button,
                content,
            });

            // Open 1st tab by default, but not if we have 'data-open' attribute.
            if (index === 0 && !this.tabs.dataset.open) {
                button.click();
            }

            // Handle KEYDOWN events for ARROW keys to traverse the tabs.
            button.addEventListener('keydown', (e: KeyboardEvent) => {
                bindTabsKeyboardEvent(
                    titles,
                    e,
                    index,
                    tablist,
                    '.ui-tabs__button'
                );
            });

            return true;
        });
    }

    private convertToAccordion(tabsContainer: any): void {
        const titles: NodeListOf<HTMLElement> =
            tabsContainer.querySelectorAll('.ui-tabs__title');
        tabsContainer.classList.remove('ui-tabs');
        tabsContainer.classList.add('ui-accordion');

        [...(titles as any)].map((title) => {
            const content = title.nextElementSibling;
            title.classList.remove('ui-tabs__title');
            title.classList.add('ui-accordion__title');
            content.classList.remove('ui-tabs__content');
            content.classList.add('ui-accordion__content');

            return true;
        });

        Accordion.start();
    }

    private createTabList(): HTMLElement {
        const tablist: HTMLElement = document.createElement('div');
        tablist.setAttribute('role', 'tablist');
        tablist.classList.add('ui-tabs__tablist');
        this.tabs.prepend(tablist);

        return tablist;
    }

    private createTabButton(title: any): HTMLButtonElement {
        const button: HTMLButtonElement = document.createElement('button');
        const buttonContent = title.textContent;
        button.setAttribute('type', 'button');
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('tabIndex', '-1');
        button.setAttribute('role', 'tab');
        button.classList.add('ui-tabs__button');
        button.innerHTML = buttonContent;

        // Auto-generate unique ID.
        const unique = randomString(button.classList[0]);
        button.setAttribute('id', unique);

        return button;
    }

    private modifyTabPanel(content: any, button: HTMLButtonElement): void {
        content.setAttribute('role', 'tabpanel');
        content.setAttribute('tabIndex', '0');
        content.setAttribute('aria-labelledby', button.id);
    }
}
