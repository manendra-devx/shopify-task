/**
 * Cart Drawer Functionality
 * Handles AJAX cart operations and UI updates
 */

class CartDrawer {
    constructor() {
        this.selectors = {
            drawer: '[data-cart-drawer]',
            overlay: '[data-cart-overlay]',
            closeBtn: '[data-cart-drawer-close]',
            openTrigger: '[data-cart-open-trigger]',
            cartItems: '[data-cart-items]',
            cartCount: '.cart-item-count',
            productForm: 'form[action*="/cart/add"]',
            qtyInput: 'input[name="quantity"]'
        };

        this.drawer = document.querySelector(this.selectors.drawer);
        this.overlay = document.querySelector(this.selectors.overlay);
        this.routes = window.Shopify && window.Shopify.routes ? window.Shopify.routes : { root: '/' };

        this.init();
    }

    init() {
        this.bindEvents();
        this.bindCartEvents(); // Bind events inside the drawer (delegation)
        this.bindCheckoutEvents();
    }

    bindCheckoutEvents() {
        // Since checkout button might be re-rendered, we should delegate or re-bind
        // But for forms in snippets, delegation is safer if drawer content refreshes
        // Hmmm the drawer innerHTML is replaced in refreshCart. 
        // So we should bind in init (delegation) OR call this in refreshCart.
        // Let's use delegation on the drawer container.

        if (this.drawer) {
            this.drawer.addEventListener('click', (e) => {
                const checkoutBtn = e.target.closest('[name="checkout"]');
                if (checkoutBtn) {
                    // Loading state
                    checkoutBtn.innerHTML = 'Processing<span class="loading-dots"></span>';
                    checkoutBtn.classList.add('btn-loading');
                    // Form submits naturally
                }
            });
        }
    }

    bindEvents() {
        // Open Drawer Triggers
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest(this.selectors.openTrigger);
            if (trigger) {
                e.preventDefault();
                this.open();
            }
        });

        // Close Drawer Triggers
        if (this.drawer) {
            this.drawer.addEventListener('click', (e) => {
                if (e.target.closest(this.selectors.closeBtn)) {
                    this.close();
                }
            });
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }

        // Add to Cart Form Interception
        document.addEventListener('submit', (e) => {
            const form = e.target.closest(this.selectors.productForm);
            if (form) {
                e.preventDefault();
                const submitBtn = form.querySelector('[type="submit"]');
                // ... (loader logic handled in addToCart)

                const formData = new FormData(form);
                this.addToCart(formData, submitBtn);
            }
        });
    }

    bindCartEvents() {
        if (!this.drawer) return;

        // Delegate quantity changes and remove clicks
        this.drawer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            // Handle Plus/Minus/Remove
            if (btn.hasAttribute('data-minus') || btn.hasAttribute('data-plus') || btn.hasAttribute('data-remove')) {
                e.preventDefault();
                const line = btn.closest('[data-line]').dataset.line;
                const quantity = btn.dataset.quantity;
                this.updateQuantity(line, quantity, btn);
            }
        });
    }



    open() {
        if (this.drawer && this.overlay) {
            this.drawer.classList.remove('translate-x-full');
            this.overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            // Ensure checkout button is reset when drawer opens
            this.resetCheckoutButton();
        }
    }

    // Reset checkout button to default state
    resetCheckoutButton() {
        const drawer = this.drawer;
        if (!drawer) return;
        const checkoutBtn = drawer.querySelector('button[name="checkout"]');
        if (checkoutBtn) {
            checkoutBtn.innerHTML = 'Checkout';
            checkoutBtn.classList.remove('btn-loading');
            checkoutBtn.disabled = false;
            delete checkoutBtn.dataset.original;
        }
    }

    close() {
        if (this.drawer && this.overlay) {
            // Reset checkout button state before closing
            this.resetCheckoutButton();
            this.drawer.classList.add('translate-x-full');
            this.overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    async addToCart(formData, submitBtn) {
        let originalContent = '';
        if (submitBtn) {
            originalContent = submitBtn.innerHTML;
            // Set Loading State: Adding... + Spinner
            submitBtn.innerHTML = `
                <span class="loader w-4 h-4 mr-2"></span>
                <span class="font-['Cabin'] font-medium text-[16px] text-[#F9F3F1] uppercase leading-none mt-[2px]">Adding...</span>
            `;
            submitBtn.classList.add('btn-loading');
        }

        try {
            const response = await fetch(this.routes.root + 'cart/add.js', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                await this.refreshCart();
                this.open();
            } else {
                console.error('Error adding to cart:', data);
                alert(data.description || 'Error adding to cart');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            if (submitBtn) {
                // Restore original state logic handled here or keep "Added" state briefly?
                // For now, restoring immediately after action completes allows subsequent adds.
                submitBtn.innerHTML = originalContent;
                submitBtn.classList.remove('btn-loading');
                submitBtn.disabled = false; // logic handled in bindEvents originally, ensuring re-enable here too
            }
        }
    }

    async updateQuantity(line, quantity, triggerBtn) {
        // Find the specific item container to show loader
        let lineItemContainer;
        let loader;

        if (triggerBtn) {
            lineItemContainer = triggerBtn.closest('.cart-item') || triggerBtn.closest('[data-line-item]');
            if (lineItemContainer) {
                loader = lineItemContainer.querySelector('.cart-item-loader');
            }
        }

        if (lineItemContainer) {
            lineItemContainer.style.pointerEvents = 'none';
            if (loader) {
                loader.classList.remove('hidden');
                loader.classList.add('flex');
            } else {
                // Fallback if loader not found
                lineItemContainer.classList.add('animate-pulse');
            }
        }

        try {
            const response = await fetch(this.routes.root + 'cart/change.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    line: line,
                    quantity: quantity
                })
            });

            const data = await response.json();
            if (response.ok) {
                await this.refreshCart();
            } else {
                console.error('Error updating cart:', data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            // If the element still exists (no refresh occurred or partial update), reset state
            if (lineItemContainer && document.body.contains(lineItemContainer)) {
                lineItemContainer.style.pointerEvents = 'auto';
                if (loader) {
                    loader.classList.add('hidden');
                    loader.classList.remove('flex');
                } else {
                    lineItemContainer.classList.remove('animate-pulse');
                    lineItemContainer.style.opacity = '1';
                }
            }
        }
    }

    async refreshCart() {
        try {
            const response = await fetch(this.routes.root + '?section_id=cart-drawer');
            const text = await response.text();

            // Parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            // Update Drawer Content
            const newDrawerContent = doc.querySelector(this.selectors.drawer).innerHTML;
            if (this.drawer) {
                this.drawer.innerHTML = newDrawerContent;
            }

            // Update Cart Count in Header
            // We need to fetch the cart count separately or extract it if it's in the drawer markup
            // Usually it's better to fetch cart.js or put the count in the drawer response and extract it
            // For now, let's fetch cart.js to be safe and update all badges
            this.updateCartCount();

        } catch (error) {
            console.error('Error refreshing cart:', error);
        }
    }

    async updateCartCount() {
        try {
            const res = await fetch(this.routes.root + 'cart.js');
            const cart = await res.json();

            document.querySelectorAll(this.selectors.cartCount).forEach(el => {
                el.textContent = cart.item_count;
                if (cart.item_count === 0) {
                    el.classList.add('hidden');
                } else {
                    el.classList.remove('hidden');
                }
            });
        } catch (err) {
            console.error(err);
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.cartDrawer = new CartDrawer();
});

// Reset checkout button state on page show (e.g., when navigating back)
window.addEventListener('pageshow', (event) => {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    const checkoutBtn = drawer.querySelector('button[name="checkout"]');
    if (checkoutBtn) {
        // Reset to default markup
        checkoutBtn.innerHTML = 'Checkout';
        checkoutBtn.classList.remove('btn-loading');
        delete checkoutBtn.dataset.original;
    }
});
