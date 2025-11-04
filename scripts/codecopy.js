document.querySelectorAll('code').forEach(link => {
    link.addEventListener('click', () => {
        const oldText = link.innerText;
        if (oldText == 'Copied!') {
            return;
        }
        navigator.clipboard.writeText(link.innerText);
        link.innerText = 'Copied!';
        setTimeout(() => {
            link.innerText = oldText;
        }, 1250);
    });
});