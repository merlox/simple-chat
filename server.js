const express = require('express')
const app = express()
const path = require('path')
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const storage = require('node-persist')
const port = 4000

app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => {
   res.sendFile(path.join(__dirname, 'dist', 'index.html'))
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
