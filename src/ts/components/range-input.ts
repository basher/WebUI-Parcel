import { getEventElement } from '../utils/event-handlers';

export class RangeInput {
    private rangeInput: HTMLElement;

    constructor(rangeInput: HTMLElement) {
        this.rangeInput = rangeInput;

        this.init();
    }

    public static start(): void {
        const rangeInputContainers =
            document.querySelectorAll('.ui-form__range');

        if (rangeInputContainers) {
            [...(rangeInputContainers as any)].map((rangeInput) => {
                const instance = new RangeInput(rangeInput);

                return instance;
            });
        }
    }

    private init(): void {
        this.initRangeInput();
    }

    private initRangeInput(): void {
        if (this.rangeInput.classList.contains('ui-form__range--multiple')) {
            this.handleRangeInputMultiple();
        } else {
            this.handleRangeInputSingle();
        }
    }

    private handleRangeInputSingle(): void {
        const range = this.rangeInput.querySelector(
            '[type=range]'
        ) as HTMLInputElement;
        const bubble = this.rangeInput.querySelector(
            '.ui-form__range__bubble'
        ) as HTMLOutputElement;

        bubble.innerHTML = range.value;
        range.addEventListener('input', () => {
            this.handleValidRanges(range, bubble);
        });
    }

    private handleRangeInputMultiple(): void {
        const range1 = this.rangeInput.querySelectorAll(
            '[type=range]'
        )[0] as HTMLInputElement;
        const range2 = this.rangeInput.querySelectorAll(
            '[type=range]'
        )[1] as HTMLInputElement;
        const bubble1 = range1?.nextElementSibling as HTMLOutputElement;
        const bubble2 = range2?.nextElementSibling as HTMLOutputElement;

        if (
            this.rangeInput.classList.contains(
                'ui-form__range--unit-conversions'
            )
        ) {
            // Show radio buttons.
            const radios = this.rangeInput.querySelector(
                '.ui-form__fieldset'
            ) as HTMLElement;
            radios.style.display = 'block';

            this.handleRangeInputUnitConversion(
                this.rangeInput,
                range1,
                range2,
                bubble1,
                bubble2
            );
        }

        bubble1.innerHTML = range1.value;
        bubble2.innerHTML = range2.value;

        range1.addEventListener('input', (e) => {
            const target = getEventElement(e.currentTarget) as HTMLInputElement;
            this.validateRangeInputMultiple(
                target,
                range1,
                range2,
                bubble1,
                bubble2
            );
        });

        bubble2.innerHTML = range2.value;
        bubble1.innerHTML = range1.value;
        range2.addEventListener('input', (e) => {
            const target = getEventElement(e.currentTarget) as HTMLInputElement;
            this.validateRangeInputMultiple(
                target,
                range1,
                range2,
                bubble1,
                bubble2
            );
        });
    }

    private handleRangeInputUnitConversion(
        rangeInput: any,
        range1: HTMLInputElement,
        range2: HTMLInputElement,
        bubble1: HTMLOutputElement,
        bubble2: HTMLOutputElement
    ): void {
        const radioButtons = rangeInput.querySelectorAll('input[type=radio');

        [...(radioButtons as any)].map((radioButton) => {
            // When radio button is clicked, assign range slider (MIN, MAX, STEP, VALUE) attributes based on hidden input field value.
            radioButton.addEventListener(
                'click',
                (e: { currentTarget: EventTarget | null }) => {
                    const target = getEventElement(
                        e.currentTarget
                    ) as HTMLInputElement;

                    if (target) {
                        const hiddenFields = target
                            .closest('.ui-form__field')
                            ?.querySelectorAll('input[type=hidden');

                        [...(hiddenFields as any)].map((hiddenField) => {
                            // Hidden inputs have a single value with the format 'min-NNN,max-NNN,step-NNN,value-NNN'.
                            const hiddenValue = hiddenField.value.split(',');

                            // Re-assign correct attributes to MIN and MAX range sliders.
                            if (hiddenField.dataset.id === 'min') {
                                this.convertRangeInputAttributes(
                                    hiddenValue,
                                    range1,
                                    bubble1
                                );
                            }

                            if (hiddenField.dataset.id === 'max') {
                                this.convertRangeInputAttributes(
                                    hiddenValue,
                                    range2,
                                    bubble2
                                );
                            }

                            return true;
                        });
                    }
                }
            );

            return true;
        });
    }

    private convertRangeInputAttributes(
        hiddenValue: string[],
        range: HTMLInputElement,
        bubble: HTMLOutputElement
    ): void {
        let [newMin, newMax, newStep, newValue] = hiddenValue;

        newMin = newMin.split('-')[1];
        newMax = newMax.split('-')[1];
        newStep = newStep.split('-')[1];
        newValue = newValue.split('-')[1];

        range.setAttribute('value', newValue);
        range.setAttribute('aria-valuenow', newValue);
        range.setAttribute('min', newMin);
        range.setAttribute('aria-valuemin', newMin);
        range.setAttribute('max', newMax);
        range.setAttribute('aria-valuemax', newMax);
        range.setAttribute('step', newStep);
        range.value = newValue;
        bubble.innerHTML = newValue;
    }

    private validateRangeInputMultiple(
        target: HTMLInputElement | null,
        range1: HTMLInputElement,
        range2: HTMLInputElement,
        bubble1: HTMLSpanElement,
        bubble2: HTMLSpanElement
    ): void {
        // Prevent MIN range input having a value greater than MAX range input (and vice versa) by adjusting the alternate range input value accordingly. STEP attribute may be defined to 1 decimal place.

        // Check if we have any decimal values.
        let range1Value;
        let range2Value;
        if (range1.value.indexOf('.') > 0 || range2.value.indexOf('.') > 0) {
            range1Value = parseFloat(range1.value).toFixed(1);
            range2Value = parseFloat(range2.value).toFixed(1);
        } else {
            range1Value = parseInt(range1.value, 10);
            range2Value = parseInt(range2.value, 10);
        }

        if (range1Value >= range2Value) {
            if (target && target.dataset.range === 'min') {
                this.handleInvalidRanges(target, bubble1, range2, bubble2);
            }

            if (target && target.dataset.range === 'max') {
                this.handleInvalidRanges(target, bubble2, range1, bubble1);
            }
        } else {
            this.handleValidRanges(range1, bubble1);
            this.handleValidRanges(range2, bubble2);
        }
    }

    private handleValidRanges(
        range: HTMLInputElement,
        bubble: HTMLSpanElement
    ): void {
        range.setAttribute('value', range.value);
        range.setAttribute('aria-valuenow', range.value);
        bubble.innerHTML = range.value;
    }

    private handleInvalidRanges(
        targetRange: HTMLInputElement,
        targetBubble: HTMLSpanElement,
        range: HTMLInputElement,
        bubble: HTMLSpanElement
    ): void {
        let numNewValue = 0;
        let strNewValue = '';
        if (targetRange.dataset.range === 'min') {
            numNewValue =
                parseFloat(targetRange.value) + parseFloat(targetRange.step);
        } else {
            numNewValue =
                parseFloat(targetRange.value) - parseFloat(targetRange.step);
        }

        // Check if we have any decimal values.
        if (numNewValue.toString().indexOf('.') > 0) {
            strNewValue = numNewValue.toFixed(1);
        } else {
            strNewValue = numNewValue.toString();
        }

        // Set correct range values on target range slider.
        targetRange.setAttribute('value', targetRange.value);
        targetRange.setAttribute('aria-valuenow', targetRange.value);
        targetBubble.innerHTML = targetRange.value;

        // Set correct range values on other range slider.
        range.value = strNewValue;
        range.setAttribute('value', strNewValue);
        range.setAttribute('aria-valuenow', strNewValue);
        bubble.innerHTML = strNewValue;
    }
}
