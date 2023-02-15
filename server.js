import express from 'express'
import path from 'path'
import http from 'http'
import { Server } from 'socket.io'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { v4 as uuid } from 'uuid'
const app = express()
const server = http.createServer(app)
const io = new Server(server)

const port = 8002

app.use(express.static(path.join(__dirname, 'dist')))
app.use('*', (req, res, next) => {
	// Logger
	let time = new Date()
	console.log(`${req.method} from ${req.ip} to ${req.originalUrl} at ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`)
	next()
})
let messages = []
let usersConnected = []
let actualUser = null
let db = null

const start = async () => {
   try {
      db = await open({
         filename: path.join(__dirname, 'database.db'),
         driver: sqlite3.Database,
      })
      await db.run('CREATE TABLE IF NOT EXISTS chats (chatId, messagesUser, messagesBoss)')

      console.log('Database started successfully')
      server.listen(port, '0.0.0.0')
      console.log(`Listening on ${port}`)
   } catch (e) {
      return console.log(e)
   }
}

const startChat = existingConversation => {}

io.on('connection', socket => {
   console.log('A user connected', socket.id)

   // Its purpose is to send the existing conversation data to the frontend
   socket.on('EXISTING_CHAT', async data => {
      console.log('EXISTING CHAT', socket.id)
      // Try to get the existing conversation for that chat and send the entire data
      try {
         const results = await db.all('SELECT * FROM chats WHERE chatId = ?', data.chatId)
         console.log('Existing chat search', results)
         if (results && results.length > 0) {
            const chat = results[0]
            socket.emit('EXISTING_CHAT_DATA', chat)
         }
      } catch (e) {
         // If error do nothing, the new chat starts
         console.log('e', e)
      } 
   })

   // Its purpose is to create a new chat id and store it in the frontend to retrieve the existing conversation in the future
   socket.on('NEW_CHAT', async () => {
      console.log('NEW CHAT', socket.id)
      const newChatId = uuid()
      try {
         await db.run('INSERT INTO chats VALUES (?, ?, ?)', [
            newChatId, JSON.stringify([]), JSON.stringify([]),
         ])
      } catch (e) {
         console.log('Error creating a new chat id', e)
         return
      }
      // Meant to be stored in the local storage so the conversation can be retrived in the future
      socket.emit('NEW_CHAT_ID', { newChatId })
   })
})

// io.on('connection', socket => {
//    console.log('User connected '+new Date())

   // console.log('socket', socket)

   // socket.on('NEW_CHAT', data => {
   //    usersConnected.push(data.user)
   //    actualUser = data.user
   //    io.emit('USERS_ACTIVE', usersConnected)
   // })
   // socket.on('EXISTING_CHAT', async data => {
   //    try {
   //       const results = await db.all('SELECT * FROM chats WHERE chatId = ?', req.query.sessionId)
   //       if (results && results.length > 0) {
   //          const chat = results[0]
   //          startChat(chat)
   //       } else {
   //          startChat(null)
   //       }
   //    } catch (e) {
   //       console.log('e', e)
   //       io.emit('CHAT_NOT_FOUND')
   //    } 
   // })



   // socket.on('MESSAGE', message => {
   //    messages.push(message)
   //    storage.setItem('messages', messages)
   //    io.emit('MESSAGES', messages)
   // })
   // socket.on('UPDATE_USER', userData => {
   //    let userPosition = usersConnected.indexOf(userData.oldName)
   //    if(userPosition != -1)
   //       usersConnected.splice(userPosition, 1, userData.newName)

   //    io.emit('USERS_ACTIVE', usersConnected)
   // })
   // socket.on('disconnect', () => {
   //    console.log('User disconnected '+new Date())
   //    let userPosition = usersConnected.indexOf(actualUser)
   //    if(userPosition != -1)
   //       usersConnected.splice(userPosition, 1)

   //    io.emit('USERS_ACTIVE', usersConnected)
   // })
// })

start()
