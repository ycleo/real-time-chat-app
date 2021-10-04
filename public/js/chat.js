/* Client Code */

const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $shareLocationButton = document.querySelector('#share-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// autoscroll feature
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    // If it is already at the bottom of the container
    if (containerHeight - newMessageHeight <= scrollOffset) { 
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('serverMessage', (msgObject) => {
    console.log(msgObject)
    const html = Mustache.render(messageTemplate, {
        username: msgObject.username,
        message: msgObject.text,
        createdAt: moment(msgObject.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locationObject) => {
    console.log(locationObject)

    const html = Mustache.render(locationTemplate, {
        username: locationObject.username,
        url: locationObject.url,
        createdAt: moment(locationObject.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //disabel the sending button
    $messageFormButton.setAttribute('disabled', 'disabled')
    

    // const message = document.querySelector('input').value
    const message = e.target.elements.message.value

    socket.emit('clientMessage', message, (errorMsg) => {
        // enable the submit ability when server reply back
        $messageFormButton.removeAttribute('disabled')
        
        // clear the input and move the focus back to it
        $messageFormInput.value = ''
        $messageFormInput.focus()
        
        if (errorMsg) {
            return console.log(errorMsg)
        }
        
        console.log('Message delivered!')
    })
})

$shareLocationButton.addEventListener('click', () => {
    
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser...')
    }

    //disabel the sending button
    $shareLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position)
        socket.emit('shareLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => { 
            // enable the sharing ability when server reply back
            $shareLocationButton.removeAttribute('disabled')
            console.log('Location shared!') 
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})