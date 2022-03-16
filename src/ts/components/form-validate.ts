import { getEventElement } from '../utils/event-handlers';

export class FormValidate {
    private form: HTMLFormElement;

    constructor(form: HTMLFormElement) {
        this.form = form;

        this.init();
    }

    public static start(): void {
        const forms = document.querySelectorAll('form');

        if (forms) {
            [...(forms as any)].map((form) => {
                const instance = new FormValidate(form);

                return instance;
            });
        }
    }

    private init(): void {
        this.initFormValidate();
    }

    private initFormValidate(): void {
        // Required form fields that are grouped together.
        const grouped = this.form.querySelectorAll('[data-validate-group]');
        this.handleGroupedFields(grouped);

        // Listen for DOM changes with MutationObserver API, so we can handle subsequent interactions on Ajax-fetched form.
        const domNode = this.form.closest('[role=region]') as HTMLElement;
        this.handleDOMChanges(domNode);
    }

    private handleGroupedFields(grouped: any): void {
        [...(grouped as any)].map((group) => {
            // Validate grouped fields by checking if any of them are already 'VALID' in DOM (e.g. after an Ajax reload of the form).
            let groupId = group.getAttribute('data-validate-group');

            // If the group field is valid, remove 'required' attribute from any other grouped fields.
            if (groupId && group.validity.valid) {
                this.updateGroupedFields(group, groupId, grouped);
            }

            // Validate grouped fields via 'CHANGE' event.
            group.addEventListener('change', (e: MouseEvent) => {
                const target = getEventElement(
                    e.currentTarget
                ) as HTMLFormElement;
                groupId = target.getAttribute('data-validate-group');

                // If the event target field is valid, remove 'required' attribute from any other grouped fields.
                if (groupId && target.validity.valid) {
                    this.updateGroupedFields(target, groupId, grouped);
                }
            });

            return true;
        });
    }

    private updateGroupedFields(
        target: HTMLFormElement,
        groupId: string,
        grouped: any
    ): void {
        [...(grouped as any)].map((group) => {
            if (
                group !== target &&
                group.getAttribute('data-validate-group') === groupId &&
                group.hasAttribute('required')
            ) {
                const field = group.closest('.ui-form__field') as HTMLElement;
                const fieldError = field.querySelector(
                    '.ui-form__error'
                ) as HTMLElement;

                group.removeAttribute('required');
                group.removeAttribute('aria-invalid');
                group.removeAttribute('aria-describedby');
                field.classList.remove('ui-form__field--has-error');
                if (fieldError) {
                    fieldError.style.display = 'none';
                }
            }

            return true;
        });
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
                        if (node && node.querySelectorAll) {
                            const grouped = node.querySelectorAll(
                                '[data-validate-group]'
                            );
                            this.handleGroupedFields(grouped);
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
