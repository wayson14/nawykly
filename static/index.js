
function init () {
    hidePostLoginElements();
    console.log("init");
    const bannerText = document.querySelector("#bannerText");
    // bannerText.innerHTML = "witaj w nawykly, "+{}
    fetch("/session_details", {
        method: "GET",
    })
    .then(res => {
        console.log(res.username)
    })
    .catch(err => {
        console.log(err)
    })
}


function hidePostLoginElements () {
    let els = document.getElementsByClassName('logged')
    Array.from(els).forEach(el => {
        el.style.display = 'flex';
        console.log('none')
    });
}

function logout () {
    fetchRedirect('/logout')
    .then(res => console.log('succesfully logged out'))
    .catch(err => console.log(err))
   
}

// UTILITY FUNCTIONS
//function made so I can redirect directly from fetch request
function fetchRedirect(endpoint) {
    return fetch(endpoint, {
        method: 'GET',
        redirect: 'follow'
    }
    ).then((res) => {
        return res.json()
    })
    .then(data => {
        console.log(data)
        window.location.href = data.redirect
    })
    .catch((err) => console.log(err))
}

function login(username, password) {
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "username": username,
            "password": password
        })
    })
    .then(res => {
        res.json()
    })
    .then(data => {
        console.log(data)
    })
    .catch(error => {
        console.log(error)
    })

}