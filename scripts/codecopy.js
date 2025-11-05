document.querySelectorAll('code').forEach(link => {
    link.addEventListener('click', () => {
        const oldText = link.innerText;
        if (oldText == 'Copied!') {
            return;
        }
        navigator.clipboard.writeText(link.innerText);
        link.innerText = 'Copied!';
        link.classList.add('active');
        setTimeout(() => {
            link.innerText = oldText;
            link.classList.remove('active');
        }, 1000);
    });
});