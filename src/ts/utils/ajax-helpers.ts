/* eslint-disable import/no-unresolved */
import { translate } from './translation';

/**
 * @const {HTMLDivElement} - we must programatically build Ajax loader icon in full here, as we cannot reference it from the SVG sprite because the <circle> element would be in the shadow DOM, and therefore impossible to style.
 */
const ajaxLoader: HTMLDivElement = document.createElement('div');
const ajaxLoaderContent = `
    <svg
        role="img"
        focusable="false"
        class="kb-icon kb-ajax__icon"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 100 100"
    >
        <title>loading...</title>
        <circle cx="50" cy="50" r="47"/>
    </svg>
`;
ajaxLoader.classList.add('kb-ajax__loader');
ajaxLoader.innerHTML = ajaxLoaderContent;

/**
 * Function - handle Fetch aborts/timeouts, using AbortController with a timeout - see https://developer.mozilla.org/en-US/docs/Web/API/AbortController.
 *
 * @param {HTMLElement} [ajaxLoaderContainer] - DOM node into which Ajax loader is injected.
 * @param {boolean} [showAjaxLoader] - show loading spinner.
 * @param {number} [ajaxTimeout] - timeout for Fetch before aborting request (default = 5000).
 *
 * @return {AbortSignal}
 *
 * @example
 *
 *      ajaxAbortHandler({ ajaxContainer, showAjaxLoader });
 */
interface AjaxAbort {
    ajaxLoaderContainer?: HTMLElement;
    showAjaxLoader?: boolean;
    ajaxTimeout?: number | undefined;
}
export const ajaxAbortHandler = (arg: AjaxAbort): AbortSignal => {
    const { ajaxLoaderContainer, showAjaxLoader, ajaxTimeout } = arg;

    // Add ajaxLoader to ajaxContainer.
    if (showAjaxLoader && ajaxLoaderContainer) {
        ajaxLoaderContainer.appendChild(ajaxLoader);
    }

    // Add Fetch AbortController.
    const timeout = ajaxTimeout === undefined ? 5000 : ajaxTimeout;
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);

    return controller.signal;
};

/**
 * Function - handle Ajax errors.
 *
 * TODO:
 * 1. Log errors, as per DW '$.GWUtils.logError(errorData)'?
 * 2. We currently insert error text into DOM? Should we?
 *
 * @param {HTMLElement} ajaxContainer - DOM node into which Ajax error text is injected.
 * @param {string} error - Ajax error text.
 *
 * @return {void}
 *
 * @example
 *
 *      ajaxError({ error,  ajaxContainer });
 */
interface AjaxError {
    error: string;
    ajaxContainer?: HTMLElement;
}
export const ajaxErrorHandler = (arg: AjaxError): void => {
    const { ajaxContainer, error } = arg;
    const errorHtmlText = translate(
        'AjaxError',
        'Sorry, something went wrong... please try again or contact us'
    );

    console.warn(error);

    if (ajaxContainer) {
        ajaxContainer.innerHTML = `<p>${errorHtmlText}</p>`;
    }
};
