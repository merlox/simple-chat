import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import io from 'socket.io-client'
let socket = null
let isAdmin = false
let adminCode = null

const Message = props => {
   let className = props.isYours ? 'message ' : 'other-message '
   // className += props.sending ? 'message-sending' : ''

   return (
      <li className={className}>
         {props.content}
      </li>
   )
}

const MessagesView = ({ scrollChatToBottom, messages }) => {
   useEffect(() => {
      scrollChatToBottom()
   }, [])

   let formattedMessages = !messages || messages.length == 0 ? [] : messages.map((msg, index) => {
      const isYours = msg.isAdmin && isAdmin ? true : (
         !msg.isAdmin && !isAdmin
      )
      return <Message
         key={index}
         isYours={isYours}
         from={isAdmin && msg.isAdmin ? 'yourself' : 'support'}
         content={msg.message}
      />
   })

   return(
      <ul>
         { formattedMessages }
      </ul>
   )
}

const Main = () => {
   const [activeChatId, setActiveChatId] = useState(null)
   const [messages, setMessages] = useState([])
   const [adminChatIds, setAdminChatIds] = useState(null)
   const [isChatCollapsed, setIsChatCollapsed] = useState(true)
   const [tempAdminMode, setTempAdminMode] = useState(false)

   useEffect(() => {
      socket = io()
      setSocketListeners()
      loadExistingSessionIfAny()
   }, [])
   useEffect(() => {
      scrollChatToBottom()
   }, [messages])

   window.messages = messages

   const setSocketListeners = () => {
      socket.on('NEW_CHAT_ID', data => {
         localStorage.setItem('waterloo-chat-session', data.newChatId)
         setActiveChatId(data.newChatId)
      })
      // If there's a conversation already, receive the messages and re-create them
      socket.on('EXISTING_CHAT_DATA', data => {
         const messages = JSON.parse(data.messages)
         setActiveChatId(data.chatId)
         setMessages(messages)
      })
      // After sending the /admin <code> command successfully you'll save the admin code and see the chats to start conversations with
      socket.on('ADMIN_CHAT_IDS', data => {
         adminCode = data.adminCode
         isAdmin = true
         setTempAdminMode(true)
         setAdminChatIds(data.chatIds)
      })
      // Gets the conversation for a specified chat id (only the admin can do this)
      socket.on('RECEIVE_ADMIN_CHAT', data => {
         // Format messages and show myself as admin
         setActiveChatId(data.chatId)
         setAdminChatIds(null)
         setMessages(data.messages)
      })
      socket.on('RECEIVE_MESSAGE', data => {
         // You must use the set state with the callback otherwise messages is undefined
         setMessages(msgs => {
            const messagesCopy = msgs.slice(0)
            messagesCopy.push(data.newMessage)
            return messagesCopy
         })
      })
   }

   // You don't know the chatId when connected first until you 
   const loadExistingSessionIfAny = () => {
      const chatId = localStorage.getItem('waterloo-chat-session')
      if (chatId && chatId.length > 0) {
         socket.emit('EXISTING_CHAT', { chatId })
      } else {
         socket.emit('NEW_CHAT')
      }
   }

   const scrollChatToBottom = () => {
      let divContainer = document.querySelector('.messages-container')
      divContainer.scrollTop = divContainer.scrollHeight
   }

   const submitMessage = e => {
      e.preventDefault()
      const chatMessage = e.target[0].value.trim()
      e.target[0].value = ''
      if (!chatMessage || chatMessage.length == 0) return
      // Show admin mode
      if (chatMessage.trim().toLowerCase().startsWith('/admin')) {
         const adminCode = chatMessage.trim().toLowerCase().split('/admin')[1].trim()
         setMessages([])
         return socket.emit('GET_ADMIN_CHAT_IDS', { adminCode })
      }
      socket.emit('MESSAGE', {
         adminCode,
         message: chatMessage,
         timestamp: Date.now(),
         chatId: activeChatId,
         // The chat ID is already setup either from existing sessions
         // or from a new chat session setup initially
      })
   }

   const joinAdminChat = chatId => {
      // Get all the chats from that conversation and set myself as admin
      socket.emit('JOIN_ROOM_AS_ADMIN', {
         adminCode,
         chatId,
      })
   }

   return (
      <div className={isChatCollapsed ? 'chat-container' : 'chat-container uncollapsed'}>
         <div className="chat-title" onClick={() => {
            setIsChatCollapsed(!isChatCollapsed)
            // To be used for iframe integrations as a child component
            console.log('Posting message...')
            window.parent.postMessage('toggle-collapse', '*')
         }}>
            <img src="assets/up-arrow.png" className={isChatCollapsed ? 'chat-collapse' : 'chat-collapse open'} />
            Real-time chat
         </div>
         <p className="chat-subtitle">{activeChatId}</p>
         <div className="chat-content">

            <div className="messages-container">
               {tempAdminMode ? null : 
                  (messages.length == 0 ? (
                     <p className="no-messages-title">Start the conversation by typing something below...</p>
                  ) : (
                     <MessagesView
                        scrollChatToBottom={() => scrollChatToBottom()}
                        messages={messages}
                     />
                  ))
               }
               <ul className="admin-chat-ids">
                  {adminChatIds ? adminChatIds.map(chatId => 
                     <li key={chatId} onClick={() => {
                        setTempAdminMode(false)
                        joinAdminChat(chatId)
                     }}>{chatId}</li>
                  ) : null}
               </ul>
            </div>
            <form onSubmit={e => submitMessage(e)} className="messages-actions">
               <input type="text" className="main-input-chat-text" placeholder="Type here..." />
               <input type="submit" value="Send" className="submit-button" />
            </form>

         </div>
      </div>
   )
}

const container = document.querySelector('#root')
const root = createRoot(container)
root.render(<Main />)
