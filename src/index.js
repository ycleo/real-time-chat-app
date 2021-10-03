const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocation } = require('./utils/messages')

// create server that support socket
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.emit('serverMessage', generateMessage('Welcome!'))
    socket.broadcast.emit('serverMessage', generateMessage('A new user has joined!'))

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
        io.emit('serverMessage', generateMessage('A user has left...'))
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})