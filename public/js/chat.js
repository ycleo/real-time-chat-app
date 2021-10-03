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

socket.on('serverMessage', (receivedMsg) => {
    console.log(receivedMsg)
    const html = Mustache.render(messageTemplate, {
        message: receivedMsg
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', (locationUrl) => {
    console.log(locationUrl)

    const html = Mustache.render(locationTemplate, {
        url: locationUrl
    })
    $messages.insertAdjacentHTML('beforeend', html)
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