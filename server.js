require('dotenv-safe').config()
import express from 'express'
import path from 'path'
import http from 'http'
import { Server } from 'socket.io'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { v4 as uuid } from 'uuid'
const sendEmail = require('./sendEmail')
const app = express()
const server = http.createServer(app)
const io = new Server(server)
const { ADMIN_CODE, NOTIFICATION_EMAIL_RECEIVER } = process.env

const port = 8002
let db = null
const notificationDelay = 60 * 1e3 // 60 seconds in ms
let notificationEmailReceivers = {}
/*
   It contains a list of notificationEmailReceivers[socketId] = timestamp where the timestamp is used to check when the notification was sent. If it was sent 1 min ago then it can be sent again to prevent spam. So it's 1 minute delay per conversation
*/

app.use(express.static(path.join(__dirname, 'dist')))
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use('*', (req, res, next) => {
	// Logger
	let time = new Date()
	console.log(`${req.method} from ${req.ip} to ${req.originalUrl} at ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`)
	next()
})

const start = async () => {
   try {
      db = await open({
         filename: path.join(__dirname, 'database.db'),
         driver: sqlite3.Database,
      })
      await db.run('CREATE TABLE IF NOT EXISTS chats (chatId, messages)')

      console.log('Database started successfully')
      server.listen(port, '0.0.0.0')
      console.log(`Listening on ${port}`)
   } catch (e) {
      return console.log(e)
   }
}

io.on('connection', socket => {
   console.log('A user connected', socket.id)

   // Its purpose is to send the existing conversation data to the frontend
   socket.on('EXISTING_CHAT', async data => {
      console.log('EXISTING CHAT', socket.id)
      // Join the room data.chatId so the admin can come later
      socket.join(data.chatId)
      // Try to get the existing conversation for that chat and send the entire data
      try {
         const results = await db.all('SELECT * FROM chats WHERE chatId = ?', data.chatId)
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
      socket.join(newChatId)
      try {
         await db.run('INSERT INTO chats VALUES (?, ?)', [
            newChatId, JSON.stringify([]),
         ])
      } catch (e) {
         console.log('Error creating a new chat id', e)
         return
      }
      // Meant to be stored in the local storage so the conversation can be retrived in the future
      socket.emit('NEW_CHAT_ID', { newChatId })
   })

   /*
      Each message is made of these fields { isAdmin, timestamp, message}
      the isAdmin is determined from the `data.adminCode` sent on each message
   */
   // TODO emit the new message to both rooms with io.to(room).emit
   socket.on('MESSAGE', async data => {
      const newMessage = {
         isAdmin: ADMIN_CODE == data.adminCode,
         message: data.message,
         timestamp: data.timestamp,
      }
      console.log('MESSAGE by', socket.id, 'on', data.chatId)
      let existingMessages = []
      try {
         const results = await db.all('SELECT messages FROM chats WHERE chatId = ?', data.chatId)
         if (results && results.length > 0) {
            existingMessages = JSON.parse(results[0].messages)
         }
      } catch (e) {
         console.log('Error getting messages', e)
         return
      }
      // Updated messages here
      existingMessages.push(newMessage)
      try {
         await db.run(`UPDATE chats
            SET messages=?
            WHERE chatId=?`,
         [
            JSON.stringify(existingMessages), data.chatId,
         ])
      } catch (e) {
         console.log('Error saving message', e)
         return
      }
      // Send messages to both user and admin
      io.to(data.chatId).emit('RECEIVE_MESSAGE', { newMessage })


      const date = new Date()
      const minute = date.getMinutes()
      const hour = date.getHours()
      const now = Date.now()
      const shortDate = date.toLocaleDateString()
      const lastTimeSent = notificationEmailReceivers[socket.id] || 0
      if (now < lastTimeSent + notificationDelay) return

      notificationEmailReceivers[socket.id] = now
      try {
         await sendEmail(NOTIFICATION_EMAIL_RECEIVER, `New message from ${data.chatId}`, `New message from ${data.chatId} at ${shortDate} ${hour}:${minute} with content ${data.message}`)
      } catch (e) {
         console.log('Error sending notification email', e)
      }
   })

   socket.on('GET_ADMIN_CHAT_IDS', async data => {
      console.log('GET_ADMIN_CHAT_IDS', socket.id)
      if (ADMIN_CODE != data.adminCode) return console.log('Invalid admin code')
      console.log('Valid admin code')
      try {
         const results = await db.all('SELECT chatId FROM chats')
         if (results && results.length > 0) {
            const chatIds = results.map(c => c.chatId)
            socket.emit('ADMIN_CHAT_IDS', {
               adminCode: data.adminCode,
               chatIds,
            })
         }
      } catch (e) {
         // If error do nothing, the new chat starts
         console.log('e', e)
      } 
   })

   // Joins the socket room as the admin and sends the chat data to the admin
   socket.on('JOIN_ROOM_AS_ADMIN', async data => {
      console.log('JOIN_ROOM_AS_ADMIN', socket.id)
      if (ADMIN_CODE != data.adminCode) return console.log('Invalid admin code')
      try {
         const results = await db.all('SELECT messages FROM chats WHERE chatId=?', [
            data.chatId,
         ])
         if (results && results.length > 0) {
            // Messages is an array of messages
            const messages = JSON.parse(results[0].messages)
            socket.join(data.chatId)
            socket.emit('RECEIVE_ADMIN_CHAT', { messages, chatId: data.chatId })
         }
      } catch (e) {
         // If error do nothing, the new chat starts
         console.log('e', e)
      }
   })

   socket.on('disconnect', () => {
      console.log('Disconnected', socket.id)
   })
})

start()
