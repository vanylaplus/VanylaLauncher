/**
 * Script for help.ejs
 */

let faqInitialized = false;

// Initialize FAQ accordion
function initFaqAccordion() {
    if(faqInitialized) return; // Prevent double initialization
    
    const faqItems = document.querySelectorAll('.faqItem');
    if(faqItems.length === 0) return;
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faqQuestion');
        const answer = item.querySelector('.faqAnswer');
        const arrow = question.querySelector('span:last-child');
        
        if (question && answer && !item.hasListener) {
            // Initialize state
            item.isOpen = false;
            answer.style.maxHeight = '0px';
            item.hasListener = true;
            
            question.addEventListener('click', function(e) {
                e.stopPropagation();
                
                if(!item.isOpen) {
                    // OPEN
                    const contentHeight = answer.querySelector('div').offsetHeight;
                    answer.style.maxHeight = (contentHeight + 24) + 'px';
                    answer.style.paddingTop = '8px';
                    question.style.background = 'rgba(120,120,120,0.2)';
                    if(arrow) arrow.style.transform = 'rotate(180deg)';
                    item.isOpen = true;
                } else {
                    // CLOSE
                    answer.style.maxHeight = '0px';
                    answer.style.paddingTop = '0px';
                    question.style.background = 'rgba(120,120,120,0.1)';
                    if(arrow) arrow.style.transform = 'rotate(0deg)';
                    item.isOpen = false;
                }
            });
        }
    });
    
    faqInitialized = true;
}

// Call init when DOM is ready
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaqAccordion);
} else {
    initFaqAccordion();
}
