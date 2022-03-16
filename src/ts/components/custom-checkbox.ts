export class CustomCheckbox {
    private customCheckbox: HTMLElement;

    constructor(customCheckbox: HTMLElement) {
        this.customCheckbox = customCheckbox;

        this.init();
    }

    public static start(): any {
        const customCheckboxes = document.querySelectorAll(
            '[class*=checkbox-custom]'
        );

        if (customCheckboxes) {
            [...(customCheckboxes as any)].map((customCheckbox) => {
                const instance = new CustomCheckbox(customCheckbox);

                return instance;
            });
        }
    }

    private init(): void {
        this.initCustomCheckboxes();
    }

    private initCustomCheckboxes(): void {
        if (this.customCheckbox) {
            const checkboxes =
                this.customCheckbox.querySelectorAll('[type=checkbox]');
            [...(checkboxes as any)].map((checkbox) => {
                checkbox.addEventListener('click', () => {
                    checkbox
                        .closest('.kb-form__field')
                        .classList.toggle('is-checked');
                });
                return true;
            });
        }
    }
}
