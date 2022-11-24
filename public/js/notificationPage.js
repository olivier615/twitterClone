$(document).ready(() => {
  $.get('/api/notifications', (data) => {
    outputNotificationList(data, $('.resultsContainer'))
  })
})

$('#markNotificationAsRead').click(() => {
  markNotificationAsOpened()
})

const outputNotificationList = (notifications, container) => {
  notifications.forEach(notification => {
    const html = createNotificationHtml(notification)
    container.append(html)
  })
  if (notifications.length == 0) {
    container.append('<span class="noResults">Nothing to show</span>')
  }
}

const createNotificationHtml = (notification) => {
  const { userFrom, opened } = notification
  const text = getNotificationText(notification)
  const url = getNotificationUrl(notification)
  const className = opened ? '' : 'active'
  return `
  <a href="${ url }" class="resultListItem notification ${ className }" data-id="${ notification._id }">
    <div class="resultsImageContainer">
      <img src="${ userFrom.profilePic }">
    </div>
    <div class="resultsDetailsContainer ellipsis">
      <span class="ellipsis">
        ${ text }
      </span>
    </div>
  </a>
  `
}

const getNotificationText = (notification) => {
  const { userFrom, notificationType } = notification
  if (!userFrom.firstName || !userFrom.lastName) {
    return alert('User from data not populate')
  }
  const userFromName = `${ userFrom.firstName } ${ userFrom.lastName }`
  let text = ''
  if (notificationType == 'retweet') {
    text = `${ userFromName } retweet one your posts`
  }
  else if (notificationType == 'postLike') {
    text = `${ userFromName } liked one your posts`
  }
  else if (notificationType == 'reply') {
    text = `${ userFromName } replied to one your posts`
  }
  else if (notificationType == 'follow') {
    text = `${ userFromName } followed you`
  }
  return text
}

const getNotificationUrl = (notification) => {
  const { notificationType, entityId } = notification
  let url = '#'
  if (notificationType == 'retweet' ||
    notificationType == 'postLike' ||
    notificationType == 'reply') {
    url = `/posts/${ entityId }`
  }
  else if (notificationType == 'follow') {
    url = `/profile/${ entityId }`
  }
  return url
}