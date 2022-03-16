import { disclosure } from '../utils/disclosure';
import { addJSClass } from '../utils/progressive-enhancement';
import { translate } from '../utils/translation';

export class ShowHide {
    private showHide: HTMLElement;

    constructor(showHide: HTMLElement) {
        this.showHide = showHide;

        this.init();
    }

    public static start(): void {
        const showHideContainers = document.querySelectorAll('.kb-show-hide');

        if (showHideContainers) {
            [...(showHideContainers as any)].map((showHide) => {
                addJSClass(showHide);

                const instance = new ShowHide(showHide);

                return instance;
            });
        }
    }

    private init(): void {
        this.initShowHide();
    }

    private initShowHide(): void {
        const button: HTMLButtonElement = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('aria-expanded', 'false');
        button.classList.add('kb-button');
        button.classList.add('kb-button--text');
        button.classList.add('kb-show-hide__button');

        const content = this.showHide.querySelectorAll(
            '.kb-show-hide__content'
        )[0] as HTMLElement;

        // Apply translations.
        const buttonLabel = translate('ShowMore', 'Show more');
        const buttonLabelExpanded = translate('ShowLess', 'Show less');

        button.innerHTML = buttonLabel;
        this.showHide.insertBefore(button, content);

        disclosure({
            button,
            content,
            buttonLabel,
            buttonLabelExpanded,
        });

        // Make shown content keyboard focusable.
        content.setAttribute('tabIndex', '0');
    }
}
