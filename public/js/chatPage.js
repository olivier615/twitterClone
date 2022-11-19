$(document).ready(() => {
  $.get(`/api/chats/${ chatId }`, (data) => {
    $('#chatName').text(getChatName(data))
  })
  $.get(`/api/chats/${ chatId }/messages`, (data) => {
    const messages = []
    let lastSenderId = ''
    data.forEach((message, index) => {
      const html = createMessageHtml(message, data[index + 1], lastSenderId)
      messages.push(html)
      lastSenderId = message.sender._id
    })
    const messagesHtml = messages.join('')
    addMessagesHtmlToPage(messagesHtml)
  })
})

$('#chatNameButton').click(() => {
  const name = $('#chatNameTextBox').val().trim()
  $.ajax({
    url: '/api/chats/' + chatId,
    type: 'PUT',
    data: { chatName: name },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert('could not update')
      }
      else {
        location.reload()
      }
    }
  })
})

$('.sendMessageButton').click(() => {
  messageSubmitted()
})

$('.inputTextBox').keydown((event) => {
  if (event.which === 13 && !event.shiftKey) {
    messageSubmitted()
    return false // 取消切換下一行
  }
})

const addMessagesHtmlToPage = (html) => {
  $('.chatMessages').append(html)
  // todo: scroll to bottom
}

const messageSubmitted = () => {
  const content = $('.inputTextBox').val().trim()
  if (content != '') {
    sendMessage(content)
    $('.inputTextBox').val('')
  }
}

const sendMessage = (content) => {
  $.post('/api/messages', { content, chatId }, (data, status, xhr) => {
    if (xhr.status !== 201) {
      alert('Could not send message')
      $('.inputTextBox').val(content)
      return
    }
    addChatMessageHtml(data)
  })
}

const addChatMessageHtml = (message) => {
  if (!message || !message._id) {
    alert('Message is not valid')
    return
  }
  const messageDiv = createMessageHtml(message, null, '')
  addMessagesHtmlToPage(messageDiv)
}

const createMessageHtml = (message, nextMessage, lastSenderId) => {
  const sender = message.sender
  const senderName = sender.firstName + ' ' + sender.lastName
  const currentSenderId = sender._id
  const nextSenderId = nextMessage != null ? nextMessage.sender._id : ''
  const isFirst = lastSenderId != currentSenderId
  const isLast = nextSenderId != currentSenderId
  const isMine = message.sender._id == userLoggedIn._id
  let liClassName = isMine ? 'mine' : 'theirs'
  if (isFirst) liClassName += ' first' // 多一個空白格確保不會跟前一個 class 黏在一起
  if (isLast) liClassName += ' last'
  return `
  <li class="message ${ liClassName }">
    <div class="messageContainer">
      <span class="messageBody">
        ${ message.content }
      </span>
    </div>
  </li>
  `
}