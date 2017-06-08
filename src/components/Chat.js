import React from 'react'
import {MessagesView} from './MessagesView'

function LoginMessage(props){
   return (
      <h2>You must login first before accessing the chat.</h2>
   )
}

class ChatContent extends React.Component{
   handleSubmit(e){
      e.preventDefault()
      const message = this.refs.activeMessage.value

      if(!message || message.length <= 0)
         alert('Message is required')
      else{

         // Clone our current messages
         let messages = this.props.messages.slice()
         messages.push({
            from: this.props.user,
            content: message,
         })
         this.props.handleMessages(messages)
         this.refs.activeMessage.value = ''
      }
   }

   render(){
      return (
         <div>
            <h2>Chat app</h2>
            <div className="messages-container">
               <MessagesView
                  messages={this.props.messages}
                  user={this.props.user}
                  scrollChatToBottom={this.props.scrollChatToBottom}
               />
            </div>
            <div className="messages-actions">
               <form onSubmit={this.handleSubmit.bind(this)}>
                  <input ref="activeMessage" type="text" />
                  <input type="submit" value="Send" />
               </form>
            </div>
         </div>
      )
   }
}

class Chat extends React.Component{
   handleStartMessages(startMessages){
      this.props.handleMessages(startMessages)
   }

   getMessages(){
      // TODO
      // this.props.getMessages()
   }

   render(){
      if(this.props.loggedIn)
         return <ChatContent {...this.props} />
      else
         return <LoginMessage
            {...this.props}
            handleMessages={this.props.handleMessages}
         />
   }
}

export default Chat
