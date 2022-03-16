// Import Sass entry file.
import '../scss/index.scss';

// Import external libs.
import domready from 'domready';
import whatInput from 'what-input';

// Import UI initialisation.
import { gwUIinit } from './ui-init';

// Import polyfills/ponyfills (for legacy browsers). Please refer to these articles for explanation:
// https://philipwalton.com/articles/loading-polyfills-only-when-needed/.
// https://golb.hplar.ch/2018/02/Conditionally-load-polyfills.html.
const browserSupportsAllFeatures = (): boolean => {
    const isIntersectionObserver = 'IntersectionObserver' in window;
    const isFetch = 'fetch' in window;
    return isIntersectionObserver && isFetch;
};

// Determines what type of user interaction has occured (mouse/keyboard/touch).
whatInput.ask();

// Run UI module instantiation when DOM is ready.
domready(function () {
    if (browserSupportsAllFeatures()) {
        gwUIinit();
    } else {
        // Require 'promise' for Parcel, then dynamic import polyfills, then instantiate UI modules.
        require('core-js/es/promise');
        import('./polyfills')
            .then(() => gwUIinit())
            // eslint-disable-next-line no-console
            .catch((e) => console.error(e));
    }
});

// Run UI module instantition ONCE when each Storybook story has loaded.
const storybookUIinit = (): void => {
    // eslint-disable-next-line no-console
    console.log('Storybook custom event fired...');
    gwUIinit();
};
// 'StorybookLoaded' is an event that is dispatched from Storybook.
window.addEventListener('StorybookLoaded', storybookUIinit, false);
