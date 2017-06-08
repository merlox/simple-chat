import React from 'react'
import ReactDOM from 'react-dom'

function Message(props){
   let className = props.isYours ? 'message ' : 'other-message '
   className += props.sending ? 'message-sending' : ''

   return (
      <li className={className}>
         {props.content}
         <small> by {props.from}</small>
      </li>
   )
}

class MessagesView extends React.Component{
   componentDidMount(){
      this.props.scrollChatToBottom()
   }

   render(){
      let messages = this.props.messages.map((msg, index) => {
         const isYours = (msg.from === this.props.user ? true : false)
         return <Message
            key={index}
            isYours={isYours}
            from={msg.from}
            content={msg.content}
            sending={msg.sending}
         />
      })

      return(
         <ul>
            {messages}
         </ul>
      )
   }
}

export {MessagesView}
