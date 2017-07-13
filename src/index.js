import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter, Route} from 'react-router-dom'
import AddUser from './components/AddUser'
import Chat from './components/Chat'
import App from './components/App'
import './index.css'
import io from 'socket.io-client'

const socket = io()

class MyRouter extends React.Component{
   constructor(){
      super()
      this.state = {
         user: 'Owner',
         loggedIn: false,
         usersActive: [],
         messages: [],
      }

   }

   componentDidMount(){
      this.recoverState(done => {
         socket.emit('NEW_USER', {user: this.state.user})
      })

      socket.on('USERS_ACTIVE', usersActive => {
         this.setState({
            usersActive,
         })
      })
      socket.on('MESSAGES', messages => {
         this.setState({
            messages,
         })
      })
   }

   addUser(user){
      let oldName = this.state.user
      this.setState({
         user,
         loggedIn: true
      }, () => {
         localStorage.setItem('user', user)
         localStorage.setItem('logged', true)
         socket.emit('UPDATE_USER', {
            oldName,
            newName: user,
         })
      })
   }

   changeLogged(){
      this.setState({
         loggedIn: false
      }, () => {
         localStorage.setItem('logged', false)
      })
   }

   handleMessages(messages){
      this.setState({
         messages,
      }, () => {
         let msgs = messages.slice()
         msgs = msgs.splice(-1, 1)[0]

         socket.emit('MESSAGE', msgs)

         this.scrollChatToBottom()
      })
   }

   scrollChatToBottom(){
      let divContainer = document.querySelector('.messages-container')
      divContainer.scrollTop = divContainer.scrollHeight
   }

   recoverState(cb){
      if('user' in localStorage)
         this.setState({
            user: localStorage.user,
            loggedIn: true,
         }, () => {
            cb()
         })
   }

   render(){
      return(
         <BrowserRouter>
            <App {...this.state}>
               <Route path="/user" render={() => (
                  <AddUser
                     addUser={this.addUser.bind(this)}
                     loggedIn={this.state.loggedIn}
                     user={this.state.user}
                     changeLogged={this.changeLogged.bind(this)}
                  />
               )} />
               <Route path="/chat" render={() => (
                  <Chat
                     {...this.state}
                     handleMessages={this.handleMessages.bind(this)}
                     scrollChatToBottom={this.scrollChatToBottom.bind(this)}
                  />
               )} />
            </App>
         </BrowserRouter>
      )
   }
}

ReactDOM.render((
   <MyRouter/>),
   document.querySelector('#root')
)
