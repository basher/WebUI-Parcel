/* eslint-disable no-param-reassign, no-undef */
import { addJSClass } from '../utils/progressive-enhancement';
import { randomString } from '../utils/random-string';
import { translate } from '../utils/translation';
import { svgPath } from '../utils/svg-path';
import {
    getEventElement,
    bindTabsKeyboardEvent,
    bindTabsClickEvent,
} from '../utils/event-handlers';

type SliderConfig = {
    slideWidth: string;
    slideCount: number;
    slideDuration: number;
    hasTrigger: boolean;
    useTabs: boolean;
    useCustomTabs: boolean;
    isAutoPlay: boolean;
    isVariableHeight: boolean;
    isFixedHeight: boolean;
    isAutoWidth: boolean;
    isNoFocus: boolean;
    moveByOneSlide: boolean;
};

type SliderDimension = {
    total: number;
    slider: number;
    slide: number;
    advanceBy: number;
};

export class Slider {
    private id: string;
    private htmlDirection: string;

    private sliderList: HTMLElement;
    private slides: HTMLElement[];
    private buttonContainer: HTMLElement | null = null;
    private buttons: HTMLButtonElement[] = [];

    private slideTimer = 0;
    private autoplayState: 'auto' | 'paused' | 'stopped' = 'auto';

    private currentSlide = 0;

    private config: SliderConfig = {
        slideWidth: '',
        slideCount: 0,
        slideDuration: 5000,
        useTabs: false,
        useCustomTabs: false,
        isVariableHeight: false,
        isFixedHeight: false,
        hasTrigger: false,
        isAutoWidth: false,
        isNoFocus: false,
        isAutoPlay: true,
        moveByOneSlide: false,
    };

    constructor(private slider: HTMLElement) {
        /*
            Slider is the container
            Slider List is the collection of slides, i.e. <ul>
            Slides are the individual slides, i.e. <li>
        */
        const sliderList = slider.querySelector(
            '.ui-slider__slides'
        ) as HTMLElement;
        const slides = slider.querySelectorAll('.ui-slider__slide');

        if (sliderList == null || slides == null) {
            throw new Error('Cannot initialize slider instance');
        }

        this.sliderList = sliderList;
        this.slides = [...(slides as any)];
        this.id = randomString(this.sliderList.classList[0] || 'x');
        this.htmlDirection = document.querySelector('html')?.dir || '';
        this.init();
    }

    public static start(): void {
        const sliderContainers = document.querySelectorAll('.ui-slider');
        if (sliderContainers) {
            // Loop through outer '.ui-slider' wrapper elements.
            [...(sliderContainers as any)].map((slider) => {
                addJSClass(slider);

                // The instance maintains state for the slider
                const instance = new Slider(slider);

                return instance;
            });
        }
    }

    public next(): void {
        this.goToNext(false);
    }

    public back(): void {
        this.goToBack(false);
    }

    private goToNext(isAuto: boolean): void {
        const dimensions = this.getDimensions();
        if (dimensions.total === 0) {
            return;
        }

        let move = dimensions.advanceBy + 1;
        let index: number;

        if (dimensions.advanceBy > 1) {
            const currentPos = this.currentSlide * dimensions.advanceBy;
            const lastPos =
                (this.slides.length - dimensions.advanceBy) *
                dimensions.advanceBy;

            if (currentPos >= lastPos) {
                this.goTo(0, isAuto);
                return;
            }
        }

        do {
            move -= 1;
            index = this.currentSlide + move;
        } while (move > 0 && index >= this.slides.length);

        if (move === 0) {
            index = 0;
        }

        this.goTo(index, isAuto);

        if (this.config.useTabs) {
            this.highlightCurrentTab(index);
        }
    }

    private goToBack(isAuto: boolean): void {
        const dimensions = this.getDimensions();
        if (dimensions.total === 0) {
            return;
        }

        let move = dimensions.advanceBy + 1;
        let index: number;

        do {
            move -= 1;
            index = this.currentSlide - move;
        } while (move > 0 && index < 0);

        if (move === 0) {
            index = this.slides.length - dimensions.advanceBy;
        }

        this.goTo(index, isAuto);

        if (this.config.useTabs) {
            this.highlightCurrentTab(index);
        }
    }

    public goTo(index = 0, isAuto = true): void {
        /*
        This should be the only place that
        changes the slide position
        */

        if (!isAuto) {
            this.cancelAutoplay();
        }

        if (!this.setCurrentSlide(index)) {
            return;
        }

        const dimensions = this.getDimensions();

        const pixels = dimensions.slide * this.currentSlide;
        if (pixels > dimensions.total) {
            this.goTo();
            return;
        }

        const style = `-${pixels}px`;

        const position =
            this.htmlDirection.toLowerCase() === 'rtl' ? 'right' : 'left';

        // Super useful for debugging purposes only.
        // console.log(
        //     this.id,
        //     'show slide at',
        //     this.currentSlide,
        //     'moving',
        //     position,
        //     'to',
        //     style,
        //     dimensions
        // );

        this.sliderList.style[position] = style;

        // Handle other things... related to sliding
        this.setVisibility(pixels, dimensions);

        // Dispatch custom event for other components to listen for.
        const eventSliderGoTo = new Event('SliderGoTo');
        window.dispatchEvent(eventSliderGoTo);
    }

    private setCurrentSlide(index: number): boolean {
        if (index - index === 0) {
            // This should be the only setter for this.currentSlide
            this.currentSlide = index;
            return true;
        }

        return false;
    }

    private init(): void {
        // Controls order of initialization
        this.initSlider();
        this.initConfiguration();
        this.initSlides();
        this.initButtons();
        this.initTabList();
        this.initResize();

        this.goTo();

        this.initAutoplay();
    }

    private initSlider(): void {
        this.slider.setAttribute('aria-roledescription', 'carousel');
        this.slider.setAttribute('tabIndex', '0');
        this.sliderList.setAttribute('id', this.id);
        if (this.slider.nodeName === 'DIV') {
            this.slider.setAttribute('role', 'region');
        }
    }

    private initConfiguration(): void {
        // Values
        this.config.slideWidth = this.getStringAttribute('data-slide-width');
        this.config.slideCount = parseInt(
            this.getStringAttribute('data-slide-count') || '0',
            10
        );
        this.config.slideDuration = parseInt(
            this.getStringAttribute('data-slide-duration') || '5000',
            10
        );

        // Autoplay is special as it is default-on
        if (this.getStringAttribute('data-slide-autoplay') === 'false') {
            this.config.isAutoPlay = false;
        }

        // Flag Keys
        const flags = {
            useTabs: 'data-slide-tabbed',
            useCustomTabs: 'data-slide-custom-tabs',
            isVariableHeight: 'data-slide-variable-height',
            isFixedHeight: 'data-slide-fixed-height',
            hasTrigger: 'data-slide-trigger',
            isAutoWidth: 'data-slide-autowidths',
            isNoFocus: 'data-slide-nofocus',
            moveByOneSlide: 'data-slide-move-by-one',
        };

        // eslint-disable-next-line no-restricted-syntax
        for (const prop in flags) {
            if (Object.prototype.hasOwnProperty.call(flags, prop)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore: Dynamic Code Block
                this.config[prop] = this.getBoolAttribute(flags[prop]);
            }
        }
    }

    private initSlides(): void {
        for (let i = 0; i < this.slides.length; i += 1) {
            const slide = this.slides[i] as HTMLElement;

            slide.setAttribute('data-index', i.toString());
            slide.setAttribute(
                'aria-label',
                `slide ${i + 1} of ${this.slides.length}`
            );

            if (!this.config.isNoFocus) {
                slide.setAttribute('tabIndex', '-1');
            }

            if (this.config.slideWidth) {
                slide.style.flexBasis = this.config.slideWidth;
            }

            if (this.config.slideCount > 1) {
                slide.style.flexBasis = `${100 / this.config.slideCount}%`;
            }
        }
    }

    private initButtons(): void {
        const buttonContainer = document.createElement('div');
        const buttonNext = this.createButton('next');
        const buttonBack = this.createButton('previous');

        this.buttonContainer = buttonContainer;
        this.buttons.push(buttonNext);
        this.buttons.push(buttonBack);

        // TODO: what's this for?
        [...(this.slider.children as any)].map((child) => {
            if (child.classList.contains('ui-button-group')) {
                child.parentNode?.removeChild(child);
            }

            return true;
        });

        if (this.slides.length > 1) {
            buttonNext.addEventListener('click', () => this.next());
            buttonBack.addEventListener('click', () => this.back());

            buttonContainer.classList.add('ui-button-group');
            buttonContainer.appendChild(buttonNext);
            buttonContainer.appendChild(buttonBack);
            this.slider.insertBefore(buttonContainer, this.sliderList);
        }

        this.handleButtonDisplay();
    }

    private initTabList(): void {
        if (
            this.config.useTabs &&
            this.slider.querySelector('[role=tablist]') === null &&
            this.slides.length > 1 &&
            this.htmlDirection
        ) {
            // Remove default role on <ul>.
            this.sliderList.setAttribute('role', 'presentation');

            // Create tablist container.
            const tablist: HTMLDivElement = document.createElement('div');
            tablist.setAttribute('role', 'tablist');
            tablist.classList.add('ui-button-group');
            tablist.classList.add('ui-button-group--centered');
            this.slider.insertBefore(tablist, this.sliderList);

            // Add 1 button (which will behave as a tab) per slide.
            for (let i = 0; i < this.slides.length; i += 1) {
                const button = document.createElement('button');
                button.setAttribute('type', 'button');
                button.setAttribute('role', 'tab');
                button.setAttribute('data-id', `${i}`);
                button.setAttribute('aria-controls', this.id);
                button.classList.add('ui-button');

                if (i === this.currentSlide) {
                    button.setAttribute('aria-selected', 'true');
                    button.setAttribute('tabIndex', '0');
                } else {
                    button.setAttribute('aria-selected', 'false');
                    button.setAttribute('tabIndex', '-1');
                }

                // Apply translations.
                const tabButtonLabel = translate(
                    'SliderGoTo',
                    'Go to slide',
                    (i + 1).toString()
                );
                button.innerHTML = `<span class="sr-only">${tabButtonLabel}</span>`;

                // Create custom tab buttons.
                if (this.config.useCustomTabs) {
                    const customTab =
                        this.slides[i].querySelector('[data-slide-tab]');
                    if (customTab) {
                        button.appendChild(customTab);
                    }
                }

                tablist.appendChild(button);
            }

            // Ensure we have enough 'padding-bottom' on slider to accommodate custom tab controls (i.e. thumbnails).
            if (this.config.useCustomTabs) {
                const correctionFactor = 20; // Add some breathing space.
                const thumbsHeight = tablist.getBoundingClientRect().height;
                const sliderPadding = thumbsHeight + correctionFactor;
                this.slider.style.paddingBlockEnd = `${sliderPadding}px`;
            }

            // Handle tab button events.
            const tabButtons: NodeListOf<HTMLElement> =
                tablist.querySelectorAll('.ui-button');
            [...(tabButtons as any)].map((tabButton, index) => {
                tabButton.addEventListener('click', (e: MouseEvent) => {
                    const target = getEventElement(
                        e.currentTarget
                    ) as HTMLButtonElement;
                    bindTabsClickEvent(target, tabButtons);

                    // Match clicked tab button to ID of slide to show.
                    const slideIdToShow = parseInt(
                        target?.getAttribute('data-id') || '0',
                        10
                    );

                    this.goTo(slideIdToShow, false);

                    return true;
                });

                // Handle KEYDOWN events for ARROW keys to traverse the tab buttons.
                tabButton.addEventListener('keydown', (e: KeyboardEvent) => {
                    bindTabsKeyboardEvent(
                        tabButtons,
                        e,
                        index,
                        tablist,
                        '.ui-button'
                    );
                });

                return true;
            });
        }

        if (this.config.hasTrigger) {
            // TODO: Make this work from an index also... simplest way.
            // Triggers will be links or buttons outside the slider, with specific 'data-' attributes that point to the specific slider and slide.
            const triggers = document.querySelectorAll('[data-slide-to-show]');

            [...(triggers as any)].map((trigger) => {
                trigger.addEventListener('click', (e: MouseEvent) => {
                    const target = getEventElement(e.currentTarget);
                    const targetSliderId = target?.dataset.slider;
                    const targetSliderTab = target?.dataset.slideToShow;

                    if (targetSliderTab) {
                        const targetSliderTabId = parseInt(targetSliderTab, 10);

                        if (targetSliderId && targetSliderTab) {
                            const targetSlider = document.querySelector(
                                `[data-id=${targetSliderId}]`
                            );

                            const tabToClick: any =
                                targetSlider?.querySelectorAll('[role=tab]')[
                                    targetSliderTabId - 1
                                ];
                            tabToClick?.click();
                        }
                    }
                });
                return true;
            });
        }
    }

    private highlightCurrentTab(index: number): void {
        // Highlight current tab if 'PREV' or 'NEXT' buttons are pressed.
        const tablist = this.slider.querySelector(
            '[role=tablist]'
        ) as HTMLDivElement;
        const tabButtons: NodeListOf<HTMLElement> =
            tablist.querySelectorAll('.ui-button');

        [...(tabButtons as any)].map((tabButton) => {
            if (tabButton.dataset.id === index.toString()) {
                bindTabsClickEvent(tabButton, tabButtons);
            }
        });
    }

    private initResize(): void {
        const handleResize = (): void => {
            this.goTo(this.currentSlide);

            if (this.config.isAutoPlay) {
                // Restart the autoplay timer to avoid
                // gratuitous animation directly after resize
                this.autoplay();
            }

            window.setTimeout(() => {
                this.handleButtonDisplay();
            }, 1000);
        };

        // Prefer to use ResizeObserver where available.
        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(this.slider);
        } else {
            let resizeTimer: number | undefined;

            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(() => {
                    handleResize();
                }, 250);
            });
        }
    }

    private initAutoplay(): void {
        if (this.config.isAutoPlay) {
            // Set up autoplay
            this.autoplayState = 'auto';
            this.autoplay();

            // Pause slider on mouseover
            this.slider.addEventListener('mouseenter', () => {
                this.pauseAutoplay();
            });

            this.slider.addEventListener('mouseleave', () => {
                this.resumeAutoplay();
            });

            // Pause slider on focus
            this.slider.addEventListener('focusin', () => {
                this.pauseAutoplay();
            });

            this.slider.addEventListener('focusout', () => {
                this.resumeAutoplay();
            });
        }
    }

    private pauseAutoplay(): void {
        this.autoplayState = 'paused';
        this.sliderList.setAttribute('aria-live', 'polite');
    }

    private resumeAutoplay(): void {
        if (this.autoplayState !== 'stopped') {
            this.autoplayState = 'auto';
            this.sliderList.removeAttribute('aria-live');
        }
    }

    private autoplay(): void {
        window.clearTimeout(this.slideTimer);

        if (this.autoplayState === 'stopped') {
            return;
        }

        this.slideTimer = window.setTimeout(() => {
            if (this.isInViewport() && this.autoplayState === 'auto') {
                // Only slide if fully within viewport
                this.goToNext(true);
            }

            this.autoplay();
        }, 5000);
    }

    private cancelAutoplay(): void {
        window.clearTimeout(this.slideTimer);
        this.autoplayState = 'stopped';
    }

    private handleButtonDisplay(): void {
        if (this.buttonContainer == null) {
            return;
        }

        const dimensions = this.getDimensions();

        if (dimensions.advanceBy === 1) {
            return;
        }

        const allVisible = dimensions.slider > dimensions.total;

        if (allVisible) {
            this.buttonContainer.classList.add('is-hidden');
            this.slider.classList.add('ui-slider--no-buttons');
            if (this.currentSlide > 0) {
                this.goTo(0, true);
            }
        } else {
            this.buttonContainer.classList.remove('is-hidden');
            this.slider.classList.remove('ui-slider--no-buttons');
        }
    }

    private isInViewport(): boolean {
        const rect = this.slider.getBoundingClientRect();
        const docElem = document.documentElement;
        const height = window.innerHeight || docElem.clientHeight;
        const width = window.innerWidth || docElem.clientWidth;

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= height &&
            rect.right <= width
        );
    }

    private getDimensions(): SliderDimension {
        let totalWidth = 0;
        for (let i = 0; i < this.slides.length; i += 1) {
            totalWidth += Slider.getWidth(this.slides[i], 0);
        }

        const sliderWidth = Slider.getWidth(this.slider, 0);
        const slideWidth = Slider.getWidth(this.slides[0], sliderWidth);

        let numberOfSlidesEntirelyVisible =
            sliderWidth > 0 ? Math.floor(sliderWidth / slideWidth) : 0;

        if (this.config.moveByOneSlide) {
            numberOfSlidesEntirelyVisible = 1;
        }

        if (numberOfSlidesEntirelyVisible === 0) {
            numberOfSlidesEntirelyVisible = 1;
        }

        return {
            total: totalWidth,
            slider: sliderWidth,
            slide: slideWidth,
            advanceBy: numberOfSlidesEntirelyVisible,
        };
    }

    private static getWidth(
        elem: HTMLElement | null,
        fallback: number
    ): number {
        return elem?.getBoundingClientRect()?.width || fallback;
    }

    private createButton(label: string): HTMLButtonElement {
        const button: HTMLButtonElement = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('aria-controls', this.id);
        button.setAttribute('data-button-type', label);
        button.classList.add('ui-button');
        button.classList.add('ui-button--icon');

        let iconType: string;

        let buttonLabel = '';

        switch (label) {
            case 'next':
                iconType = '#SVG012';
                buttonLabel = translate('SliderNext', 'Next slide');
                break;
            case 'previous':
                iconType = '#SVG013';
                buttonLabel = translate('SliderPrevious', 'Previous slide');
                break;
            default:
                iconType = '';
                break;
        }

        const svgHref = svgPath();
        button.innerHTML = `
        <svg
            aria-hidden="true"
            focusable="false"
            class="ui-icon"
        >
            <title>${buttonLabel}</title>
            <use href="${svgHref}${iconType}" />
        </svg>
        <span class="sr-only">${buttonLabel}</span>`;

        return button;
    }

    private setVisibility(pixels: number, dimensions: SliderDimension): void {
        for (let i = 0; i < this.slides.length; i += 1) {
            const slide = this.slides[i];

            // Slider visible area
            const visibleStart = pixels;
            const visibleEnd = pixels + dimensions.slider;

            // Slide area
            const slideStart = i * dimensions.slide;
            const slideEnd = slideStart + dimensions.slide;

            // isVisible = the whole slide is visible
            const isVisible =
                slideStart >= visibleStart && slideEnd <= visibleEnd;

            // Mark slide as visible (includes partially visible)
            if (isVisible) {
                slide.classList.add('is-visible');
                slide.setAttribute('tabindex', '0');
            } else {
                slide.classList.remove('is-visible');
                slide.setAttribute('tabindex', '-1');
            }

            const focussable = slide.querySelectorAll(
                'a, area, button, iframe, object, embed'
            );

            // Handle keyboard focus for non-visible elements.
            for (let j = 0; j < focussable.length; j += 1) {
                const elem = focussable[j] as HTMLElement;

                if (isVisible) {
                    elem.setAttribute('tabindex', '0');
                } else {
                    elem.setAttribute('tabindex', '-1');
                }
            }
        }
    }

    private getBoolAttribute(name: string): boolean {
        return this.slider.getAttribute(name) === 'true';
    }

    private getStringAttribute(name: string): string {
        const value = this.slider.getAttribute(name);

        return value && typeof value !== 'undefined' && value !== 'undefined'
            ? value
            : '';
    }

    private getVisibleSlides(): HTMLElement[] {
        return this.slides.filter((slide) =>
            slide.classList.contains('is-visible')
        );
    }
}
