document.addEventListener('DOMContentLoaded', function() {
    console.log('=== HELP PAGE LOADED ===');

    // Bind FAQ question items (accordion)
    const faqQuestions = document.querySelectorAll('#helpContainer .faqQuestion');
    console.log('FAQ Questions found:', faqQuestions.length);
    
    faqQuestions.forEach((question, index) => {
        question.addEventListener('click', function(e) {
            e.stopPropagation();
            const faqItem = this.closest('.faqItem');
            const answer = faqItem.querySelector('.faqAnswer');
            const arrow = this.querySelector('span:last-child');
            
            if (!answer) return;
            
            // Vérifier si cet item est ouvert avec la classe
            const isOpen = faqItem.classList.contains('faqOpen');
            
            if (isOpen) {
                // Fermer l'item courant
                faqItem.classList.remove('faqOpen');
                answer.style.maxHeight = '0px';
                arrow.textContent = '+';
            } else {
                // Fermer TOUS les autres items
                const allFaqItems = document.querySelectorAll('#helpContainer .faqItem.faqOpen');
                allFaqItems.forEach(openItem => {
                    if (openItem !== faqItem) {
                        openItem.classList.remove('faqOpen');
                        const itemAnswer = openItem.querySelector('.faqAnswer');
                        const itemArrow = openItem.querySelector('.faqQuestion span:last-child');
                        if (itemAnswer) itemAnswer.style.maxHeight = '0px';
                        if (itemArrow) itemArrow.textContent = '+';
                    }
                });
                
                // Ouvrir l'item courant
                faqItem.classList.add('faqOpen');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                arrow.textContent = '−';
            }
            
            console.log('FAQ Item', index, 'toggled. Open:', !isOpen);
        });
    });
});
