import { getEventElement } from '../utils/event-handlers';

export class Modal {
    private body: HTMLElement;
    private pageContent: NodeListOf<HTMLElement>;
    private modalOverlays: NodeListOf<HTMLElement>;
    private modalAutoOpen: HTMLElement | null;
    private modalOpenButtons: NodeListOf<HTMLElement>;
    private modalCloseButtons: NodeListOf<HTMLElement>;

    constructor() {
        this.body = document.body;
        this.pageContent = document.querySelectorAll('.ui-layout');
        this.modalOverlays = document.querySelectorAll('.ui-modal__overlay');
        this.modalAutoOpen = document.querySelector('[data-auto-open-modal]');
        this.modalOpenButtons = document.querySelectorAll('[data-modal-open]');
        this.modalCloseButtons =
            document.querySelectorAll('[data-modal-close]');

        this.init();
    }

    public static start(): any {
        const instance = new Modal();

        return instance;
    }

    private init(): void {
        this.initModal();
    }

    private initModal(): void {
        // Modal opens on page load.
        if (this.modalAutoOpen) {
            const targetModal = this.modalAutoOpen.id;
            this.openModal(null, targetModal, false, null);
        }

        // Modal opens via button/link on the page.
        if (this.modalOpenButtons) {
            [...(this.modalOpenButtons as any)].map((modalOpenButton) => {
                modalOpenButton.addEventListener('click', (e: MouseEvent) => {
                    const target = getEventElement(e.currentTarget);
                    const targetModal = target?.dataset.modalOpen;

                    // Are we Ajax-fetching modal content?
                    const isAjaxFetch =
                        target?.getAttribute('data-modal-fetch-content') ===
                        'true';
                    let ajaxModalContent: HTMLElement | null = null;

                    if (isAjaxFetch) {
                        // Is Ajax content an image gallery slider? There may be >1 slider on page, so identify correct one to inject into modal.
                        if (target?.dataset.slider) {
                            const targetSlider = target?.dataset.slider;
                            ajaxModalContent = document.querySelector(
                                `[data-modal-ajax-content=${targetModal}][data-id=${targetSlider}]`
                            );
                        } else {
                            ajaxModalContent = document.querySelector(
                                `[data-modal-ajax-content=${targetModal}]`
                            );
                        }
                    }

                    // Prevent default link behaviour.
                    e.preventDefault();

                    if (targetModal) {
                        this.openModal(
                            target,
                            targetModal,
                            isAjaxFetch,
                            ajaxModalContent
                        );
                    }
                });

                return true;
            });
        }
    }

    private openModal(
        target: HTMLElement | null,
        targetModal: string,
        isAjaxFetch: boolean,
        ajaxModalContent: HTMLElement | null
    ): void {
        this.body.classList.add('has-open-modal');
        this.pageContent[0].setAttribute('aria-hidden', 'true');

        document.body.dispatchEvent(
            new CustomEvent('ModalOpening', { detail: { id: targetModal } })
        );

        [...(this.modalOverlays as any)].map((modalOverlay) => {
            // Open modal if ID matches 'data-modal-open' attribute on target.
            if (targetModal === modalOverlay.id) {
                modalOverlay.classList.remove('is-hidden');

                // Add custom CSS class to modal overlay for additional styling.
                if (target?.dataset.modalCssClass) {
                    modalOverlay.classList.add(target?.dataset.modalCssClass);
                }

                // Fetch Ajax content if required.
                let ajaxContent: HTMLElement | null;
                let ajaxContentParent: HTMLElement | null;
                if (isAjaxFetch && ajaxModalContent) {
                    ajaxContent = ajaxModalContent;
                    ajaxContentParent =
                        ajaxModalContent.parentNode as HTMLElement;
                    const ajaxContainer =
                        modalOverlay.querySelector('.ui-modal__ajax');
                    const ajaxContentTitle =
                        ajaxContent.querySelector('[data-modal-title]');
                    const ariaModal = modalOverlay.querySelector(
                        '.ui-modal__inner'
                    ) as HTMLDivElement;

                    // Assign 'aria-labelledby' to modal based on ID of main heading in Ajax-fetched modal content.
                    if (ajaxContentTitle && ajaxContentTitle.id !== '') {
                        ariaModal.setAttribute(
                            'aria-labelledby',
                            ajaxContentTitle.id
                        );
                    }

                    // Empty ajaxContainer in case it already holds content from a previous fetch.
                    if (ajaxContainer.children[0]) {
                        ajaxContainer.removeChild(ajaxContainer.children[0]);
                    }

                    ajaxContainer.appendChild(ajaxContent);
                }

                // Set modal title from 'data-' attribute on modal open button, and set focus on title.
                this.setModalFocus(modalOverlay, target);

                // Trap focus inside modal.
                modalOverlay.addEventListener('keydown', (e: KeyboardEvent) =>
                    this.trapModalFocus(e, modalOverlay)
                );

                // When closing modal, pass the button (target) that triggered 'openModal' so we set focus on it.
                [...(this.modalCloseButtons as any)].map((closeButton) => {
                    closeButton.addEventListener('click', () => {
                        this.closeModal(target, targetModal);

                        if (isAjaxFetch) {
                            this.tidyAjaxDOM(ajaxContent, ajaxContentParent);
                        }
                    });

                    return true;
                });

                // Bind ESC key to close button.
                document.addEventListener('keyup', (e: KeyboardEvent) => {
                    if (e.code === 'Escape') {
                        this.closeModal(target, targetModal);

                        if (isAjaxFetch) {
                            this.tidyAjaxDOM(ajaxContent, ajaxContentParent);
                        }
                    }
                });
            }

            return true;
        });
    }

    private closeModal(target: HTMLElement | null, targetModal: string): void {
        this.body?.classList.remove('has-open-modal');
        this.pageContent[0].removeAttribute('aria-hidden');

        document.body.dispatchEvent(
            new CustomEvent('ModalClosing', { detail: { id: targetModal } })
        );

        [...(this.modalOverlays as any)].map((modalOverlay) => {
            // Close modal if ID matches 'data-modal-open' attribute on target.
            if (targetModal === modalOverlay.id) {
                modalOverlay.classList.add('is-hidden');

                // After closing, set focus back on button/link that triggered 'openModal', to top of BODY if modal automatically opened on page load.
                if (target) {
                    target?.focus();
                } else {
                    this.body?.setAttribute('tabIndex', '-1');
                    this.body?.focus();
                }
            }

            return true;
        });
    }

    private setModalFocus(
        modal: HTMLElement | null,
        target: HTMLElement | null
    ): void {
        const modalOnOpenFocus: HTMLElement | null | undefined =
            modal?.querySelector('[data-modal-title]') ||
            modal?.querySelector('.ui-modal__inner');

        if (modalOnOpenFocus) {
            modalOnOpenFocus.setAttribute('tabIndex', '-1');
            modalOnOpenFocus.focus();

            // Set modal title text to be the value of trigger button's 'data-modal-title' attribute, or else the original modal title text content.
            if (target && modalOnOpenFocus.nodeName !== 'DIV') {
                modalOnOpenFocus.textContent =
                    target.dataset.modalTitle || modalOnOpenFocus.textContent;
            }
        }
    }

    private trapModalFocus(e: KeyboardEvent, modal: HTMLElement | null): void {
        // List of elements that we want to cycle around inside modal.
        const focusable = modal?.querySelectorAll(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusable) {
            const firstFocusable: any = focusable[0];
            const lastFocusable: any = focusable[focusable.length - 1];

            // If on the last focusable element, set focus on first element with TAB.
            if (!e.shiftKey && e.code === 'Tab' && e.target === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
            // If on the first focusable element, set focus on last element with SHIFT+TAB.
            if (e.shiftKey && e.code === 'Tab' && e.target === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        }
    }

    private tidyAjaxDOM(
        ajaxContent: HTMLElement | null,
        ajaxContentParent: HTMLElement | null
    ): void {
        // If modal content has been Ajax fetched, move content back to its original parent in the DOM.
        if (ajaxContent && ajaxContentParent) {
            ajaxContentParent.appendChild(ajaxContent);
        }
    }
}
