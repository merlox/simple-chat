# This is a reactjs chat application tutorial made from scratch

You will learn:
- How to design your application
- The components required
- Server side stuff

## First we create the "offline" react application

To start we are going to create the react.js app without the server code and once we are comfortable with its functionality, we can build the complete server with real time communication.

Lets start creating the app with `create-react-app chat`.

Then remove all the files inside the `src` folder. And create an index.js inside the empty `src` folder.

Let's start by importing react and react dom:

```
import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import './index.css'
```

It's important to import the css because `webpack` needs it for the virtual dom.

Then go to your `src` folder and create `index.css`. Remove the `favicon.ico` that's created by default inside `public`.

Let's create a component to see something in our app:

```
class App extends Component{
   render(){
      return(
         <div>
            <h1>It works</h1>
         </div>
      )
   }
}
```

Then render it on the react dom:

```
ReactDOM.render(
   <App />,
   document.querySelector('#root')
)
```

Edit your `index.html` inside `public` by removing those annoying comments and changing the `title` of your app:

```
<title>Chat React</title>
```

Then, in your command line, move to your app folder `cd chat` and start the app with `npm start`.

You'll see the message. Now let's review the basic design.

On one hand it should have an input area where the user will be able to write messages with a 'Send' button.

On the other hand it should have a 'View' are where the user will be able to see past messages with it's respective date.

So let's create the following components:

- MessagesView
- Message

First off, to keep the development organized, we will save the components in a separate `components` folder inside `src`. Go ahead and create that now.

Then create the files above mentioned `MessagesView` and `Message`.
Let's go first with `Message.js`:

The message will have the following state:

- **Sending**: if the message it's being sent.

So import the react component and create the `Message` class. Then export it:

```
import React, {Component} from 'react'

class Message extends Component{
   render(){
      return (
         <li className={this.props.isYours ? 'message' : 'other-message'}>
            {this.props.content}
         </li>
      )
   }
}

export default Message
```

I've created the message as a `<li>` tag because it's going to be inside a list. It's logical to think that messages are in a list.

Then I've added `{this.props.message}` because I will create an attribute `message` in the super class of this one to define it's contents.

Then the className that defines it's class depending on if it's the owner or not to style it accordingly.

Following I will create the states inside the constructor:

```
constructor(){
   super()
   this.state = {
      sending: false,
   }
}
```


Now let's create the `MessagesView` component. This component will have all the logic about the messages. That means that it will:

- Get the messages from past conversations with an ajax call.
- Get the messages from the server in real time.
- Set up the messages one by one.

So lets create that:

```
import React from 'react'
import Message from './Message'

class MessagesView extends React.Component{
   constructor(){
      super()
      this.state = {
         messages: [{
            from: 'Owner',
            content: 'I made this message myself',
         }, {
            from: 'Example',
            content: 'This is an example',
         }, {
            from: 'Other',
            content: 'This is other message',
         }, {
            from: 'Another',
            content: 'This is another message',
         }],
      }
   }

   getMessages(){
      // TODO
   }

   render(){
      let messages = this.state.messages.map(msg => {
         const isYours = (msg.from === 'Owner' ? true : false)
         return <Message isYours={isYours} content={msg.content}/>
      })

      return(
         <ul>
            {messages}
         </ul>
      )
   }
}

export default MessagesView
```

Remember that when importing, you can omit the `.js` part.

I imported the `Message` component from the same folder. Then I've created the constructor with some example `messages` in the state. Then I've set up a function called `getMessages` that will fetch the messages from past conversations to the `messages` array when the app loads.

Finally I render each message as a bunch of `<Message/>` elements. Remember to export it because we'll be using this component in our main view.

In tour `index.js` file import the messages view component:

```
import MessagesView from './components/MessagesView'
```

and place it inside the .messages-container:
```
<div className="messages-container">
   <MessagesView/>
</div>
```

Now you should see the messages being displayed in your app.

If you open the chrome dev tools, you will see a quite common warning in red saying that `Warning: Each child in an array or iterator should have a unique "key" prop`. This means that each message must have a `key` property to recognize it easily.

So add that using an `index` as your second parameter inside the `map` function:

```
this.state.messages.map((msg, index) => { ... }
```

And add the key prop:

```
<Message key={index} ... />
```

Next, let's create the send messages functionality. This will add the messages to the `state` of the `MessagesView` and it will update the server message array in real time.

To submit the message we will modify our virtual `html` and create an `onSubmit` event that will save the value from the `input` into the state of the app.

```
<form onSubmit={this.handleSubmit.bind(this)}>
   <input ref="activeMessage" type="text" />
   <input type="submit" value="Send" />
</form>
```

To get the content of the input we used a `ref` prop to find it easily in the virtual dom. I used `bind` to pass the same `this` variable to the function, otherwise it won't know what is `this` inside the event handler.

Then in the `handleSubmit` we will save the state of the new message inside the messages array. Although we have the messages in the `MessagesView` component therefore we must move the messages to the parent component:

```
// In index.js
this.state = {
   messages: [{
      from: 'Owner',
      content: 'I made this message myself',
   }, {
      from: 'Example',
      content: 'This is an example',
   }, {
      from: 'Other',
      content: 'This is other message',
   }, {
      from: 'Another',
      content: 'This is another message',
   }],
}

// Remove the constructor and states from MessagesView.js
// And change the message map
let messages = this.props.messages.map((msg, index) => { ... }
```

Notice the new `this.props` that was `this.state` before. Add this to your state in `index.js`:

```
user: 'Owner'
```

Now I want to store the active user in the state so I just have to declare it inside the `constructor` `this.state`. So change your `MessageView.js` accordingly:

```
const isYours = (msg.from === this.props.user ? true : false)
```

Notice the new `this.props.user`.
And add the prop to the parent in `index.js`:

```
<MessagesView messages={this.state.messages} user={this.state.user}/>
```

After those changes we can continue creating our `handleSubmit` functionality that will add a new message to the array of messages:

```
handleSubmit(e){
   e.preventDefault()
   const message = this.refs.activeMessage.value

   if(!message || message.length <= 0)
      alert('Message is required')
   else{

      // Clone our current messages
      let messages = this.state.messages.slice()
      messages.push({
         from: this.state.user,
         content: message,
      })
      this.setState({
         messages: messages}
      )

      this.refs.activeMessage.value = ''
   }
}
```

This will alert the user if the message is empty. If not, it will copy the state of messages to a new variable, push the new message and set the update state. Finally we clean the text in the input.

Awesome! Now you can add messages to your chat like a sane person would do! Enjoy it for a while. The next part will be using node and Universal Javascript to have real time updates.

But before that I'll set up the `getMessages` method that we created earlier in our `MessagesView` component. Go to your `index.js` and add the following code:

```
handleStartMessages(startMessages){
   this.setState({
      messages: startMessages
   })
}

render(){
   return(
      <div>
         <h1>Chat app</h1>
         <div className="messages-container">
            <MessagesView
               messages={this.state.messages}
               user={this.state.user}
            />
            getMessages={this.handleStartMessages.bind(this)}
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
```

Notice the `getMessages={this.handleStartMessages.bind(this)}` this will call the method `handleStartMessages` when we get our new messages. And then they will be set up.

## Real-time configuration

First we want to set up a react router to make this app available on the server. To do that create a `router.js` file:
