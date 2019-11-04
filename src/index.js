const path = require('path')
const http = require('http')
const express = require('express')
const socketio =  require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()

const port = process.env.PORT || 3000
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

io.on('connection', (socket)=>{
	console.log('New connection has been created!')

	
	

	// socket.emit('countUpdated', count)

	// socket.on('increment', ()=>{
	// 	count++
	// 	io.emit('countUpdated',count)
	// })

	socket.on('join', ({username,room},callback)=>{

		const {error,user} = addUser({id : socket.id, username, room})

		if(error){
			return callback(error)
		}

		socket.join(user.room)
		socket.emit('message', generateMessage('Admin','Welcome!!'))
		socket.broadcast.to(user.room).emit('message', generateMessage(user.username,`${user.username} has joined!`))

		io.to(user.room).emit('userData', {
			users : getUsersInRoom(user.room),
			room : user.room
		})
	})

	socket.on('sendMessage', (message,callback) => {
		const filter = new Filter()
		const user = getUser(socket.id)
		if(filter.isProfane(message)){
			return callback('Profane words are not allowed!')
		}
		io.to(user.room).emit('message',generateMessage(user.username,message))
		callback()

	})

	socket.on('disconnect', ()=>{
		const user = removeUser(socket.id)
		if(user){
			io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left`))

			io.to(user.room).emit('userData', {
				users : getUsersInRoom(user.room),
				room : user.room
			})
		}
	})
	socket.on('sendLocation', (location,callback)=>{
		const user = getUser(socket.id)
		io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
		callback('Location shared!')
	})
})

server.listen(port, ()=> {
	console.log(`Listening to the port ${port}`)
})