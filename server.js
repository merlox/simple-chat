const express = require('express')
const app = express()
const path = require('path')
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const storage = require('node-persist')
const yargs = require('yargs')
const argv = yargs.option('port', {
    alias: 'p',
    description: 'Set the port to run this server on',
    type: 'number',
}).help().alias('help', 'h').argv
if(!argv.port) {
    console.log('Error, you need to pass the port you want to run this application on with npm start -- -p 8001')
    process.exit(0)
}
const port = argv.port

app.use(express.static(path.join(__dirname, 'dist')))
app.use('*', (req, res, next) => {
	// Logger
	let time = new Date()
	console.log(`${req.method} to ${req.originalUrl} at ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`)
	next()
})

let messages = []
let usersConnected = []
let actualUser = null

storage.init().then(() => {
   console.log('Storage started '+new Date())

   storage.getItem('messages').then(data => {
      if(data != undefined)
         messages = data
   })
}).then(() => {
   console.log('Socket ready '+new Date())

   setInterval(() => {
      console.log(usersConnected)
      console.log(messages)
   }, 10e3)

   io.on('connection', socket => {
      console.log('User connected '+new Date())

      io.emit('MESSAGES', messages)
      io.emit('USERS_ACTIVE', usersConnected)

      socket.on('NEW_USER', data => {
         usersConnected.push(data.user)
         actualUser = data.user
         io.emit('USERS_ACTIVE', usersConnected)
      })
      socket.on('MESSAGE', message => {
         messages.push(message)
         storage.setItem('messages', messages)
         io.emit('MESSAGES', messages)
      })
      socket.on('UPDATE_USER', userData => {
         let userPosition = usersConnected.indexOf(userData.oldName)
         if(userPosition != -1)
            usersConnected.splice(userPosition, 1, userData.newName)

         io.emit('USERS_ACTIVE', usersConnected)
      })
      socket.on('disconnect', () => {
         console.log('User disconnected '+new Date())
         let userPosition = usersConnected.indexOf(actualUser)
         if(userPosition != -1)
            usersConnected.splice(userPosition, 1)

         io.emit('USERS_ACTIVE', usersConnected)
      })
   })
})

http.listen(port, '0.0.0.0')
console.log(`Listening on ${port}`)
