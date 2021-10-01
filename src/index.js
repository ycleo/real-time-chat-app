const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')

// create server that support socket
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.emit('serverMessage', 'Welcome!')
    socket.broadcast.emit('serverMessage', 'A new user has joined!')

    socket.on('clientMessage', (message) => {
        io.emit('serverMessage', message)
    })

    socket.on('shareLocation', (coords) => {
        io.emit('serverMessage', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
    })

    socket.on('disconnect', () => {
        io.emit('serverMessage', 'A user has left...')
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})