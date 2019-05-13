const express = require('express')
require('./db/mongoose') // we don't 'grab' anything... just requiring it makes sure it runs and connects to the db
const userRouter = require('./routes/user')
const taskRouter = require('./routes/task')

const app = express()
const port = process.env.PORT

app.use(express.json()) // Set express server to automatically parse json responses

// Load routes
app.use(userRouter)
app.use(taskRouter)

// Listen
app.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})
