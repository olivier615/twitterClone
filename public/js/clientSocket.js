let connected = false
const socket = io('http://localhost:3001')

socket.emit('setup', userLoggedIn)
// userLoggedIn 是要傳回後端的參數
socket.on('connected', () => connected = true)
socket.on('message received', (newMessage) => messageReceived(newMessage))
