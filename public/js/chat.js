const socket = io()

// socket.on('countUpdated', (count)=>{
// 	console.log('Updated count is',count)
// })

// document.querySelector('#increment_count').addEventListener('click', ()=>{
// 	socket.emit('increment')
// })


const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $mesageFormButton = document.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

const { username, room } = Qs.parse( location.search, { ignoreQueryPrefix : true } )

socket.on('message', (message)=>{
	console.log(message)
	const html = Mustache.render(messageTemplate, {
		username : message.username,
		message : message.text,
		createdAt : moment(message.createdAt).format('h:mm a')
	})
	$messages.insertAdjacentHTML('beforeend',html)
})

socket.on('locationMessage', (message)=>{
	console.log(message)
	const html = Mustache.render(locationMessageTemplate,{
		username: message.username,
		url : message.url,
		createdAt : moment(message.createdAt).format('h:mm a')
	})
	$messages.insertAdjacentHTML('beforeend',html)
})

document.querySelector('#message-form').addEventListener('submit', (e)=>{
	e.preventDefault()

	$mesageFormButton.setAttribute('disabled','disabled')
	$messageFormInput.focus()

	const message = e.target.elements.message.value

	socket.emit('sendMessage',message, (error)=>{
		$mesageFormButton.removeAttribute('disabled')
		$messageFormInput.value = ''
		if(error){
			return console.log(error)
		}
		console.log('Message delivered!')
	})
})

document.querySelector("#send-location").addEventListener('click', ()=>{
	$locationButton.setAttribute('disabled','disabled')
	if(!navigator.geolocation){
		return alert('Geolocation API is not supported')
	}
	navigator.geolocation.getCurrentPosition((position)=>{
		socket.emit('sendLocation', {
			latitude : position.coords.latitude,
			longitude : position.coords.longitude
		}, (message)=>{
			$locationButton.removeAttribute('disabled')
			console.log(message)
		})
	})
})

socket.emit('join', {username, room}, (error)=>{
	if(error){
		alert(error)
		location.href='/'
	}
})

socket.on('userData', ({users,room})=>{
	const html = Mustache.render(sidebarTemplate, {
		users,
		room
	})
	document.querySelector("#sidebar").innerHTML = html
})