const socket = io()
const messageForm = document.querySelector('#message-form')
const sharedLocation = document.querySelector('#share-location')

socket.on('serverMessage', (received_message) => {
    console.log(received_message)
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // const message = document.querySelector('input').value
    const message = e.target.elements.message.value
    socket.emit('clientMessage', message)
})

sharedLocation.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser...')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position)
        socket.emit('shareLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        })
    })
})