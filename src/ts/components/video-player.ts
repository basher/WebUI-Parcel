import { addJSClass } from '../utils/progressive-enhancement';
import { svgPath } from '../utils/svg-path';
import { translate } from '../utils/translation';

export class VideoPlayer {
    private videoContainer: HTMLDivElement;
    private videoLink: HTMLAnchorElement;
    private image: HTMLImageElement;

    constructor(videoDiv: HTMLDivElement) {
        this.videoContainer = videoDiv;
        this.videoLink = videoDiv.querySelector('a') as HTMLAnchorElement;
        this.image = videoDiv.querySelector('img') as HTMLImageElement;
        this.init();
    }

    public static start(): void {
        const videoDivs = document.querySelectorAll('.kb-video-player');

        if (videoDivs) {
            [...(videoDivs as any)].map((videoDiv) => {
                addJSClass(videoDiv);

                const instance = new VideoPlayer(videoDiv);

                return instance;
            });
        }
    }

    private init(): void {
        this.createIcon();
        const videoIframe = this.createVideoIframe();
        this.addVideoIframe(videoIframe);
        this.modifyVideoModalLink(videoIframe);
    }

    private createIcon(): void {
        const icon = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg'
        );
        icon.classList.add('kb-icon');
        icon.classList.add('kb-video-player__icon');
        icon.textContent = translate('VideoPlayerButton', 'Play video');
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('focusable', 'false');

        const svgHref = svgPath();
        const iconContent = `
            <title>${icon.textContent}</title>
            <use href="${svgHref}#SVG028" />
        `;

        icon.innerHTML = iconContent;

        this.videoLink.appendChild(icon);
    }

    private createVideoIframe(): HTMLIFrameElement {
        const iframe: HTMLIFrameElement = document.createElement('iframe');
        iframe.setAttribute('title', this.image.alt);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute(
            'allow',
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        );
        // Ensure iframe is keyboard focusable.
        iframe.setAttribute('tabIndex', '0');

        return iframe;
    }

    private addVideoIframe(videoIframe: HTMLIFrameElement): void {
        const responsiveMediaContainer = this.videoContainer.querySelector(
            '.kb-responsive-media'
        ) as HTMLDivElement;

        const videoHeight = this.videoLink?.dataset.videoHeight;
        const videoWidth = this.videoLink?.dataset.videoWidth;

        if (
            videoHeight &&
            videoHeight !== '' &&
            videoWidth &&
            videoWidth !== ''
        ) {
            const height = parseInt(videoHeight, 10);
            const width = parseInt(videoWidth, 10);
            const paddingTop = 100 / (width / height);

            responsiveMediaContainer.setAttribute(
                'style',
                `--themeMediaAspectRatio: ${videoWidth}/${videoHeight}; padding-top: ${paddingTop}%`
            );
        }

        responsiveMediaContainer.appendChild(videoIframe);
    }

    private modifyVideoModalLink(videoIframe: HTMLIFrameElement): void {
        if (this.videoLink) {
            this.videoLink.setAttribute('data-modal-open', 'modal');
            this.videoLink.setAttribute('data-modal-fetch-content', 'true');
            this.videoLink.setAttribute(
                'data-modal-css-class',
                'kb-video-player__modal'
            );

            this.videoLink.addEventListener('click', (e: MouseEvent) => {
                e.preventDefault();
                videoIframe.setAttribute('src', this.videoLink.href);
            });
        }
    }
}
