$(document).ready(() => {
  $.get('/api/chats', (data, status, xhr) => {
    if (xhr.status == 400) {
      alert('could not get chat list.')
    }
    else {
      outputChatList(data, $('.resultsContainer'))
    }
  })
})

const outputChatList = (chatList, container) => {
  chatList.forEach(chat => {
    const html = createChatHtml(chat)
    container.append(html)
  })
  if (chatList.length == 0) {
    container.append('<span class="noResults">Nothing to show</span>')
  }
}

const createChatHtml = (chatData) => {
  const chatName = getChatName(chatData)
  const image = getChatImageElement(chatData)
  const latestMessage = 'This is the latest message'
  return `
    <a href="/messages/${ chatData._id }" class="resultListItem">
      ${ image }
      <div class="resultDetailContainer ellipsis">
        <span class="heading ellipsis">${ chatName }</span>
        <span class="subText ellipsis">${ latestMessage }</span>
      </div>
    </a>
  `
}

const getChatName = (chatData) => {
  let chatName = chatData.chatName
  if (!chatName) {
    const otherChatUser = getOtherChatUser(chatData.users)
    const namesArray = otherChatUser.map(user => user.firstName + ' ' + user.lastName)
    chatName = namesArray.join(', ')
  }
  return chatName
}

const getOtherChatUser = (users) => {
  if (users.length == 1) return users // means you are in a chat with yourself
  return users.filter(user => user._id !== userLoggedIn._id)
}

const getChatImageElement = (chatData) => {
  const otherChatUser = getOtherChatUser(chatData.users)
  let groupChatClass = ""
  let chatImage = getUserChatImageElement(otherChatUser[0])
  if (otherChatUser.length > 1) {
    groupChatClass = 'groupChatImage'
    chatImage += getUserChatImageElement(otherChatUser[1])
  }
  return `
  <div class="resultsImageContainer ${ groupChatClass }">
    ${ chatImage }
  </div>
  `
}

const getUserChatImageElement = (user) => {
  if (!user || !user.profilePic) return alert('User passed into function is invalid')
  return `
  <img src="${ user.profilePic }" alt="User's profile pic">
  `
}