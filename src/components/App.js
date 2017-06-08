import React from 'react'
import {Link} from 'react-router-dom'

function Users(props){
   let users = props.usersActive
   let finalUsers

   finalUsers = users.map((user, index) => {
      return <li key={user+index}>{user}</li>
   })

   return (
      <div className="users-active-container">
         <b>There are
            {' ' + props.usersActive.length + ' '}
            {props.usersActive.length == 1 ? 'user' : 'users'} connected</b>
         <br/>
         <ul className="users-active">{finalUsers}</ul>
      </div>
   )
}

class App extends React.Component{
   render(){
      return(
         <div>
            <h1>Welcome to the chat app {this.props.user}</h1>
            <div className='link-buttons'>
               <Link to="/">Go to start</Link>
               <Link to="/user">Go to user</Link>
               <Link to="/chat">Go to chat</Link>
            </div>
            {this.props.children}
            <Users
               usersActive={this.props.usersActive}/>
         </div>
      )
   }
}

export default App
