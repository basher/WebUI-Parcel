import { addJSClass } from '../utils/progressive-enhancement';
import { ajaxAbortHandler, ajaxErrorHandler } from '../utils/ajax-helpers';

export class FormAjaxSubmit {
    private ajaxForm: HTMLFormElement;

    constructor(ajaxForm: HTMLFormElement) {
        this.ajaxForm = ajaxForm;

        this.init();
    }

    public static start(): void {
        const ajaxForms = document.querySelectorAll('form[data-action]');

        if (ajaxForms) {
            [...(ajaxForms as any)].map((ajaxForm) => {
                addJSClass(ajaxForm);

                const instance = new FormAjaxSubmit(ajaxForm);

                return instance;
            });
        }
    }

    private init(): void {
        this.initFormAjax();
    }

    private initFormAjax(): void {
        const ajaxDropdowns = this.ajaxForm.querySelectorAll(
            '[data-ajax-submit]:not(:disabled)'
        );

        [...(ajaxDropdowns as any)].map((ajaxDropdown) => {
            // 'CHANGE' event on <select> triggers form submit via Ajax.
            ajaxDropdown.addEventListener('change', () => {
                this.handleAjaxDropdownEvents(this.ajaxForm, ajaxDropdown);
            });

            return true;
        });

        // Listen for DOM changes with MutationObserver API, so we can handle subsequent interactions on Ajax-fetched form.
        const domNode = this.ajaxForm.closest('[role=region]') as HTMLElement;

        this.handleDOMChanges(domNode);
    }

    private handleAjaxDropdownEvents(
        ajaxForm: any,
        ajaxDropdown: HTMLSelectElement
    ): void {
        const ajaxContainer = ajaxForm.parentElement;
        const showAjaxLoader = true;
        const ajaxLoaderContainer =
            ajaxDropdown.closest('.kb-form__field') || ajaxContainer;

        const ajaxDropdownId = ajaxDropdown.id;

        if (ajaxForm.dataset.action !== '') {
            fetch(ajaxForm.dataset.action, {
                method: ajaxForm.method,
                body: new FormData(ajaxForm) as any,
                signal: ajaxAbortHandler({
                    ajaxLoaderContainer,
                    showAjaxLoader,
                }),
            })
                .then((response) => response.text())
                .then((html) => {
                    ajaxContainer.innerHTML = html;

                    if (ajaxDropdownId && ajaxDropdownId !== '') {
                        const dropdownToFocus = ajaxContainer.querySelector(
                            `#${ajaxDropdownId}`
                        );
                        dropdownToFocus.focus();
                    }
                })
                .catch((error) => {
                    ajaxErrorHandler({ error, ajaxContainer });
                });
        }
    }

    private handleDOMChanges(domNode: HTMLElement): void {
        const config = { childList: true, subtree: true };

        // Callback function to execute when mutations are observed.
        const callback = (mutations: any): void => {
            for (let i = 0; i < mutations.length; i += 1) {
                if (
                    mutations[i].type === 'childList' ||
                    mutations[i].type === 'subtree'
                ) {
                    [...(mutations[i].addedNodes as any)].map((node) => {
                        if (
                            node &&
                            node.classList &&
                            node.classList.contains('kb-form')
                        ) {
                            addJSClass(node);

                            const replacedDropdowns = node.querySelectorAll(
                                '[data-ajax-submit]:not(:disabled)'
                            );

                            [...(replacedDropdowns as any)].map(
                                (replacedDropdown) => {
                                    replacedDropdown.addEventListener(
                                        'change',
                                        () => {
                                            this.handleAjaxDropdownEvents(
                                                node,
                                                replacedDropdown
                                            );
                                        }
                                    );

                                    return true;
                                }
                            );
                        }

                        return true;
                    });
                }
            }
        };

        const observer = new MutationObserver(callback);
        if (domNode) {
            observer.observe(domNode, config);
        }
    }
}
