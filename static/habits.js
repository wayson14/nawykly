// const habitList = document.querySelector("#habitList")
function showHabitCreationModal() {
    const modal = document.querySelector(".habit-creation-modal");
    modal.style.display = 'flex'
}

function closeHabitCreationModal() {
    
    console.log('closing')
    const modal = document.querySelector(".habit-creation-modal");
    modal.style.display = 'none'
    return false
}

function saveHabit() {

    const form = document.querySelector("#inputContainer")
    // const keysArray = form.children
    const formArray = Array.from(form.children)
    const v = formArray.map(el => el.value)
    const k = formArray.map(el => el.id)
    const habitObject = {}
    const empties = []
  
    for (i = 0; i < k.length; i++){
        if (v[i] == null || v[i] == ""){
            empties.push(k[i])
        }
        habitObject[k[i]] = v[i];
    }


    console.log("empties: "+ empties)

    if (empties.length > 0){
        const emptyInputs = empties.map(el => document.querySelector("#"+el))
        emptyInputs.map(el => {
            el.placeholder="Cannot be empty!"
            el.style.backgroundColor="salmon"  
        })
        setTimeout(() => {
            emptyInputs.map(el => {
                el.placeholder=el.id
                el.style.backgroundColor="white"})
        }, 3000)
    }
    else {
        console.log(habitObject)

        fetch("/api/habit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(habitObject),
        })
        .then(res => {
            console.log(res.body)
            res.json()
        })
        .then(data => {
            console.log(data)
        })
        .then(data => {
            fetchHabits()
        })
        .catch(error => {
            console.log(error)
        })
    }
    
    // console.log(habitObject)
    // return false
}


function fetchHabits (){
    getHabitIds()
        .then(ids => {
            ids['ids'] = ids['data'].map(el => el['id'])
            console.log(ids)
            return fetch("/api/user_habits", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(ids),
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            createHabitList(data)
        })
        .catch(error => console.log(error))

}
function createHabitList (data) {
    const habitList = document.querySelector("#habitList")
    data.forEach(el => {
        habitList.innerHTML =+ `
            <div class="habit-card">
                <h3>${el.name}</h3>
                <p>${el.description}</p>
                
            </div>
            <br>
            
        `
        
    });
}
function getHabitIds (){
    return fetch("/api/habit", {
        method: "GET",
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        return data
    })
    .catch(error => console.log(error))
}
// function getHabitsDetails (ids){
//     return 
// }