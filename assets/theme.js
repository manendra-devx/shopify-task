/**
 * Theme Global Scripts
 * Contains initialization logic for various sections to keep Liquid files clean.
 */

document.addEventListener('DOMContentLoaded', () => {
    initVideoMarquee();
    initReviewsCarousel();
});

/**
 * Initializes the Video Marquee Section
 * Handles Embla Carousel setup, navigation buttons, and video playback on click.
 */
function initVideoMarquee() {
    const emblaNode = document.getElementById('video-marquee-carousel');
    if (!emblaNode) return;

    if (!window.EmblaCarousel) {
        console.warn('EmblaCarousel not loaded');
        return;
    }

    const viewport = emblaNode;
    const emblaApi = EmblaCarousel(viewport, {
        loop: true,
        align: 'center',
        dragFree: true,
        containScroll: 'trimSnaps',
    });

    // Navigation Buttons
    const prevBtn = document.getElementById('MarqueePrevButton');
    const nextBtn = document.getElementById('MarqueeNextButton');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => emblaApi.scrollPrev());
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => emblaApi.scrollNext());
    }

    // Add click listeners to slides
    const slides = emblaNode.querySelectorAll('.embla__slide');

    slides.forEach((slide, index) => {
        const card = slide.querySelector('.video-card');
        if (!card) return;

        card.addEventListener('click', () => {
            // 1. Scroll to this slide
            emblaApi.scrollTo(index);

            // 2. Handle Video Playback
            toggleVideo(card);
        });
    });

    // Helper: Toggle Video State
    function toggleVideo(card) {
        const video = card.querySelector('video');
        const icon = card.querySelector('.play-icon-overlay');
        const allVideos = document.querySelectorAll('.video-card video');

        if (video.paused) {
            // Pause all others
            allVideos.forEach((v) => {
                if (v !== video && !v.paused) {
                    v.pause();
                    const vIcon = v.parentElement.querySelector('.play-icon-overlay');
                    if (vIcon) vIcon.style.opacity = '1';
                }
            });

            // Play active
            video.play();
            icon.style.opacity = '0';
        } else {
            // Pause active
            video.pause();
            icon.style.opacity = '1';
        }
    }
}

/**
 * Initializes the Customer Reviews Section
 * Handles Embla Carousel setup and custom dot navigation.
 */
function initReviewsCarousel() {
    const emblaNode = document.getElementById('reviews-carousel');
    const dotsNode = document.querySelector('.embla__dots');
    if (!emblaNode) return; // dotsNode is optional if logic handles it

    if (!window.EmblaCarousel) {
        console.warn('EmblaCarousel not loaded');
        return;
    }

    const emblaApi = EmblaCarousel(emblaNode, {
        loop: false,
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree: true,
    });

    // Add dot navigation
    const dots = dotsNode ? dotsNode.querySelectorAll('.embla__dot') : [];

    if (dots.length > 0) {
        emblaApi.on('select', () => {
            const selectedIndex = emblaApi.selectedScrollSnap();
            dots.forEach((dot, index) => {
                if (index === selectedIndex) {
                    dot.classList.add('opacity-100');
                    dot.classList.remove('opacity-30');
                } else {
                    dot.classList.add('opacity-30');
                    dot.classList.remove('opacity-100');
                }
            });
        });

        // Initial dot state
        dots[0].classList.add('opacity-100');
        dots[0].classList.remove('opacity-30');

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => emblaApi.scrollTo(index));
        });
    }
}
