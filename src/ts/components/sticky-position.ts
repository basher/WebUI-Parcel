export class StickyPosition {
    private stickyHeader: HTMLElement;
    private stickyFooter: HTMLElement;
    private main: HTMLElement;
    private headerOverlay: HTMLElement;

    constructor() {
        this.stickyHeader = document.querySelector(
            '.ui-layout__sticky--header'
        ) as HTMLElement;
        this.stickyFooter = document.querySelector(
            '.ui-layout__sticky--footer'
        ) as HTMLElement;
        this.main = document.querySelector('.ui-layout__main') as HTMLElement;
        this.headerOverlay = document.getElementById(
            'header-overlay'
        ) as HTMLElement;

        this.init();
    }

    public static start(): any {
        const instance = new StickyPosition();

        return instance;
    }

    private init(): void {
        this.initSticky();
    }

    private initSticky(): void {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(
                // Callback.
                (entries) => {
                    entries.forEach((entry) => {
                        if (this.stickyHeader || this.stickyFooter) {
                            if (entry.isIntersecting) {
                                this.stickyHeader?.classList.add(
                                    'is-js-sticky'
                                );
                                this.stickyFooter?.classList.add(
                                    'is-js-sticky'
                                );

                                // Remove inline style so that header overlay is correctly positioned by CSS, not by JS.
                                if (
                                    this.stickyHeader?.classList.contains(
                                        'has-nav-overflow'
                                    )
                                ) {
                                    this.headerOverlay?.removeAttribute(
                                        'style'
                                    );
                                }
                            } else {
                                this.stickyHeader?.classList.remove(
                                    'is-js-sticky'
                                );
                                this.stickyFooter?.classList.remove(
                                    'is-js-sticky'
                                );
                            }
                        }
                    });
                },
                // Options.
                {
                    // The -100% is the important bit, allowing <main> element to start scrolling out of view to trigger the observer callback.
                    rootMargin: '0px 0px -100%',
                }
            );

            if (this.main) {
                observer.observe(this.main);
            }
        }
    }
}
