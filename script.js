document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.tool-card.animate-on-load');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('is-visible');
        }, index * 150);
    });
});
