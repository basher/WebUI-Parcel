import { addJSClass } from '../utils/progressive-enhancement';
import { disclosure } from '../utils/disclosure';

export class Share {
    private shareContainer: HTMLElement;

    constructor(shareContainer: HTMLElement) {
        this.shareContainer = shareContainer;

        this.init();
    }

    public static start(): void {
        const shareContainers = document.querySelectorAll('.kb-share');

        if (shareContainers) {
            [...(shareContainers as any)].map((shareContainer) => {
                addJSClass(shareContainer);

                const instance = new Share(shareContainer);

                return instance;
            });
        }
    }

    private init(): void {
        this.initShare();
    }

    private initShare(): void {
        const shareButton = this.shareContainer.querySelector(
            '.kb-share__button'
        ) as HTMLElement;

        let shareTitle = '';
        let shareUrl = '';
        const canonical = document.querySelector(
            'link[rel=canonical]'
        ) as HTMLLinkElement;

        // Does share button have 'data-' attributes to identify the URL to be shared?
        if (shareButton.dataset.shareTitle && shareButton.dataset.shareUrl) {
            shareTitle = shareButton.dataset.shareTitle;
            shareUrl = shareButton.dataset.shareUrl;
        } else {
            shareTitle = document.title;
            shareUrl = canonical ? canonical.href : document.location.href;
        }

        const content = shareButton.nextElementSibling as HTMLElement;
        const fallbackButton = content.querySelector(
            'button'
        ) as HTMLButtonElement;
        const fallbackInput = content.querySelector(
            'input'
        ) as HTMLInputElement;

        if (navigator.share) {
            content.classList.add('is-hidden');

            shareButton.addEventListener('click', () => {
                navigator.share({
                    title: shareTitle,
                    url: shareUrl,
                });
            });
        } else {
            // Show/hide fallback input & button.
            const button = shareButton;
            disclosure({
                button,
                content,
            });

            fallbackInput.value = shareUrl;

            fallbackButton.addEventListener('click', () => {
                this.handleCopyUrl(fallbackInput);
            });
        }
    }

    private handleCopyUrl(fallbackInput: HTMLInputElement): void {
        fallbackInput.select();
        document.execCommand('copy');
    }
}
