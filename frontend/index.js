
function init () {
    hidePostLoginElements();
}


function hidePostLoginElements () {
    let els = document.getElementsByClassName('logged')
    Array.from(els).forEach(el => {
        el.style.display = 'flex';
        console.log('none')
    });
}