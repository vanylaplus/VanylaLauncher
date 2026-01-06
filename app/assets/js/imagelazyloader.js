/**
 * Image Lazy Loading Helper
 * Provides utilities for lazy loading images and deferring heavy assets
 */

class ImageLazyLoader {
    constructor() {
        this.observer = null
        this.initializeObserver()
    }

    /**
     * Initialize Intersection Observer for lazy loading
     */
    initializeObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target
                    const src = img.getAttribute('data-src')
                    const srcset = img.getAttribute('data-srcset')

                    if (src) {
                        img.src = src
                    }
                    if (srcset) {
                        img.srcset = srcset
                    }

                    img.classList.add('lazy-loaded')
                    this.observer.unobserve(img)
                }
            })
        }, options)
    }

    /**
     * Observe image element for lazy loading
     * @param {HTMLImageElement} img - Image element
     */
    observeImage(img) {
        if (this.observer && img.hasAttribute('data-src')) {
            this.observer.observe(img)
        }
    }

    /**
     * Observe all images with data-src attribute
     */
    observeAllImages() {
        const images = document.querySelectorAll('img[data-src]')
        images.forEach(img => this.observeImage(img))
    }

    /**
     * Force load image immediately (no lazy loading)
     * @param {string|HTMLImageElement} imageOrSelector - Image element or selector
     */
    forceLoad(imageOrSelector) {
        let img
        if (typeof imageOrSelector === 'string') {
            img = document.querySelector(imageOrSelector)
        } else {
            img = imageOrSelector
        }

        if (img) {
            const src = img.getAttribute('data-src')
            const srcset = img.getAttribute('data-srcset')

            if (src) img.src = src
            if (srcset) img.srcset = srcset

            img.classList.add('lazy-loaded')
            if (this.observer) {
                this.observer.unobserve(img)
            }
        }
    }

    /**
     * Prefetch image without displaying (useful for hero images)
     * @param {string} src - Image source
     * @returns {Promise<void>}
     */
    prefetch(src) {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = () => reject(new Error(`Failed to prefetch: ${src}`))
            img.src = src
        })
    }

    /**
     * Prefetch multiple images
     * @param {string[]} sources - Array of image sources
     * @returns {Promise<void>}
     */
    prefetchMultiple(sources) {
        return Promise.all(sources.map(src => this.prefetch(src).catch(e => console.debug(e))))
    }

    /**
     * Destroy observer (for cleanup)
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect()
        }
    }
}

const imageLazyLoader = new ImageLazyLoader()

module.exports = imageLazyLoader
