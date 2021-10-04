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

        socket.emit('serverMessage', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('serverMessage', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('clientMessage', (message, callback) => {
        const client = getUser(socket.id) 
        const filter = new Filter()
        if (filter.isProfane(message)) {
            // The callback function is defined by client side.
            // But the argument is given by the server 
            return callback('Profanity is not allowed!')
        }

        io.to(client.room).emit('serverMessage', generateMessage(client.username, message))
        callback()
    })

    socket.on('shareLocation', (coords, callback) => {
        const client = getUser(socket.id)

        io.to(client.room).emit('locationMessage', generateLocation(client.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback() // Let the client know his or her location has been shared
    })

    socket.on('disconnect', () => {
        const client = removeUser(socket.id) // return [] if no one else in the room after removeUser operation

        if (client) {  // if there are still people in the room
            io.to(client.room).emit('serverMessage', generateMessage('Admin', `${client.username} has left...`))
            io.to(client.room).emit('roomData', {
                room: client.room,
                users: getUsersInRoom(client.room)
            })
        }    
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})