/* eslint-disable no-console */
// @ts-nocheck so we don't get errors for ts(2367).

// Dynamically import & instantiate components based on current theme.
import { currentUITheme } from './ui-current-theme';

export const gwUIinitTheme = (): void => {
    if (currentUITheme === 'whitelabel') {
        // No dynamic imports for whitelabel.
    }

    if (currentUITheme === 'theme1') {
        import('./components/quick-view')
            .then((module) => module.QuickView.start())
            .catch((e) => console.error(e));
    }

    if (currentUITheme === 'theme2') {
        // No dynamic imports for theme2.
    }
};
