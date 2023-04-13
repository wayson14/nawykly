const daysTag = document.querySelector(".days"),
currentDate = document.querySelector(".current-date"),
prevNextIcon = document.querySelectorAll(".icons span");

// getting new date, current year and month
let date = new Date(),
currYear = date.getFullYear(),
currMonth = date.getMonth();

// storing full name of all months in array
const months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];

const renderCalendar = () => {
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(), // getting first day of month
    lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(), // getting last date of month
    lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(), // getting last day of month
    lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate(); // getting last date of previous month
    let liTag = "";

    for (let i = firstDayofMonth; i > 0; i--) { // creating li of previous month last days
        liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
    }

    for (let i = 1; i <= lastDateofMonth; i++) { // creating li of all days of current month
        // adding active class to li if the current day, month, and year matched
        let isToday = i === date.getDate() && currMonth === new Date().getMonth() 
                     && currYear === new Date().getFullYear() ? "active" : "";
        liTag += `<li class="${isToday}">${i}</li>`;
    }

    for (let i = lastDayofMonth; i < 6; i++) { // creating li of next month first days
        liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`
    }
    currentDate.innerText = `${months[currMonth]} ${currYear}`; // passing current mon and yr as currentDate text
    daysTag.innerHTML = liTag;
    anchorDate = new Date(currYear, currMonth, 1)
    fetchHabitActivitiesToCalendar()
    .then(res => populateCalendar(anchorDate, res))
    .catch(error => console.log(errors))

}
renderCalendar();

prevNextIcon.forEach(icon => { // getting prev and next icons
    icon.addEventListener("click", () => { // adding click event on both icons
        // if clicked icon is previous icon then decrement current month by 1 else increment it by 1
        currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

        if(currMonth < 0 || currMonth > 11) { // if current month is less than 0 or greater than 11
            // creating a new date of current year & month and pass it as date value
            date = new Date(currYear, currMonth, new Date().getDate());
            currYear = date.getFullYear(); // updating current year with new date year
            currMonth = date.getMonth(); // updating current month with new date month
        } else {
            date = new Date(); // pass the current date as date value
        }
        renderCalendar(); // calling renderCalendar function
    });
});

function fetchHabitActivitiesToCalendar(dateRange = "month"){
    return fetch ("/api/habit_activity/"+dateRange, {
        method: "GET",
        
    }
    )
    .then(res => res.json())
    .then(data => {
        console.log("GOTTEN BY CALENDAR: ")
        console.log(data)
        return data
    })
    .catch(error => console.log(error))
}

function populateCalendar(anchorDate, data){
    let dates = []
    const displayedDays = document.querySelector(".days")
    
    let previousDays = Array.from(document.querySelectorAll(".days li.inactive"))
        .filter(day => day.innerText > 24)
    
    let nextDays = Array.from(document.querySelectorAll(".days li.inactive"))
        .filter(day => day.innerText < 8)

    let currDays = Array.from(document.querySelectorAll(".days li:not(.inactive)"))
    
    // const anchorDate = new Date()
    previousDays = previousDays.map(day => day.innerText)
    nextDays = nextDays.map(day => day.innerText)
    currDays = currDays.map(day => day.innerText)

    console.log("ANCHOR: ", anchorDate)
    d = new Date(anchorDate)
    d.setMonth(anchorDate.getMonth() - 1)
    previousDays.forEach(day => {
        
        dates.push(addDays(d, Number(day)-1))
    })

    d.setMonth(anchorDate.getMonth())

    currDays.forEach(day => {
        dates.push(addDays(d, Number(day)-1))
    })

    d.setMonth(anchorDate.getMonth() + 1)

    nextDays.forEach(day => {
        
        dates.push(addDays(d, Number(day)-1))
    })
    // d = new Date(anchorDate)
    // d = addDays(d, 5)
    // console.log(d)

    // const listOfDays = displayedDays.childNodes
    console.log("DATES:")
    console.log(dates)
    console.log("DATA")
    console.log(data)
    activityDays = data.data.map(activity => {
        return {
            date: new Date(activity.activity_datetime),
            habit_id: activity.habit_id,
        }
    })
    console.log(activityDays)
    for (let i = 0; i < dates.length; i++){
        tile = displayedDays.childNodes[i]
        a = activityDays.map(a => {
            a.date.setHours(0,0,0,0)
            console.log(a.date)
            
            return a.date
        })
        console.log(dates[i], a, a.filter(d => d.getTime() == dates[i].getTime()).length)
        habitCount = activityDays.map(a => {
            a.date.setHours(0,0,0,0)
            return a.date.getTime()
        }).filter(a => dates[i].getTime() == a).length

        if (habitCount > 0){
            styleTile(tile, habitCount, activityDays)
            // tile.style.color = "white"
            console.log('true')
        }
    }
}

function styleTile(tile, habitCount, activityDays){
    getHabitIds()
    .then(res => {
        // ogText = tile.innerText 
        let prefix = ""
        console.log("RES: ",res, "TILE", tile)
        for (let i = 0; i < habitCount; i++){
            prefix = prefix + "."
        }
        tile.innerText = prefix + tile.innerText + prefix
        // tile.innerText = 
        //  "rgb("+Math.floor(habitCount/res.data.length*255)+", 0, 0)"
    })
    .catch(error => console.log(error))
    // tile.style.color = "white"
}
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
