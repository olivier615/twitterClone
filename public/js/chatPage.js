$(document).ready(() => {
  $.get(`/api/chats/${ chatId }`, (data) => {
    $('#chatName').text(getChatName(data))
  })
  $.get(`/api/chats/${ chatId }/messages`, (data) => {
    const messages = []
    data.forEach(message => {
      const html = createMessageHtml(message)
      messages.push(html)
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
  const messageDiv = createMessageHtml(message)
  addMessagesHtmlToPage(messageDiv)
}

const createMessageHtml = (message) => {
  const isMine = message.sender._id == userLoggedIn._id
  const liClassName = isMine ? 'mine' : 'theirs'
  return `
  <li class="message ${ liClassName }">
    <div class="messageContainer">
      <p class="messageBody">
        ${ message.content }
      </p>
    </div>
  </li>
  `
}