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

function createPatchQuery(tableName, rowId, keys, values, indexColName = "id") {
    q = "UPDATE " + tableName + " SET "
    for (i = 0; i < keys.length; i++) {
        q = q + "\`" + keys[i] + "\`" + '=' + "\'" + values[i] + "\'"
        if (i < keys.length - 1) q = q + ','
    }
    q = q + " WHERE " + indexColName + " = " + rowId + ";"
    return q
}




module.exports = function (app, connection) {
    /* ======================== */
    /* BASIC API            	*/
    /* ======================== */
    app.get('/api', (req, res) => {
        res.send({ test: 'test' });
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
                        res.send({ message: error.message })
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

}






