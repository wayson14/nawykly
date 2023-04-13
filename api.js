/* ======================== */
/* AUTHORISATION UTILITY	*/
/* ======================== */
/*
    PERMISSION LEVELS
    -1 -> not logged in
    0 -> normal level
    1 -> admin level
    2 -> dev level

*/



function checkPermissionLevel(req, connection, callback) {
    connection.query("SELECT permission_level FROM user WHERE username = ?",
        [req.session.username],
        function (error, results, fields) {
            if (error) {
                console.log(error.message)
                callback(-1)
            }
            else if (results.length < 1) {
                callback(-1)
            }
            else {
                if (req.session.username)
                    console.log("PERMISSION LEVEL OF " + req.session.username + ": " + results[0].permission_level)
                callback(results[0].permission_level)
            }
        })
}

function checkIfHabitOwner(req, habitId, connection, callback) {
    connection.query(`SELECT * FROM habit INNER JOIN user 
    ON habit.user_id = user.id 
    WHERE habit.id = ? AND user.username = ?`,
        [habitId, req.session.username],
        function (error, results, fields) {
            if (error) {
                console.log(error)
                callback(false)
            }
            else if (results.length < 1) {
                callback(false)
            }
            else {
                callback(true)
            }
        })
}



/* ======================== */
/* QUERRY UTILITY       	*/
/* ======================== */
function createPatchQuery(tableName, rowId, keys, values, indexColName = "id") {
    q = "UPDATE " + tableName + " SET "
    for (i = 0; i < keys.length; i++) {
        q = q + "\`" + keys[i] + "\`" + '=' + "\'" + values[i] + "\'"
        if (i < keys.length - 1) q = q + ','
    }
    q = q + " WHERE " + indexColName + " = " + rowId + ";"
    return q
}

/* ======================== */
/* RESPONSE-MAKERS      	*/
/* ======================== */

function sendData(req, res, data){
    res.send(JSON.stringify(
        {data: data}))
    res.status(200)
}

function sendError(req, res, error){
    res.status(500)
    res.send({error: error})
}


module.exports = function (app, connection) {
    /* ======================== */
    /* BASIC API            	*/
    /* ======================== */
    app.get('/api', (req, res) => {
        res.send({ test: 'test'});
    })

    app.get('/api/users', (req, res) => {
        // const permissionLevel = checkPermissionLevel(req, connection);
        // console.log(permissionLevel)
        checkPermissionLevel(req, connection, (result) => {
            if (result < 2) {
                if (req.session.username)
                    res.send({ message: "permission level for " + req.session.username + " is too low" })
                else
                    res.send({ message: "resource not accessible for not logged users" })
            }
            else {
                console.log("SENDING DATA")
                connection.query("SELECT * FROM user",
                    [],
                    (error, results, fields) => {
                        if (error) {
                            console.log(error)
                        }
                        else {
                            res.send({ data: results })
                        }
                    })
            }
        })

    }
    )

    /* ======================== */
    /* HABIT API            	*/
    /* ======================== */
    app.post("/api/habit", (req, res) => {
        const habit = req.body
        connection.query(`INSERT INTO habit
            SELECT 
            NULL,
            id,
            ?,
            ?,
            ?,
            ?,
            ?, 
            ?,
            ?
        FROM user WHERE username = ?;`,
            [req.body.name,
            req.body.description,
            req.body.cue,
            req.body.reward,
            req.body.lowbar,
            req.body.highbar,
            req.body.frequency,
            req.session.username],
            function (error, results, fields) {
                console.log(results.affectedRows)
                if (error) {
                    console.log(error.message)
                    res.send({ error: error.message })
                }
                else if (!req.session.username) {
                    console.log("NO AFFECTED ROWS")
                    res.send({message: "You need to be logged in"})
                }
                else {
                    console.log("HABIT ADDED")
                    res.send({ message: "Habit added successfully." })
                }
            })
    })

    app.get("/api/habit", (req, res) => {
        if (req.session.username) {
            connection.query(`SELECT habit.id 
            FROM habit INNER JOIN user on habit.user_id = user.id
            WHERE user.username = ?`,
                [req.session.username],
                function (error, results, fields) {
                    if (error) {
                        res.send({ message: error })
                    }
                    else {
                        res.send({ data: results })
                    }
                })
        }
        else {
            res.send({ message: "You need to be logged in" })
        }

    })

    app.get("/api/habit/:habitId", (req, res) => {
        checkPermissionLevel(req, connection, (permissionLevel) => {
            //checks if admin
            if (permissionLevel === -1) {
                res.send({ message: "You need to be logged in" })
            }
            else if (permissionLevel === 2) {
                connection.query(`SELECT * FROM habit WHERE habit.id = ?`,
                    [req.params.habitId],
                    function (error, results, fields) {
                        if (error) {
                            res.send({ error: error.message })
                        }
                        else {
                            res.send(results)
                        }
                    })
            }
            else {
                connection.query(`SELECT habit.* 
                FROM habit INNER JOIN user
                ON habit.user_id = user.id
                WHERE user.username = ? 
                AND habit.id = ?`,
                    [req.session.username, req.params.habitId],
                    function (error, results, fields) {
                        if (error) {
                            res.send({ error: error.message })
                        }
                        else {
                            res.send(results)
                        }
                    })
            }
        })
    })

    //get
    app.post("/api/user_habits", (req, res) => {
        if (!req.session.loggedin){
            res.send({message: "You need to be logged in"})
        }
        else {
            console.log(req.body.ids)
            connection.query("SELECT * FROM habit WHERE habit.id IN (?)",
            [req.body.ids],
            function (error, results, fields) {
                if (error) {
                    console.log(error.message)
                    res.send({error: error.message})
                }
                else {
                    res.send(results)
                }
            })
        }
    })  
    app.post("/api/test", (req, res) => {


        b = req.body
        k = Object.keys(b)
        v = k.map(el => b[el])
        console.log(b, k, v)
        q = createPatchQuery("habit", 1, k, v)
        res.send(q)
    })
    //UPDATE habit SET `name`='asdfasdf', frequency='aaa' WHERE habit.id = 1;
    app.patch("/api/habit/:habitId", (req, res) => {
        checkPermissionLevel(req, connection, (permissionLevel) => {
            //checks if logged in
            if (permissionLevel === -1) {
                res.send({ message: "You need to be logged in" })
            }
            else if (permissionLevel === 2) {//checks if admin
                b = req.body
                k = Object.keys(b)
                v = k.map(el => b[el])
                q = createPatchQuery("habit", req.params.habitId, k, v)

                connection.query(q, [],
                    function (error, results, fields) {
                        if (error) {
                            res.send({ error: error.message })
                        }
                        else {
                            res.send(results)
                        }
                    })
            }
            else { //if normal user, checks if habit belongs to him
                checkIfHabitOwner(req,
                    "habit",
                    req.params.habitId,
                    connection,
                    (result) => {
                        if (!result) {
                            res.send({ message: "This resource does not belong to you" })
                        }
                        else {
                            b = req.body
                            k = Object.keys(b)
                            v = k.map(el => b[el])
                            q = createPatchQuery("habit", req.params.habitId, k, v)

                            connection.query(q, [],
                                function (error, results, fields) {
                                    if (error) {
                                        res.send({ error: error.message })
                                    }
                                    else {
                                        res.send(results)
                                    }
                                })
                        }
                    })
            }
        })
    })
    app.delete("/api/habit/:habitId", (req, res) => {
        checkPermissionLevel(req, connection,
             (permission_level) =>{
                if (permission_level === -1){
                    res.send({message: "Only for logged users"})
                }
                else if (permission_level === 0 || 1) {
                    checkIfHabitOwner(req, req.params.habitId, connection,
                        result => {
                            if(!result){
                                res.send({message: "You are not owner of this habit"})
                            }
                            else{
                                connection.query(`DELETE FROM habit WHERE habit.id = ?`,
                                [req.params.habitId],
                                function(error, results, fields) {
                                    if (error){
                                        res.send({error: error.message})
                                    }
                                    else {
                                        res.send({message: "Habit id "+req.params.habitId+" deleted succesfully"})
                                    }
                                })
                            }
                        })
                }
                else if (permission_level === 2)
                {
                    connection.query(`DELETE FROM habit WHERE habit.id = ?`,
                                [req.params.habitId],
                                function(error, results, fields) {
                                    if (error){
                                        res.send({error: error.message})
                                    }
                                    else {
                                        res.send({message: "Habit id "+req.params.habitId+" deleted succesfully"})
                                    }
                                })
                }

        })
        
    })

    app.post("/api/undo_habit_activity", (req, res) => {
        if(req.session.loggedin) {
            connection.query(`DELETE FROM habit_activity 
            WHERE habit_id = ? 
            AND habit_activity.activity_datetime > CURRENT_DATE() 
            AND habit_activity.activity_datetime < DATE_ADD( CURRENT_DATE(), INTERVAL 1 DAY);`,
            [req.body.habit_id],
            function (error, results, fields) {
                if (error){
                    sendError(req, res, error)
                }
                else {
                    sendData(req, res, results)
                }
            })
        }
    })
    app.get("/api/today_done_habit_ids", (req, res) => {
        function getTodayActivity() {
            connection.query(`SELECT habit_activity.*
            FROM habit_activity INNER JOIN user
            ON habit_activity.user_id = user.id
            WHERE user.username = ?
            AND habit_activity.activity_datetime > CURRENT_DATE()
            AND habit_activity.activity_datetime < DATE_ADD( CURRENT_DATE(), INTERVAL 1 DAY); `,
            [req.session.username],
            function (error, results, fields){
                if (error) {
                    sendError(req, res, error)
                }
                else {
                    console.log(results)
                    sendData(req, res, results)
                }
            })
        }
        if (req.session.loggedin){
            getTodayActivity()

        }
        else {
            sendError(req, res, "Only for logged in users")
        }
    })
    app.post("/api/habit_activity", (req, res) => {
        function addHabitActivity() {
            console.log('activity')
            connection.query(`INSERT INTO habit_activity 
            SELECT NULL, user.id, ?, NOW() FROM user WHERE user.username = ?;`,
            [req.body.habit_id, req.session.username],
            function (error, results, fields) {
                if(error){
                    sendError(req, res, error)
                }
                else {
                    sendData(req, res, results)
                }
            })
        }
        if (!req.session.loggedin){
            sendError(req, res, "User not logged in!")
        }
        else {
            checkPermissionLevel(req, connection, (permission_level) => {
                if (permission_level == -1){
                    sendError(req, res, "User not logged in!")
                }
                else if (permission_level == 2){
                    addHabitActivity()
                }
                else {
                    checkIfHabitOwner(req, req.habit_id, connection, (res => {
                        if (!res){
                            sendError(req, res, "Permission denied!")
                        }
                        else {
                            addHabitActivity()
                        }
                    }))
                }
                
               
            })

            
        }
    })
    app.get("/api/habit_activity/:range", (req, res) => {
        if(!req.session.loggedin){
            sendError(req, res, "You need to be logged in")
        }
        else {
            if (req.params.range ==  "week") //TODO: change this
            {
                connection.query(`SELECT habit_activity.*
                FROM habit_activity INNER JOIN user
                ON habit_activity.user_id = user.id
                WHERE user.username = ?
                AND habit_activity.activity_datetime > DATE_ADD( CURRENT_DATE(), INTERVAL -8 DAY) 
                AND habit_activity.activity_datetime < DATE_ADD( CURRENT_DATE(), INTERVAL 1 DAY);`,
                [req.session.username],
                function (error, results, fields){
                    if(error) sendError(req, res, error)
                    else sendData(req, res, results)
                })
            }
            else if (req.params.range == "month")
            {
                connection.query(`SELECT habit_activity.*
                FROM habit_activity INNER JOIN user
                ON habit_activity.user_id = user.id
                WHERE user.username = ?
                AND MONTH(habit_activity.activity_datetime) = MONTH(now())
                AND YEAR(habit_activity.activity_datetime) = YEAR(now());`,
                [req.session.username],
                function (error, results, fields){
                    if(error) sendError(req, res, error)
                    else {
                        console.log("HABIT RESULTS")
                        console.log(results)
                        sendData(req, res, results)}
                })
            }
        }
    })

    
}






