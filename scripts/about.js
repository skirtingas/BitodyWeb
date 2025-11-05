document.addEventListener('DOMContentLoaded', () => {
    const fieldsets = document.querySelectorAll('.about fieldset');
    fieldsets.forEach((fs) => {
        const legend = fs.querySelector('legend');
        if (!legend) return;

        let content = fs.querySelector('.fieldset-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'fieldset-content';
            const children = Array.from(fs.children);
            children.forEach((child) => {
                if (child !== legend) content.appendChild(child);
            });
            fs.appendChild(content);
        }

        content.style.maxHeight = '0px';

        legend.setAttribute('role', 'button');
        legend.setAttribute('tabindex', '0');
        legend.setAttribute('aria-expanded', 'false');
        if (!content.id) {
            content.id = `fieldset-content-${Math.random().toString(36).slice(2, 8)}`;
        }
        legend.setAttribute('aria-controls', content.id);

        const setExpanded = (open) => {
            legend.setAttribute('aria-expanded', String(open));
        };

        const toggle = () => {
            const isOpen = fs.classList.toggle('open');
            setExpanded(isOpen);
            if (isOpen) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0px';
            }
        };

        legend.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
        });

        legend.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
        window.addEventListener('resize', () => {
            if (fs.classList.contains('open')) {
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });

        fs.addEventListener('click', (e) => {
            if (e.target && e.target.closest('a')) {
                return;
            }
            toggle();
        });
    });
});