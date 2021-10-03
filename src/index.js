/* Server Code */

const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocation } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// create a server that support socket
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// socket API description:
// 1. socket.emit() => only sends event to the specific client

// 2. io.emit() => sends event to every connected clients
//    io.to.emit() => limit to the specific room

// 3. socket.broadcast.emit() => sends event to every connected clients except for the "socket" one
//    socket.broadcast.to.emit() => limit to the specific room

io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.on('join', (usernameAndRoom, callback) => {
        const { error, user } = addUser({ id: socket.id, ...usernameAndRoom })
        
        if (error) {
            return callback(error)
        }
        
        socket.join(user.room)

        socket.emit('serverMessage', generateMessage('Welcome!'))
        socket.broadcast.to(user.room).emit('serverMessage', generateMessage(`${user.username} has joined!`))

        callback()
    })

    socket.on('clientMessage', (message, callback) => {
        const filter = new Filter()
        if (filter.isProfane(message)) {
            // The callback function is defined by client side.
            // But the argument is given by the server 
            return callback('Profanity is not allowed!')
        }
        
        io.emit('serverMessage', generateMessage(message))
        callback()
    })

    socket.on('shareLocation', (coords, callback) => {
        io.emit('locationMessage', generateLocation(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback() // Let the client know his or her location has been shared
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id) // return [] if no one else in the room after removeUser operation

        if (user) {  // if there are still people in the room
            io.to(user.room).emit('serverMessage', generateMessage(`${user.username} has left...`))
        }    
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})