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
}
