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
                if (submitBtn) {
                    submitBtn.classList.add('loading');
                    submitBtn.disabled = true;
                }

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
                this.updateQuantity(line, quantity);
            }
        });
    }

    open() {
        if (this.drawer && this.overlay) {
            this.drawer.classList.remove('translate-x-full');
            this.overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    close() {
        if (this.drawer && this.overlay) {
            this.drawer.classList.add('translate-x-full');
            this.overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    async addToCart(formData, submitBtn) {
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
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    async updateQuantity(line, quantity) {
        try {
            // Show loading state if needed
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
