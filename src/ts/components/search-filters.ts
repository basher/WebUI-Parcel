import { addJSClass } from '../utils/progressive-enhancement';
import { getEventElement } from '../utils/event-handlers';
import {
    updateQueryStringParameter,
    removeQueryStringParameter,
} from '../utils/query-strings';

export class SearchFilters {
    private searchFiltersContainer: HTMLElement;
    private searchFilters: HTMLElement | null;
    private searchForm: HTMLFormElement | null;
    private searchCondition: HTMLSelectElement | null;
    private searchDisplayCondition: HTMLSelectElement | null;
    private searchSortSelect: HTMLSelectElement | null;
    private searchSortButton: HTMLButtonElement | null;
    private btnReset: HTMLButtonElement | null;

    constructor(searchFiltersContainer: HTMLElement) {
        this.searchFiltersContainer = searchFiltersContainer;
        this.searchFilters = document.querySelector(
            '[data-id=products-filter-content]'
        );
        this.searchForm = document.querySelector(
            '.ui-product-search-results__form'
        );
        this.searchCondition = document.querySelector('#Condition');
        this.searchDisplayCondition =
            document.querySelector('#DisplayCondition');
        this.searchSortSelect = document.querySelector(
            '[data-id=products-sort-select]'
        );
        this.searchSortButton = document.querySelector(
            '[data-id=products-sort-button]'
        );
        this.btnReset = document.querySelector('[type=reset]');

        this.init();
    }

    public static start(): any {
        const searchFiltersContainer = document.querySelector(
            '.ui-product-search-results'
        ) as HTMLElement;

        if (searchFiltersContainer) {
            addJSClass(searchFiltersContainer);

            const instance = new SearchFilters(searchFiltersContainer);

            return instance;
        }
    }

    private init(): void {
        this.initSearchFilters();
        this.handleFiltersScroll();
        this.handleSort();
        this.handleReset();
    }

    private initSearchFilters(): void {
        // Search conditions.
        if (this.searchCondition) {
            this.searchCondition.addEventListener('change', (e) => {
                const target = getEventElement(e.target) as HTMLSelectElement;

                target && this.handleSearchCondition(target.value, target.id);
            });
        }

        // Search display conditions.
        if (this.searchDisplayCondition) {
            this.searchDisplayCondition.addEventListener('change', (e) => {
                const target = getEventElement(e.target) as HTMLSelectElement;

                target && this.handleSearchCondition(target.value, target.id);
            });
        }
    }

    private handleFiltersScroll(): void {
        const searchFilters = this.searchFiltersContainer.querySelector(
            '.ui-product-filter'
        ) as HTMLElement;
        const searchFiltersTabContents =
            searchFilters.querySelectorAll('.ui-tabs__content');

        const scrollCallback = (): void => {
            [...(searchFiltersTabContents as any)].map(
                (searchFiltersTabContent) => {
                    searchFiltersTabContent.style.marginBlockStart = `${searchFilters?.scrollTop}px`;

                    return true;
                }
            );
        };
        window.setTimeout(() => {
            searchFilters?.addEventListener('scroll', scrollCallback);
        }, 500);
    }

    private handleSearchCondition(condition: string, id: string): void {
        let url = window.location.href;

        url = url.replace(/\/[0-9]+(?=\?)|\/[0-9]+$/g, '');

        if (condition === '0' || condition === '') {
            url = removeQueryStringParameter(url, id);
        } else {
            url = updateQueryStringParameter(url, id, condition);
        }

        window.location.href = url;
    }

    private handleSort(): void {
        // Sort search results.
        if (this.searchSortSelect && this.searchSortButton && this.searchForm) {
            // Hide sorting GO button.
            this.searchSortButton.style.display = 'none';

            this.searchSortSelect.addEventListener('change', () => {
                // Submit sort form.
                this.searchForm?.submit();
            });
        }
    }

    private handleReset(): void {
        // Reset search results.
        if (this.btnReset) {
            this.btnReset.addEventListener('click', (e) => {
                const target = getEventElement(e.target) as HTMLButtonElement;

                if (target && this.searchFilters) {
                    const checkboxes =
                        this.searchFilters.querySelectorAll('[type=checkbox]');
                    const slidersMin =
                        this.searchFilters.querySelectorAll('[data-range=min]');
                    const slidersMax =
                        this.searchFilters.querySelectorAll('[data-range=max]');

                    [...(checkboxes as any)].map((checkbox) => {
                        if (checkbox.checked) {
                            checkbox.click();
                        }

                        return true;
                    });

                    [...(slidersMin as any)].map((sliderMin) => {
                        const output = sliderMin.nextElementSibling;

                        if (sliderMin.value !== sliderMin.min && output) {
                            // eslint-disable-next-line no-param-reassign
                            sliderMin.value = sliderMin.min;
                            output.textContent = sliderMin.min;
                        }

                        return true;
                    });

                    [...(slidersMax as any)].map((sliderMax) => {
                        const output = sliderMax.nextElementSibling;

                        if (sliderMax.value !== sliderMax.max && output) {
                            // eslint-disable-next-line no-param-reassign
                            sliderMax.value = sliderMax.max;
                            output.textContent = sliderMax.max;
                        }

                        return true;
                    });
                }
            });
        }
    }
}
