$(document).ready(() => {
  $.get(`/api/chats/${ chatId }`, (data) => {
    $('#chatName').text(getChatName(data))
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

const messageSubmitted = () => {
  const content = $('.inputTextBox').val().trim()
  if (content != '') {
    sendMessage(content)
    $('.inputTextBox').val('')
  }
}

const sendMessage = (content) => {
  $.post('/api/massages', { content, chatId }, (data, status, xhr) => {
    console.log(data)
  })
}