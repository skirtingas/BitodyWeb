document.addEventListener('DOMContentLoaded', () => {
    const fieldsets = document.querySelectorAll('.about fieldset');
    fieldsets.forEach((fs) => {
        const legend = fs.querySelector('legend');
        if (!legend) return;

        // Accessibility attributes
        legend.setAttribute('role', 'button');
        legend.setAttribute('tabindex', '0');
        legend.setAttribute('aria-expanded', 'false');

        const setExpanded = (open) => {
            legend.setAttribute('aria-expanded', String(open));
        };

        const toggle = () => {
            const isOpen = fs.classList.toggle('open');
            setExpanded(isOpen);
        };

        legend.addEventListener('click', (e) => {
            e.preventDefault();
            toggle();
        });

        legend.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    });
});