import hoverIntent from 'hoverintent';
import { disclosure } from '../utils/disclosure';
import { addJSClass } from '../utils/progressive-enhancement';
import { translate } from '../utils/translation';
import { accountForScrollbar } from '../utils/handle-scrollbar';
import { getEventElement } from '../utils/event-handlers';
import { ajaxAbortHandler, ajaxErrorHandler } from '../utils/ajax-helpers';

/*
----------------------------------------------------------------------------
Site navigation.

[1] Uses 'hoverIntent' plugin for managing header nav dropdown on :HOVER.
[2] Sub-navigation is triggered by TOUCH event on parent links on touch devices.
[3] Mobile nav behaviour is triggered via a toggle button.

By default, with JS disabled, header navigation does work, even on mobile.
----------------------------------------------------------------------------
*/
export class Navigation {
    private body: HTMLBodyElement;
    private siteHeader: HTMLElement;
    private navigation: HTMLElement;
    private navigationWrap: HTMLElement;
    private parentNavList: HTMLUListElement;
    private dropdownParentListItems: NodeListOf<HTMLElement>;
    private open4thLevelNavLinks: NodeListOf<HTMLElement>;
    private toggleMobileNavButton: HTMLButtonElement;
    private classNameBodyModal: string;
    private classNameNavOpen: string;

    constructor() {
        this.body = document.querySelector('body') as HTMLBodyElement;
        this.siteHeader = document.getElementById('header') as HTMLElement;
        this.navigation = document.getElementById('navigation') as HTMLElement;
        this.navigationWrap = document.getElementById(
            'navigation-wrap'
        ) as HTMLElement;
        this.parentNavList = document.querySelector(
            '.kb-navigation__list'
        ) as HTMLUListElement;
        this.dropdownParentListItems = document.querySelectorAll(
            '[data-dropdown-open]'
        );
        this.open4thLevelNavLinks = document.querySelectorAll('[data-overlay]');
        this.toggleMobileNavButton = document.getElementById(
            'toggle-mobile-nav'
        ) as HTMLButtonElement;

        this.classNameBodyModal = 'has-open-modal';
        this.classNameNavOpen = 'has-open-overlay';

        this.init();
    }

    public static start(): any {
        const instance = new Navigation();

        return instance;
    }

    private init(): void {
        this.initNavigation();
        this.initDropdowns();
        this.initMobileNav();
    }

    private initNavigation(): void {
        if (this.siteHeader) {
            addJSClass(this.siteHeader);
        }
        if (this.navigation) {
            addJSClass(this.navigation);
        }

        if (this.navigationWrap) {
            // On page load and window resize event, ensure that primary navigation is usable if there's not enough room to show all nav items.
            this.handlePrimaryNavSize();

            const resizeCallback = (): void => {
                this.handlePrimaryNavSize();
            };
            window.setTimeout(() => {
                window.addEventListener('resize', resizeCallback);
            }, 500);

            // Similarly, on window scroll event, ensure that dropdown is correctly positioned.
            const windowScrollCallback = (): void => {
                this.handleWindowScroll();
            };
            window.setTimeout(() => {
                window.addEventListener('scroll', windowScrollCallback);
            }, 500);
        }
    }

    // [1] and [2]
    private initDropdowns(): void {
        // Manage maxi-menu dropdowns.
        if (this.dropdownParentListItems) {
            [...(this.dropdownParentListItems as any)].map(
                (dropdownParentListItem) => {
                    const openSubMenuButton =
                        dropdownParentListItem.querySelector(
                            'button.is-hidden-on-small'
                        );

                    // Prevent keyboard focus so keyboard users can't accidentally open dropdown.
                    openSubMenuButton &&
                        openSubMenuButton.setAttribute('tabIndex', '-1');

                    // [1]
                    this.handleHover(dropdownParentListItem);

                    // [2]
                    this.handleTouch(dropdownParentListItem);

                    return true;
                }
            );
        }

        // Manage (3rd level) subnav links that open (4th level) subnav in an overlay when clicked.
        if (this.open4thLevelNavLinks) {
            this.show4thLevelNav();
        }
    }

    // [3]
    private initMobileNav(): void {
        if (this.toggleMobileNavButton) {
            // Show/hide functionality.
            const button = this.toggleMobileNavButton;
            const content = this.navigationWrap;
            disclosure({
                button,
                content,
            });

            // Apply translations.
            const mobileMenuButtonText = translate(
                'MobileNavShow',
                'Show menu'
            );
            const mobileMenuButtonTextExpanded = translate(
                'MobileNav',
                'Close menu'
            );

            const mobileMenuButtonLabel = button.querySelector(
                '.sr-only'
            ) as HTMLElement;
            const svgIconShowTitle = button.querySelectorAll('title')[0];
            const svgIconCloseTitle = button.querySelectorAll('title')[1];

            mobileMenuButtonLabel &&
                (mobileMenuButtonLabel.textContent = mobileMenuButtonText);
            svgIconShowTitle.textContent = mobileMenuButtonText;
            svgIconCloseTitle.textContent = mobileMenuButtonTextExpanded;

            // As well as having a click handler in 'disclosure()' function, we also need some additional DOM manipulation when mobile nav button is clicked.
            this.toggleMobileNavButton.addEventListener('click', () => {
                this.showMobileMenu();

                this.handleMobileMenuButtonClick(
                    mobileMenuButtonLabel,
                    mobileMenuButtonText,
                    mobileMenuButtonTextExpanded
                );

                return true;
            });
        }
    }

    private handleHover(dropdownParentListItem: any): void {
        // Only trigger hoverIntent on top level menu items.
        if (
            dropdownParentListItem.parentElement.classList[0] !==
            'kb-navigation__list--nested'
        ) {
            hoverIntent(
                dropdownParentListItem,
                () => {
                    // Don't trigger HOVER for sticky header mobile nav.
                    if (this.siteHeader.classList.contains('is-js-sticky')) {
                        return;
                    }

                    // Stop page jump when scrollbar is hidden.
                    accountForScrollbar(true);

                    dropdownParentListItem.setAttribute(
                        'data-dropdown-open',
                        'true'
                    );
                    this.siteHeader?.classList.add(this.classNameNavOpen);
                    this.body.classList.add(this.classNameBodyModal);

                    // Ensure nav dropdown is positioned correctly.
                    this.adjustNavDropdownPosition(dropdownParentListItem);
                },
                () => {
                    // Don't trigger MOUSELEAVE for sticky header mobile nav.
                    if (this.siteHeader.classList.contains('is-js-sticky')) {
                        return;
                    }

                    // Stop page jump when scrollbar is shown.
                    accountForScrollbar(false);

                    dropdownParentListItem.setAttribute(
                        'data-dropdown-open',
                        'false'
                    );
                    this.siteHeader.classList.remove(this.classNameNavOpen);
                    this.body.classList.remove(this.classNameBodyModal);

                    // Close (4th level) subnav.
                    this.close4thLevelNav();
                }
            );
        }
    }

    private handleTouch(dropdownParentListItem: any): void {
        // Close any currently open sub-menus, by touching outside the dropdown.
        this.handleTouchOutside(dropdownParentListItem);

        // Open the selected sub-menu, using the <button> not <a>.
        const openSubMenuButton =
            dropdownParentListItem.querySelector('.kb-button');
        openSubMenuButton.addEventListener(
            'touchend',
            () => {
                dropdownParentListItem.setAttribute(
                    'data-dropdown-open',
                    'true'
                );
                this.siteHeader.classList.add(this.classNameNavOpen);
                this.body.classList.add(this.classNameBodyModal);

                // Ensure nav dropdown is positioned correctly.
                this.adjustNavDropdownPosition(dropdownParentListItem);
            },
            true
        );
    }

    private handleTouchOutside(dropdownParentListItem: any): void {
        // Close any currently open sub-menus, by touching outside the dropdown.
        document.addEventListener(
            'touchend',
            (e: TouchEvent) => {
                // Do nothing if the click happened inside the dropdown (unless it's the mobile nav button).
                const thisTarget: any = e.target;
                if (
                    thisTarget.closest('.kb-navigation__dropdown') ||
                    thisTarget.closest('.show-mobile-nav') ||
                    thisTarget.closest('#toggle-mobile-nav')
                ) {
                    return;
                }

                // Otherwise, close dropdown.
                dropdownParentListItem.setAttribute(
                    'data-dropdown-open',
                    'false'
                );
                this.siteHeader.classList.remove(this.classNameNavOpen);
                this.body.classList.remove(this.classNameBodyModal);

                // Also close mobile menu if sticky header is active on larger screens.
                if (this.siteHeader.classList.contains('is-js-sticky')) {
                    const toggleMobileNavButton =
                        document.getElementById('toggle-mobile-nav');
                    if (
                        toggleMobileNavButton &&
                        toggleMobileNavButton.getAttribute('aria-expanded') ===
                            'true'
                    ) {
                        toggleMobileNavButton.click();
                    }
                }

                // Close (4th level) subnav.
                this.close4thLevelNav();
            },
            true
        );
    }

    private adjustNavDropdownPosition(dropdownParentListItem: any): void {
        const overlay: HTMLElement = this.siteHeader.querySelector(
            '.kb-layout__header__overlay'
        ) as HTMLElement;
        const dropdown = dropdownParentListItem.querySelector(
            '.kb-navigation__dropdown'
        );
        const dropdownOverlay = dropdownParentListItem.querySelector(
            '.kb-navigation__dropdown--overlay'
        );
        let offset = 0;

        // Calculate dropdown position, depending on whether we're showing mobile nav (which also shows when header is sticky).
        if (
            window.getComputedStyle(this.toggleMobileNavButton).display ===
            'none'
        ) {
            if (this.navigation.classList.contains('kb-navigation--vertical')) {
                return;
            }

            offset =
                dropdownParentListItem.getBoundingClientRect().top +
                dropdownParentListItem.getBoundingClientRect().height;
        } else {
            // Mobile nav...
            offset =
                this.toggleMobileNavButton.getBoundingClientRect().top +
                this.toggleMobileNavButton.getBoundingClientRect().height;

            this.parentNavList.style.top = `${offset}px`;

            // Re-calculate height/max-height for mobile dropdown, which takes account of any other HTML that precedes site <header>.
            dropdown.style.height = `calc(100vh - ${offset}px)`;
            dropdown.style.maxHeight = `calc(100vh - ${offset}px)`;
        }

        if (overlay) {
            overlay.style.top = `${offset}px`;
            overlay.style.height = `calc(100vh - ${offset}px)`;
        }
        if (dropdownOverlay) {
            dropdownOverlay.style.top = `${offset}px`;
        }

        // Now set dropdown position.
        dropdown.style.top = `${offset}px`;

        // Window has scrolled. Adjust dropdown position accordingly.
        if (
            this.siteHeader.classList.contains('has-window-scrolled') &&
            !this.siteHeader.classList.contains('is-js-sticky')
        ) {
            if (this.navigation.classList.contains('kb-navigation--vertical')) {
                return;
            }

            offset += window.scrollY;

            if (overlay) {
                overlay.style.top = `${offset}px`;
                overlay.style.height = `calc(100vh - ${dropdown.offsetTop}px)`;
            }
            if (dropdownOverlay) {
                dropdownOverlay.style.top = `${offset}px`;
            }
            dropdown.style.top = `${offset - window.scrollY}px`;
        }
    }

    private showMobileMenu(): void {
        [...(this.dropdownParentListItems as any)].map(
            (dropdownParentListItem) => {
                // Make sure all sub-menus are closed initially
                dropdownParentListItem.setAttribute(
                    'data-dropdown-open',
                    'false'
                );

                // Ensure nav dropdown is positioned correctly.
                this.adjustNavDropdownPosition(dropdownParentListItem);

                // Slide sub-menus in and out of view.
                this.slideMobileSubMenus(dropdownParentListItem);

                return true;
            }
        );

        // Add explicit mobile class so it's really obvious what's going on.
        this.navigationWrap.classList.add('show-mobile-nav');
        this.siteHeader.classList.add(this.classNameNavOpen);
        this.body?.classList.add(this.classNameBodyModal);
    }

    private slideMobileSubMenus(dropdownParentListItem: any): void {
        const buttonBack =
            dropdownParentListItem.querySelector('[data-back-button]');
        const subMenu = dropdownParentListItem.querySelector(
            '.kb-navigation__dropdown'
        );
        const link = dropdownParentListItem.querySelector(
            '.kb-navigation__link'
        );

        link.addEventListener(
            'click',
            (e: TouchEvent) => {
                e.preventDefault(); // Don't activate parent link's HREF.
                dropdownParentListItem.setAttribute(
                    'data-dropdown-open',
                    'true'
                );
                subMenu.classList.add('kb-navigation__dropdown--is-open');
            },
            true
        );

        if (buttonBack) {
            const buttonBackLabel = buttonBack
                .querySelector('.kb-button__inner')
                .querySelector('span');
            const isNestedBackLink = subMenu.closest(
                '.kb-navigation__list--nested'
            );

            // Apply translations.
            if (isNestedBackLink) {
                const parentMenuTitle =
                    isNestedBackLink.parentNode.querySelector(
                        '.kb-navigation__title'
                    );

                buttonBackLabel.textContent = translate(
                    'MobileNavBack',
                    'Back to',
                    parentMenuTitle.textContent
                );
            } else {
                buttonBackLabel.textContent = translate(
                    'MobileNavBackToMainMenu',
                    'Back to main menu'
                );
            }

            buttonBack.addEventListener('click', () => {
                dropdownParentListItem.setAttribute(
                    'data-dropdown-open',
                    'false'
                );
                subMenu.classList.remove('kb-navigation__dropdown--is-open');
            });
        }
    }

    private handleMobileMenuButtonClick(
        mobileMenuButtonLabel: HTMLElement,
        mobileMenuButtonText: string,
        mobileMenuButtonTextExpanded: string
    ): void {
        // const mobileMenuButtonLabel =
        //     arg.toggleMobileNavButton.querySelector('.sr-only');

        if (
            this.toggleMobileNavButton.getAttribute('aria-expanded') === 'true'
        ) {
            mobileMenuButtonLabel &&
                (mobileMenuButtonLabel.textContent =
                    mobileMenuButtonTextExpanded);
        } else {
            mobileMenuButtonLabel &&
                (mobileMenuButtonLabel.textContent = mobileMenuButtonText);
            this.navigationWrap.classList.remove('show-mobile-nav');
            this.siteHeader.classList.remove(this.classNameNavOpen);
            this.body.classList.remove(this.classNameBodyModal);

            // Close (4th level) subnav.
            this.close4thLevelNav();
        }
    }

    private handlePrimaryNavSize(): void {
        // const primaryNavList = this.navigationWrap?.querySelector(
        //     '.kb-navigation__list'
        // );
        const lastNavListItem =
            this.parentNavList.lastElementChild?.classList.contains(
                'kb-navigation__item--buttons'
            ) === true
                ? this.parentNavList.lastElementChild.previousElementSibling
                : this.parentNavList.lastElementChild;

        // Handle any overflow of primary nav items only when viewport is greater or equal to medium CSS breakpoint.
        if (this.body && this.body.getBoundingClientRect().width >= 769) {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver(
                    // Callback.
                    (entries) => {
                        entries.forEach((entry) => {
                            // Based on threshold in options, when last nav item is not 100% visible, handle the overflow, but NOT if header is sticky (because we show mobile menu instead).
                            if (
                                !entry.isIntersecting &&
                                !this.siteHeader?.classList.contains(
                                    'is-js-sticky'
                                )
                            ) {
                                // NOTE: We do NOT remove this class again. We wait for page (re)load instead.
                                this.siteHeader?.classList.add(
                                    'has-nav-overflow'
                                );
                            }
                        });
                    },
                    // Options.
                    {
                        root: this.parentNavList,
                        // Fire callback when when observed nav item is 100% in view.
                        threshold: [1.0],
                    }
                );

                // Observe last primary nav list item.
                lastNavListItem && observer.observe(lastNavListItem);
            }
        }
    }

    private handleWindowScroll(): void {
        if (window.scrollY > 0) {
            this.siteHeader.classList.add('has-window-scrolled');
        } else {
            this.siteHeader.classList.remove('has-window-scrolled');
        }
    }

    // This is for 4th level subnav (e.g. product variants).
    private show4thLevelNav(): void {
        [...(this.open4thLevelNavLinks as any)].map((open4thLevelNavLink) => {
            open4thLevelNavLink.addEventListener('click', (e: MouseEvent) => {
                const target = getEventElement(
                    e.currentTarget
                ) as HTMLAnchorElement;
                const dropdown = target?.closest(
                    '.kb-navigation__dropdown'
                ) as HTMLElement;
                const productFilter =
                    dropdown.querySelector('.kb-product-filter');
                const dropdownOverlay =
                    dropdown?.nextElementSibling as HTMLElement;
                const overlayContent = dropdownOverlay.querySelector(
                    '.kb-navigation__dropdown--overlay__content'
                ) as HTMLElement;
                const overlayButtonClose = dropdownOverlay.querySelector(
                    '[data-overlay-close]'
                ) as HTMLButtonElement;
                const overlayTitleText =
                    target?.querySelector('.kb-card__title')?.textContent;
                const overlayTitle = dropdownOverlay.querySelector(
                    '.kb-navigation__dropdown--overlay__title'
                );

                if (overlayTitle && overlayTitleText) {
                    overlayTitle.textContent = overlayTitleText;
                }

                // Show overlay.
                if (target && dropdownOverlay) {
                    const ajaxUrl = target.dataset.overlay;
                    const ajaxContainer = overlayContent;
                    const showAjaxLoader = true;
                    const ajaxLoaderContainer = ajaxContainer;
                    const ajaxTimeout = 10000;

                    if (ajaxUrl && ajaxUrl !== '') {
                        e.preventDefault();
                        dropdownOverlay?.classList.remove('is-hidden');

                        // Hide 3rd level nav so content doesn't show beneath 4th level.
                        if (productFilter) {
                            productFilter.classList.add('is-hidden');
                        }

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
                            })
                            .catch((error) => {
                                ajaxErrorHandler({ error });
                                // Redirect to product page.
                                window.location.href = target.href;
                            });
                    }
                }

                // Close overlay on 'back' button click
                if (overlayButtonClose) {
                    overlayButtonClose.addEventListener('click', () => {
                        dropdownOverlay?.classList.add('is-hidden');

                        if (productFilter) {
                            productFilter.classList.remove('is-hidden');
                        }
                    });
                }
            });

            return true;
        });
    }

    private close4thLevelNav(): void {
        const close4thLevelNavButtons = document.querySelectorAll(
            '[data-overlay-close]'
        ) as NodeListOf<HTMLButtonElement>;
        [...(close4thLevelNavButtons as any)].map((close4thLevelNavButton) => {
            // If 4th level nav is open (i.e. it does NOT have an 'is-hidden' class), click the close button.
            if (
                !close4thLevelNavButton
                    .closest('.kb-navigation__dropdown')
                    .classList.contains('is-hidden')
            ) {
                close4thLevelNavButton.click();
            }

            return true;
        });
    }
}
