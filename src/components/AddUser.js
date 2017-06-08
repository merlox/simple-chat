import React from 'react'
import {Link} from 'react-router-dom'

class AddUser extends React.Component{
   handleNewUser(e){
      e.preventDefault()

      if(this.refs.addUserName.value === '')
         alert('User name is required')
      else
         this.props.addUser(this.refs.addUserName.value)

      this.refs.addUserName.value = ''
   }

   render(){
      return(
         <div>
            <div className={this.props.loggedIn ? 'hidden' : ''}>
               <h2>Write your username</h2>
               <form onSubmit={this.handleNewUser.bind(this)}>
                  <input type="text"
                     ref="addUserName"
                     placeholder="Give me your name"/>
                  <input type="submit" value="Save name"/>
               </form>
            </div>
            <div className={this.props.loggedIn ? '' : 'hidden'}>
               <h2>Your username is: {this.props.user + ' '}
                  <Link to="#" onClick={this.props.changeLogged}>change it!</Link>
               </h2>
            </div>
         </div>
      )
   }
}

export default AddUser
