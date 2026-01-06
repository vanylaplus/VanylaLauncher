/**
 * Asset Preloader Module
 * Intelligently preloads images and heavy elements to ensure smooth navigation
 */

class AssetPreloader {
    constructor() {
        this.preloadedAssets = new Map()
        this.pendingPreloads = new Map()
        this.imageCache = new Image()
    }

    /**
     * Preload an image asset
     * @param {string} url - Image URL to preload
     * @returns {Promise<void>}
     */
    async preloadImage(url) {
        if (!url) return

        // Check if already cached
        if (this.preloadedAssets.has(url)) {
            return this.preloadedAssets.get(url)
        }

        // Check if already pending
        if (this.pendingPreloads.has(url)) {
            return this.pendingPreloads.get(url)
        }

        // Create preload promise
        const preloadPromise = new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                this.preloadedAssets.set(url, img)
                this.pendingPreloads.delete(url)
                resolve(img)
            }
            img.onerror = () => {
                this.pendingPreloads.delete(url)
                reject(new Error(`Failed to preload image: ${url}`))
            }
            img.src = url
        })

        this.pendingPreloads.set(url, preloadPromise)
        return preloadPromise
    }

    /**
     * Preload multiple images
     * @param {string[]} urls - Array of image URLs
     * @returns {Promise<void>}
     */
    async preloadImages(urls) {
        if (!Array.isArray(urls)) {
            console.warn('AssetPreloader: preloadImages expects an array')
            return
        }
        return Promise.all(urls.map(url => this.preloadImage(url).catch(e => console.debug(e))))
    }

    /**
     * Preload CSS file
     * @param {string} url - CSS file URL
     */
    preloadCSS(url) {
        if (!url || this.preloadedAssets.has(url)) return

        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'style'
        link.href = url
        document.head.appendChild(link)

        // Also load the stylesheet
        const styleLink = document.createElement('link')
        styleLink.rel = 'stylesheet'
        styleLink.href = url
        document.head.appendChild(styleLink)

        this.preloadedAssets.set(url, true)
    }

    /**
     * Preload JavaScript file
     * @param {string} url - JS file URL
     * @returns {Promise<void>}
     */
    async preloadJS(url) {
        if (!url || this.preloadedAssets.has(url)) return Promise.resolve()

        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = url
            script.onload = () => {
                this.preloadedAssets.set(url, true)
                resolve()
            }
            script.onerror = () => {
                console.warn(`Failed to preload JS: ${url}`)
                resolve() // Don't reject to avoid breaking other preloads
            }
            document.head.appendChild(script)
        })
    }

    /**
     * Preload assets for a specific view
     * @param {string} viewName - View name (landing, help, cgu, wheel, etc)
     */
    async preloadViewAssets(viewName) {
        const assets = this.getViewAssets(viewName)
        
        if (!assets) {
            console.debug(`No assets defined for view: ${viewName}`)
            return
        }

        // Preload images in parallel
        if (assets.images && assets.images.length > 0) {
            this.preloadImages(assets.images).catch(e => console.debug('Image preload error:', e))
        }

        // Preload CSS files
        if (assets.css && assets.css.length > 0) {
            assets.css.forEach(cssUrl => this.preloadCSS(cssUrl))
        }
    }

    /**
     * Get asset URLs for each view
     * @param {string} viewName - View name
     * @returns {Object} Assets object with images, css, js arrays
     */
    getViewAssets(viewName) {
        const assetsMap = {
            landing: {
                images: [
                    'assets/images/backgrounds/box.jpg',
                    'assets/images/SealCircle.png',
                    'assets/images/jetons.png',
                    'assets/images/wheel-icon.svg'
                ],
                css: ['assets/css/landing.css'],
                js: []
            },
            help: {
                images: [
                    'assets/images/SealCircle.png',
                    'assets/images/help.png',
                    'assets/images/help1.png',
                    'assets/images/jetons.png'
                ],
                css: ['assets/css/landing.css'],
                js: []
            },
            cgu: {
                images: [
                    'assets/images/SealCircle.png',
                    'assets/images/jetons.png'
                ],
                css: ['assets/css/landing.css'],
                js: []
            },
            wheel: {
                images: [
                    'assets/images/SealCircle.png',
                    'assets/images/wheel-icon.svg',
                    'assets/images/jetons.png'
                ],
                css: ['assets/css/landing.css'],
                js: []
            },
            settings: {
                images: [
                    'assets/images/SealCircle.png',
                    'assets/images/jetons.png'
                ],
                css: ['assets/css/settings.css'],
                js: []
            },
            login: {
                images: [],
                css: ['assets/css/launcher.css'],
                js: []
            }
        }

        return assetsMap[viewName]
    }

    /**
     * Preload all critical assets on app startup
     */
    async preloadCriticalAssets() {
        console.log('[AssetPreloader] Preloading critical assets...')

        // Preload landing page assets (most frequently accessed)
        this.preloadViewAssets('landing')

        // Preload other important views
        const views = ['login', 'help', 'cgu', 'wheel', 'settings']
        for (const view of views) {
            this.preloadViewAssets(view)
        }

        // Preload common images used across pages
        const commonImages = [
            'assets/images/SealCircle.png',
            'assets/images/jetons.png',
            'assets/images/icons/shop.svg'
        ]
        this.preloadImages(commonImages).catch(e => console.debug('Common images preload error:', e))

        console.log('[AssetPreloader] Critical assets preload initiated')
    }

    /**
     * Clear preload cache for memory management
     */
    clearCache() {
        this.preloadedAssets.clear()
        this.pendingPreloads.clear()
    }

    /**
     * Get preload statistics
     */
    getStats() {
        return {
            preloaded: this.preloadedAssets.size,
            pending: this.pendingPreloads.size
        }
    }
}

// Create singleton instance
const assetPreloader = new AssetPreloader()

module.exports = assetPreloader
