function updateQty(change) {
    const input = document.getElementById('Quantity');
    if (!input) return;
    let val = parseInt(input.value);
    if (isNaN(val)) val = 1;
    val += change;
    if (val < 1) val = 1;
    input.value = val < 10 ? '0' + val : val;
}

function copyCoupon(code, btn) {
    navigator.clipboard.writeText(code).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="text-[10px] font-bold text-[#025A60]">COPIED</span>';

        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    });
}

// Update "Get it for..." prices based on current variant price and coupon discount
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
        // Reset to default state
        b.classList.remove('bg-[#025A60]', 'text-white', 'border-[#025A60]');
        b.classList.add('bg-[#025A6014]', 'text-[#025A60]', 'border-transparent');
    });
    // Set active state
    btn.classList.remove('bg-[#025A6014]', 'text-[#025A60]', 'border-transparent');
    btn.classList.add('bg-[#025A60]', 'text-white', 'border-[#025A60]');
}

// Embla Carousel Integration
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

        // Sync Thumbnails
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
});
