// import {fetchHabitActivitiesToCalendar} from './calendar_new.js'

// const habitList = document.querySelector("#habitList")
function showHabitCreationModal() {
    console.log("showing")
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

    for (i = 0; i < k.length; i++) {
        if (v[i] == null || v[i] == "") {
            empties.push(k[i])
        }
        habitObject[k[i]] = v[i];
    }


    console.log("empties: " + empties)

    if (empties.length > 0) {
        const emptyInputs = empties.map(el => document.querySelector("#" + el))
        emptyInputs.map(el => {
            el.placeholder = "Cannot be empty!"
            el.style.backgroundColor = "salmon"
        })
        setTimeout(() => {
            emptyInputs.map(el => {
                el.placeholder = el.id
                el.style.backgroundColor = "white"
            })
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
            .then(res => {
                fetchHabitActivitiesToCalendar()
            })
            .catch(error => {
                console.log(error)
            })
    }

    // console.log(habitObject)
    // return false
    closeHabitCreationModal()
}

function fetchTodayHabitActivities() {
    return fetch("/api/today_done_habit_ids", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            return data
        })
        .catch(error => console.log(error))

}
function fetchHabits() {
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
function createHabitList(data) {

    fetchTodayHabitActivities()
        .then(res => {console.log(res); return res})
        // .then(res => res.json())
        .then(activityData => {
            activityData = activityData.data
            const habitList = document.querySelector("#habitList")
            habitList.innerHTML = ''
            console.log("DATA", data)
            if (data.error) {
                habitList.innerHTML += `
    <button class="full-button" onclick="showHabitCreationModal()">New habit</button>
    `;
            }

            else {
                
                data.forEach(el => {
                    done = false
                    if(activityData.map(a => a["habit_id"]).includes(el.id)){
                        console.log("TRUTH")
                        done = true
                    }
                    if (done){
                        hour = new Date(activityData.filter(a => a.habit_id === el.id)[0]["activity_datetime"])
                        hour = (hour.getHours()<10 ? "0"+hour.getHours() :
                        hour.getHours()) + ":" + (hour.getMinutes()<10 ? "0"+hour.getMinutes() :
                        hour.getMinutes())
    
                    }
                    habitList.innerHTML += `
                <div class="habit-card ${done ? 'done' : ''}">
                    <div class="container"><h3>${el.name}</h3>${done ? 
                        hour
                        : 
                        ''}</div>
                    <p>${el.description}</p>
                    <div class="habit-bars">
                        <p><i>lowbar:</i> ${el.lowbar}</p>
                        <p><i>highbar:</i> ${el.highbar}</p>
                    </div>
                    <div class="habit-cue-reward">
                        <p><i>cue:</i> ${el.cue}</p>
                        <p><i>reward:</i> <b>${el.reward}</b></p>
                    </div>
                    <div >
                        ${!done ? 
                            `<button class='full-button' onclick='handleHabitDone(${el.id})'>Done</button>`
                            :
                            `<button class='full-button' onclick='handleHabitUndone(${el.id})'>Undo</button>`
                            }
                       
                        <button class="full-button" onclick='handleHabitDelete(${el.id})'>Abandon</button>
                        <button class="full-button" style="display: none" onclick='handleHabitModification(${el.id})'>Modify</button>
    
                        </div>
                </div>
                <br>
            `
                });
                habitList.innerHTML += `
        <button class="full-button new-habit" onclick="showHabitCreationModal()">New habit</button>
        `;
            }

        })
        .catch(error => console.log(error))

    // const innerHTMLOld = habitList.innerHTML
    // habitList.innerHTML = ``;

}
function getHabitIds() {
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

function handleHabitDone(habitId) {
    fetch("/api/habit_activity", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            habit_id: habitId,
        }),
    })
        .then(res => res.json())
        .then(data => {
            fetchHabits()
            console.log(data)
            renderCalendar()
        })
        .catch(error => console.log(error))

}

function handleHabitUndone(habitId) {
    return fetch("/api/undo_habit_activity", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            habit_id: habitId,
        }),
    })
        .then(res => res.json())
        .then(data => {
            fetchHabits()
            console.log(data)
            fetchHabitActivitiesToCalendar()
            renderCalendar()
        })
        .catch(error => console.log(error))

}

function handleHabitDelete(habitId) {
    console.log('fired')
    fetch("/api/habit/" + habitId, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(res => res.json())
        .then(data => console.log(data))
        .then(res => fetchHabits())
        .then(res => renderCalendar())
        .error(error => console.log(error))
}

function handleHabitModification(habit) {

}


function displayCalendar(){
    const rangeToggle = document.querySelector("#rangeToggle")

    console.log(rangeToggle.value)
    if (rangeToggle){
        
        displayWeekCalendar()
    }
    else {
        displayMonthCalendar()
    }
    // container.innerHTML =
}

// function displayMonthCalendar(){
//     const container = document.querySelector("#calendarContainer")
//     for (i = 0; i < 30; i)
// }

function displayWeekCalendar(){
    const container = document.querySelector("#calendarContainer")
    container.innerHTML = ""
    fetchHabitActivities("week")
    .then(res => {
        events = res.data
        console.log(res)
        events.map(el => {
            container.innerHTML += `
            <p>${el.activity_datetime}</p>`
        })
    })
}

function fetchHabitActivities(dateRange = "week"){
    return fetch ("/api/habit_activity/"+dateRange, {
        method: "GET",
        
    }
    )
    .then(res => res.json())
    .then(data => {
        console.log(data)
        return data
    })
    .catch(error => console.log(error))
}

