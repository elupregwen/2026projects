
document.addEventListener('DOMContentLoaded', () => {
    // Animation observer
    const projectElements = [
        { id: 'page-header', delay: 0 },
        { id: 'filter-buttons', delay: 50 },
        ...Array.from(document.querySelectorAll('.project-card')).map((card, index) => ({
            element: card,
            delay: 100 + (index * 100)
        }))
    ];

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id) {
                    // For elements with IDs
                    const element = projectElements.find(el => el.id === entry.target.id);
                    if (element && !entry.target.classList.contains('animated')) {
                        setTimeout(() => {
                            entry.target.classList.add('animated');
                        }, element.delay);
                    }
                } else {
                    // For project cards
                    const element = projectElements.find(el => el.element === entry.target);
                    if (element && !entry.target.classList.contains('animated')) {
                        setTimeout(() => {
                            entry.target.classList.add('animated');
                        }, element.delay);
                    }
                }
            }
        });
    }, { threshold: 0.1 });

    projectElements.forEach(({ id, element }) => {
        const el = id ? document.getElementById(id) : element;
        if (el) observer.observe(el);
    });

    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');

            // Filter projects
            projectCards.forEach(card => {
                const difficulty = card.getAttribute('data-difficulty');

                if (filter === 'all' || difficulty === filter) {
                    card.classList.remove('project-hidden');
                    setTimeout(() => {
                        card.style.display = 'block';
                    }, 10);
                } else {
                    card.classList.add('project-hidden');
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 10);
                }
            });

            // Animate remaining visible projects
            const visibleCards = document.querySelectorAll('.project-card:not(.project-hidden)');
            visibleCards.forEach((card, index) => {
                card.style.animationDelay = `${index * 100}ms`;
            });
        });
    });

    // Add click animation to project cards
    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (card.classList.contains('cursor-not-allowed')) {
                e.preventDefault();
                return;
            }

            // Add click animation
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });
    });
});