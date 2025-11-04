document.querySelectorAll('code').forEach(link => {
    link.addEventListener('click', () => {
        navigator.clipboard.writeText(link.innerText);
        const oldText = link.innerText;
        link.innerText = 'Copied!';
        setTimeout(() => {
            link.innerText = oldText;
        }, 1250);
    });
});