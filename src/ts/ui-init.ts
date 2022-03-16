// Import core/platform UI components.
import { Accordion } from './components/accordion';
import { CustomCheckbox } from './components/custom-checkbox';
import { FormAjaxSubmit } from './components/form-ajax-submit';
import { FormValidate } from './components/form-validate';
import { Modal } from './components/modal';
import { Navigation } from './components/navigation';
import { ProductCard } from './components/product-card';
import { RangeInput } from './components/range-input';
import { SearchFilters } from './components/search-filters';
import { Share } from './components/share';
import { ShowHide } from './components/show-hide';
import { Slider } from './components/slider';
import { StickyPosition } from './components/sticky-position';
import { Tabs } from './components/tabs';
import { VideoPlayer } from './components/video-player';

// Import theme-specific components.
import { gwUIinitTheme } from './ui-init-theme';

// Instantiate all UI component modules, and do other DOM manipulation.
export const gwUIinit = (): void => {
    // TODO: consider removing post-css logical if browser usage stats show that most users are using a modern browser
    // 'postcss-logical' in conjunction with 'postcss-dir-pseudo-class' auto-generates [dir="ltr"] and [dir="rtl"] selectors in the compiled CSS. These act as fallbacks for older browsers that don't understand CSS logical properties. If <html dir="rtl"> has not been explicitly set, ensure that we programatically set default direction 'ltr' so that [dir="ltr"] CSS selector fires for older browsers:
    document.documentElement.dir = document.documentElement.dir || 'ltr';

    // Disclosure components (show|hide, accordions, tabs).
    ShowHide.start();
    Accordion.start();
    Tabs.start();

    // Forms.
    CustomCheckbox.start();
    FormAjaxSubmit.start();
    FormValidate.start();
    RangeInput.start();

    // Modal.
    Modal.start();

    // Navigation.
    Navigation.start();

    // Product cards.
    ProductCard.start();

    // Search results filters.
    SearchFilters.start();

    // Share API.
    Share.start();

    // Slider.
    Slider.start();

    // Sticky (header|footer) positioning.
    StickyPosition.start();

    // Video player.
    VideoPlayer.start();

    // Dynamically import & instantiate theme-specific components.
    gwUIinitTheme();
};
