import { getEventElement } from '../utils/event-handlers';

export class ProductCard {
    private productCard: HTMLElement;

    constructor(productCard: HTMLElement) {
        this.productCard = productCard;

        this.init();
    }

    public static start(): void {
        const productCards = document.querySelectorAll('.ui-product-card');

        if (productCards) {
            [...(productCards as any)].map((productCard) => {
                const instance = new ProductCard(productCard);

                return instance;
            });
        }
    }

    private init(): void {
        this.handleProductCardEvents();
        this.handleProductCardGrid();
    }

    private handleProductCardEvents(): void {
        const cardLink: HTMLElement | null =
            this.productCard.querySelector('.ui-card__title > a') ||
            this.productCard.querySelector('.ui-product-card__block-link');

        // Apply behaviour only if product cards is not an <a>.
        if (this.productCard.nodeName !== 'A') {
            this.productCard.addEventListener('mouseenter', () => {
                // eslint-disable-next-line no-param-reassign
                this.productCard.style.cursor = 'pointer';
                return true;
            });

            // Make whole card clickable, but only if event target is NOT a specific card action button or link.
            this.productCard.addEventListener('click', (e: MouseEvent) => {
                const target = getEventElement(e.target);
                if (target?.closest('.ui-button-group') === null) {
                    cardLink?.click();
                }
                return true;
            });
        }
    }

    // TODO: Not sure if this method is still needed? Product cards do NOT appear to be loaded asynchronously anymore.
    private handleProductCardGrid(): void {
        // On stock list page, product cards are added asynchronously, so we use MutationObserver API to detect DOM changes, and fire the 'handleProductCardEvents()' method.
        const domNode = document.querySelector('.ui-product-card-grid');
        const config = { childList: true, subtree: true };

        // Callback function to execute when mutations are observed.
        const callback = (mutations: any): void => {
            for (let i = 0; i < mutations.length; i += 1) {
                if (
                    mutations[i].type === 'childList' ||
                    mutations[i].type === 'subtree'
                ) {
                    [...(mutations[i].addedNodes as any)].map((node) => {
                        if (
                            node.nodeName !== '#text' &&
                            !node.classList.contains('ui-quick-view__item') &&
                            !node.classList.contains('ui-quick-view')
                        ) {
                            this.handleProductCardEvents();
                        }

                        return true;
                    });
                }
            }
        };

        const observer = new MutationObserver(callback);
        if (domNode) {
            observer.observe(domNode, config);
        }
    }
}
