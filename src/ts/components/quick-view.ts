import { addJSClass } from '../utils/progressive-enhancement';
import { getEventElement } from '../utils/event-handlers';
import { svgPath } from '../utils/svg-path';
import { translate } from '../utils/translation';
import { ajaxAbortHandler, ajaxErrorHandler } from '../utils/ajax-helpers';
import { Share } from './share';

export class QuickView {
    private quickViewToggles: NodeListOf<HTMLButtonElement>;

    constructor(private quickViewGrid: HTMLElement) {
        addJSClass(quickViewGrid);

        this.quickViewToggles =
            quickViewGrid.querySelectorAll('[data-quick-view]');

        this.init();
    }

    public static start(): void {
        const quickViewGrids = document.querySelectorAll('.ui-quick-view-grid');

        if (quickViewGrids) {
            [...(quickViewGrids as any)].map((quickViewGrid) => {
                addJSClass(quickViewGrid);

                const instance = new QuickView(quickViewGrid);

                return instance;
            });
        }
    }

    private init(): void {
        const quickViewItem = this.initQuickViewItem();
        this.initQuickViewToggle(quickViewItem);
    }

    private initQuickViewItem(): HTMLLIElement {
        // 1. Create an <li> to contain quick view content.
        const quickViewItem = document.createElement('li');
        quickViewItem.classList.add('ui-quick-view__item');
        quickViewItem.setAttribute('tabIndex', '0');

        // 2. Create close button.
        const quickViewClose: HTMLButtonElement =
            document.createElement('button');
        quickViewClose.setAttribute('type', 'button');
        quickViewClose.classList.add('ui-button');
        quickViewClose.classList.add('ui-button--icon');
        quickViewClose.classList.add('ui-quick-view__close');

        const svgHref = svgPath();
        const buttonText = translate('Close', 'Close');
        const buttonContent = `
            <svg
                aria-hidden="true"
                focusable="false"
                class="ui-icon"
            >
                <title>${buttonText}</title>
                <use href="${svgHref}#SVG016" />
            </svg>
            <span class="sr-only">${buttonText}</span>
        `;
        quickViewClose.innerHTML = buttonContent;

        // 3. Create empty <div> for Ajax content.
        const quickViewAjax: HTMLDivElement = document.createElement('div');
        quickViewAjax.classList.add('ui-quick-view__ajax');

        quickViewItem.appendChild(quickViewClose);
        quickViewItem.appendChild(quickViewAjax);

        // 4. Handle click event for "close" button in quick view card.
        quickViewClose?.addEventListener('click', (): void => {
            this.handleCloseClick(quickViewItem);
        });

        return quickViewItem;
    }

    private initQuickViewToggle(quickViewItem: HTMLLIElement): void {
        [...(this.quickViewToggles as any)].map((quickViewToggle) => {
            quickViewToggle.classList.remove('is-hidden');

            quickViewToggle.addEventListener('click', (e: MouseEvent): void => {
                let target = getEventElement(
                    e.target
                ) as HTMLButtonElement | null;
                // Button has a nested <span> so ensure we're passing the target as a <button>.
                if (target && target.nodeName !== 'BUTTON') {
                    target = target.closest('.ui-button');
                }
                target &&
                    this.handleQuickViewToggleClick(target, quickViewItem);
            });

            return true;
        });
    }

    private handleQuickViewToggleClick(
        target: HTMLButtonElement,
        quickViewItem: HTMLLIElement
    ): void {
        const clickedCard = target.closest('.ui-card');
        const selectedItem = clickedCard?.closest('li');
        const isExpanded =
            target.getAttribute('aria-expanded') === 'true' || false;
        const toggleLabel = target.querySelector(
            '.ui-icon:last-of-type'
        )?.nextElementSibling;
        const toggleLabelText = isExpanded
            ? target.dataset.quickViewLabelOpen
            : target.dataset.quickViewLabelClose;

        target.setAttribute('aria-expanded', Boolean(!isExpanded).toString());
        target.classList.toggle('is-selected');
        clickedCard?.classList.toggle('is-selected');
        if (toggleLabel && toggleLabelText) {
            toggleLabel.innerHTML = toggleLabelText;
        }

        // "Quick view" toggle button clicked.
        if (!isExpanded) {
            selectedItem &&
                this.quickViewGrid &&
                this.openQuickView(target, quickViewItem, selectedItem);

            // Make Ajax request for quick view content.
            this.ajaxFetch(target, quickViewItem);
        } else {
            this.closeQuickView(quickViewItem);
        }
    }

    private openQuickView(
        target: HTMLButtonElement,
        quickViewItem: HTMLLIElement,
        selectedItem: HTMLLIElement
    ): void {
        // First reset any previously selected quick view toggle buttons.
        this.resetQuickViewToggle(target);

        // Inject quick view item into correct place in the DOM.
        selectedItem &&
            this.quickViewGrid.insertBefore(
                quickViewItem,
                selectedItem.nextSibling
            );
    }

    private closeQuickView(quickViewItem: HTMLLIElement): void {
        this.quickViewGrid.removeChild(quickViewItem);
    }

    private handleCloseClick(quickViewItem: HTMLLIElement): void {
        // Work out which product card triggered quick view, and reset it.
        const clickedCard =
            quickViewItem.previousElementSibling?.querySelector('.ui-card');
        const toggler = clickedCard?.querySelector(
            '[data-quick-view]'
        ) as HTMLButtonElement;
        const togglerLabel = toggler.querySelector(
            '.ui-icon:last-of-type'
        )?.nextElementSibling;

        if (togglerLabel && toggler.dataset.quickViewLabelOpen) {
            togglerLabel.innerHTML = toggler.dataset.quickViewLabelOpen;
        }
        clickedCard?.classList.remove('is-selected');
        toggler.setAttribute('aria-expanded', 'false');
        toggler.classList.remove('is-selected');
        toggler.focus();

        // Remove quick view item.
        this.quickViewGrid.removeChild(quickViewItem);
    }

    private resetQuickViewToggle(target: HTMLButtonElement): void {
        [...(this.quickViewToggles as any)].map((selectedButton) => {
            if (
                selectedButton.classList.contains('is-selected') &&
                selectedButton !== target
            ) {
                const selectedButtonLabel = selectedButton.querySelector(
                    '.ui-icon:last-of-type'
                )?.nextElementSibling;

                if (selectedButtonLabel) {
                    selectedButtonLabel.innerHTML =
                        selectedButton.dataset.quickViewLabelOpen;
                }
                selectedButton.setAttribute('aria-expanded', 'false');
                selectedButton.classList.toggle('is-selected');
                selectedButton
                    .closest('.ui-card')
                    .classList.toggle('is-selected');
            }

            return true;
        });
    }

    // eslint-disable-next-line class-methods-use-this
    private ajaxFetch(target: HTMLElement, quickViewItem: HTMLLIElement): void {
        const ajaxUrl = target.dataset.quickViewUrl;
        const ajaxContainer = quickViewItem.querySelector(
            '.ui-quick-view__ajax'
        ) as HTMLElement;
        const showAjaxLoader = true;
        const ajaxLoaderContainer = ajaxContainer;
        const ajaxTimeout = 10000;

        if (ajaxUrl && ajaxUrl !== '') {
            fetch(ajaxUrl, {
                signal: ajaxAbortHandler({
                    ajaxLoaderContainer,
                    showAjaxLoader,
                    ajaxTimeout,
                }),
            })
                .then((response) => response.text())
                .then((html) => {
                    ajaxContainer.innerHTML = html;

                    // Instantiate 'share' component, as we've Ajax fetched it as part of quick view.
                    Share.start();

                    // Scroll browser - see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView.
                    if (document.body.getBoundingClientRect().width < 1024) {
                        quickViewItem.scrollIntoView();
                    } else {
                        quickViewItem.scrollIntoView({ block: 'center' });
                    }
                })
                .catch((error) => {
                    ajaxErrorHandler({
                        error,
                        ajaxContainer,
                    });
                });
        }
    }
}
