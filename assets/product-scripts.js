/**
 * Updates the quantity input value.
 * @param {number} change - The amount to change the quantity by (e.g., 1 or -1).
 */
function updateQty(change) {
    const input = document.getElementById('Quantity');
    if (!input) return;
    let val = parseInt(input.value);
    if (isNaN(val)) val = 1;
    val += change;
    if (val < 1) val = 1;
    input.value = val < 10 ? '0' + val : val;
}

/**
 * Copies the coupon code to the clipboard and updates the button text temporarily.
 * @param {string} code - The coupon code to copy.
 * @param {HTMLElement} btn - The button element that was clicked.
 */
function copyCoupon(code, btn) {
    navigator.clipboard.writeText(code).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="text-[10px] font-bold text-[#025A60]">COPIED</span>';

        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    });
}

/**
 * Updates "Get it for..." prices based on current variant price and coupon discount.
 * @param {number} currentPriceCents - The current variant price in cents.
 */
function updateCouponPrices(currentPriceCents) {
    document.querySelectorAll('.coupon-price-text').forEach(el => {
        const discountPercent = parseFloat(el.dataset.discount);
        if (!isNaN(discountPercent)) {
            // Calculate discounted price
            const discountedParam = currentPriceCents * (1 - discountPercent / 100);
            // Format money (Assuming standard Shopify formatting or simple JS formatting)
            const formatted = '₹' + (Math.round(discountedParam / 100)).toLocaleString('en-IN');
            const priceSpan = el.querySelector('.dynamic-price');
            if (priceSpan) priceSpan.textContent = formatted;
        }
    });
}

/**
 * Redirects to the cart page with the selected variant and quantity (Direct Checkout).
 * @param {HTMLElement} btn - The button element that was clicked.
 */
function buyNow(btn) {
    const variantIdInput = document.getElementById('SelectedVariantId');
    const quantityInput = document.getElementById('Quantity');

    if (!variantIdInput || !quantityInput) {
        console.error('Missing variant or quantity input');
        return;
    }

    // Show Loader
    if (btn) {
        if (!btn.dataset.original) {
            btn.dataset.original = btn.innerHTML;
        }
        btn.innerHTML = `
            <span class="loader w-4 h-4 mr-2"></span>
            <span class="font-['Cabin'] font-medium text-[16px] text-[#F9F3F1] uppercase leading-none mt-[2px]">Processing...</span>
        `;
        btn.classList.add('btn-loading');
    }

    const variantId = variantIdInput.value;
    const quantity = quantityInput.value;

    window.location.href = `/cart/${variantId}:${quantity}`;
}

/**
 * Resets the "Buy It Now" button state on page show (e.g., when navigating back).
 * This ensures the button is not stuck in a loading state.
 * @param {Event} event - The pageshow event object.
 */
window.addEventListener('pageshow', (event) => {
    // Select all potential Buy It Now buttons that might be loading
    // Since we didn't add a specific ID or class to target, we can rely on the onclick attribute or just add a class in liquid.
    // However, we added 'btn-loading' class. We can reset any button with 'btn-loading' AND 'data-original'.
    const loadingBtns = document.querySelectorAll('.btn-loading[data-original]');
    loadingBtns.forEach(btn => {
        btn.innerHTML = btn.dataset.original;
        btn.classList.remove('btn-loading');
        delete btn.dataset.original;
    });
});

/**
 * Handles variant selection: updates hidden input, UI prices, and active state of variant buttons.
 * @param {HTMLElement} btn - The button element representing the selected variant.
 */
function selectVariant(btn) {
    const variantId = btn.dataset.variantId;
    const price = btn.dataset.price;
    const priceCents = parseInt(btn.dataset.priceCents);
    const compareAtPrice = btn.dataset.compareAtPrice;
    const compareCents = parseInt(btn.dataset.compareCents);

    // Update Hidden Input
    const hiddenInput = document.getElementById('SelectedVariantId');
    if (hiddenInput) hiddenInput.value = variantId;

    // Update UI Price
    const productPrice = document.getElementById('ProductPrice');
    if (productPrice) productPrice.textContent = price;

    // Update Compare Price
    const compareEl = document.getElementById('ComparePrice');
    if (compareEl) {
        if (!isNaN(compareCents) && compareCents > priceCents) {
            compareEl.textContent = compareAtPrice;
            compareEl.classList.remove('hidden');
        } else {
            compareEl.classList.add('hidden');
        }
    }

    // Trigger Coupon Update
    if (!isNaN(priceCents)) {
        updateCouponPrices(priceCents);
    }

    // Update Toggle State
    document.querySelectorAll('.variant-btn').forEach((b) => {
        // Reset to default state (Inactive)
        b.classList.remove('bg-primary', 'text-white', 'border-primary');
        b.classList.add('bg-primary-light', 'text-primary', 'border-transparent', 'hover:border-primary');
    });
    // Set active state (Active)
    btn.classList.remove('bg-primary-light', 'text-primary', 'border-transparent', 'hover:border-primary');
    btn.classList.add('bg-primary', 'text-white', 'border-primary');
}

/**
 * Initializes Embla Carousels for product images and coupons on DOMContentLoaded.
 * Also handles initial coupon price updates and carousel navigation/thumbnail syncing.
 */
document.addEventListener('DOMContentLoaded', function () {
    const mainNode = document.getElementById('MainCarousel');
    const thumbNode = document.getElementById('ThumbCarousel');
    const prevBtn = document.getElementById('PrevButton');
    const nextBtn = document.getElementById('NextButton');

    // Initial Coupon Price Update
    // Use price-cents if available, otherwise fallback
    const initialPriceBtn = document.querySelector('.variant-btn[data-price-cents]');
    if (initialPriceBtn) {
        updateCouponPrices(parseInt(initialPriceBtn.dataset.priceCents));
    } else if (mainNode && mainNode.dataset.initialPrice) {
        // Fallback using data attribute on container
        const initialPricev = parseInt(mainNode.dataset.initialPrice);
        updateCouponPrices(initialPricev);
    }

    if (mainNode && thumbNode && window.EmblaCarousel) {
        // Initialize Main Carousel
        const mainEmbla = EmblaCarousel(mainNode, { loop: true });

        // Initialize Thumbnail Carousel
        const thumbEmbla = EmblaCarousel(thumbNode, {
            containScroll: 'keepSnaps',
            dragFree: true,
            axis: 'x',
        });

        // Navigation
        if (prevBtn) prevBtn.addEventListener('click', mainEmbla.scrollPrev);
        if (nextBtn) nextBtn.addEventListener('click', mainEmbla.scrollNext);

        /**
         * Syncs the thumbnail carousel with the main carousel's selected slide.
         * Updates active states and scrolls the thumbnail into view.
         */
        const syncThumbs = () => {
            const index = mainEmbla.selectedScrollSnap();
            const slides = thumbNode.querySelectorAll('.embla__slide--thumb');

            // Update Active State
            slides.forEach((slide, i) => {
                if (i === index) {
                    slide.classList.remove('border-transparent', 'opacity-50');
                    slide.classList.add('border-[#025A60]', 'opacity-100');
                } else {
                    slide.classList.add('border-transparent', 'opacity-50');
                    slide.classList.remove('border-[#025A60]', 'opacity-100');
                }
            });

            // Scroll Thumb into View
            thumbEmbla.scrollTo(index);
        };

        mainEmbla.on('select', syncThumbs);
        mainEmbla.on('init', syncThumbs);

        // Expose scrollToSlide globally for click handlers
        window.scrollToSlide = (index) => {
            mainEmbla.scrollTo(index);
        };
    }

    // Coupon Carousel Integration (Mobile Only)
    const couponNode = document.getElementById('CouponCarousel');
    if (couponNode && window.EmblaCarousel) {
        EmblaCarousel(couponNode, {
            dragFree: true,
            containScroll: 'trimSnaps',
            align: 'start',
            breakpoints: {
                '(min-width: 768px)': { active: false }
            }
        });
    }
});
