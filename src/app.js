const express = require('express')
require('./db/mongoose') // we don't 'grab' anything... just requiring it makes sure it runs and connects to the db
const userRouter = require('./routes/user')
const taskRouter = require('./routes/task')

const app = express()

app.use(express.json()) // Set express server to automatically parse json responses

// Load routes
app.use(userRouter)
app.use(taskRouter)

module.exports = app
