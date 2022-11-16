let cropper
let timer
const selectedUsers = []

$('#postTextarea, #replyTextarea').keyup((event) => {
  const textBox = $(event.target)
  const value = textBox.val().trim()
  const isModal = textBox.parents('.modal').length == 1
  // parents() 向上找到符合的 DOM
  const submitButton = isModal ? $('#submitReplyButton') : $('#submitPostButton')
  if (value == '') {
    submitButton.prop('disabled', true)
    return
  }
  submitButton.prop('disabled', false)
})

$('#submitPostButton, #submitReplyButton').click((event) => {
  const button = $(event.target)
  const isModal = button.parents('.modal').length == 1
  const textBox = isModal ? $('#replyTextarea') : $('#postTextarea')
  const data = {
    content: textBox.val()
  }
  if (isModal) {
    const id = button.data().id
    if (id == null) return alert('Button id is null')
    data.replyTo = id
  }
  $.post('/api/posts', data, postData => {
    if (postData.replyTo) {
      location.reload()
    }
    else {
      const html =  createPostHtml(postData)
      $('.postContainer').prepend(html)
      textBox.val('')
      button.prop('disabled', true)
    }
  })
})

$('#replyModal').on('show.bs.modal', (event) => {
  const button = $(event.relatedTarget)
  const postId = getPostIdFromElement(button)
  $('#submitReplyButton').data('id', postId)
  $.get(`/api/posts/${ postId }`, results => {
    outputPosts(results.postData, $('#originalPostContainer'))
  })
})

$('#replyModal').on('hidden.bs.modal', () => $('#originalPostContainer').html(''))

$('#deletePostModal').on('show.bs.modal', (event) => {
  const button = $(event.relatedTarget)
  const postId = getPostIdFromElement(button)
  $('#deletePostButton').data('id', postId)
})

$('#confirmPinModal').on('show.bs.modal', (event) => {
  const button = $(event.relatedTarget)
  const postId = getPostIdFromElement(button)
  $('#pinPostButton').data('id', postId)
})

$('#unpinModal').on('show.bs.modal', (event) => {
  const button = $(event.relatedTarget)
  const postId = getPostIdFromElement(button)
  $('#unpinPostButton').data('id', postId)
})

$('#deletePostButton').click((event) => {
  const id = $(event.target).data('id')
  $.ajax({
    url: `api/posts/${ id }`,
    type: 'DELETE',
    success: (data, status, xhr) => {
      if (xhr.status != 202) {
        alert('Could not delete post')
        return
      }
      location.reload()
    }
  })
})

$('#pinPostButton').click((event) => {
  const id = $(event.target).data('id')
  $.ajax({
    url: `api/posts/${ id }`,
    type: 'PUT',
    data: { pinned: true },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert('Could not pin post')
        return
      }
      location.reload()
    }
  })
})

$('#unpinPostButton').click((event) => {
  const id = $(event.target).data('id')
  $.ajax({
    url: `api/posts/${ id }`,
    type: 'PUT',
    data: { pinned: false },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert('Could not pin post')
        return
      }
      location.reload()
    }
  })
})

$(document).on('click', '.likeButton', (event) => {
  const button = $(event.target)
  const postId = getPostIdFromElement(button)
  if (postId === undefined) return
  $.ajax({
    url: `api/posts/${ postId }/like`,
    type: 'PUT',
    success: (postData) => {
      // 這是 jQuery 的 find()
      button.find("span").text(postData.likes.length || "")
      // 在 main.css 70 行，避免 i 跟 span 擋住點擊 button 的觸發事件
      if (postData.likes.includes(userLoggedIn._id)) {
        button.addClass('active')
      }
      else {
        button.removeClass('active')
      }
    }
  })
})

$(document).on('click', '.retweetButton', (event) => {
  const button = $(event.target)
  const postId = getPostIdFromElement(button)
  if (postId === undefined) return
  $.ajax({
    url: `api/posts/${ postId }/retweet`,
    type: 'POST',
    success: (postData) => {
      // 這是 jQuery 的 find()
      button.find("span").text(postData.retweetUsers.length || "")
      // 在 main.css 70 行，避免 i 跟 span 擋住點擊 button 的觸發事件
      if (postData.retweetUsers.includes(userLoggedIn._id)) {
        button.addClass('active')
      }
      else {
        button.removeClass('active')
      }
    }
  })
})

$(document).on('click', '.post', (event) => {
  const element = $(event.target)
  const postId = getPostIdFromElement(element)
  if (postId !== undefined && !element.is('button')) {
    window.location.href = `/posts/${ postId }`
  }
})

$(document).on('click', '.followButton', (event) => {
  const button = $(event.target)
  const userId = button.data().user
  $.ajax({
    url: `/api/users/${ userId }/follow`,
    type: 'PUT',
    success: (data, status, xhr) => {
      if (xhr.status == 404) return
      let difference = 1
      if (data.following && data.following.includes(userId)) {
        button.addClass('following')
        button.text('following')
      }
      else {
        button.removeClass('following')
        button.text('follow')
        difference = -1
      }
      const followersLabel = $('#followersValue')
      if (followersLabel.length != 0) {
        let followersText = followersLabel.text()
        followersText = parseInt(followersText)
        followersLabel.text(followersText + difference)
      }
    }
  })
})

const getPostIdFromElement = (element) => {
  const isRoot = element.hasClass('post')
  const rootElement = isRoot == true ? element : element.closest('.post')
  // .closest() 向父層尋找指定的 class id 等等
  const postId = rootElement.data().id
  if (postId === undefined) return alert('Post id undefined')
  return postId
}

function createPostHtml (postData, largeFont = false) {
  if (postData == null) return alert('Post object is null!')
  const isRetweet = postData.retweetData !== undefined
  const retweetBy = isRetweet ? postData.postedBy.username : null
  postData = isRetweet ? postData.retweetData : postData
  const { profilePic, username, firstName, lastName } = postData.postedBy
  const { content, createdAt, _id, likes, retweetUsers } = postData
  const timestamp = timeDifference(new Date(), new Date(createdAt))
  const likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? 'active' : ''
  const retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? 'active' : ''
  const largeFontClass = largeFont ? 'largeFont' : ''
  let retweetText = ''
  if (isRetweet) {
    retweetText = ` <span>
                      <i class="fas fa-retweet"></i>
                      Retweet by<a href="/profile/${ retweetBy }">@${ retweetBy }</a>
                    </span>`
  }
  let replyFlag = ''
  if (postData.replyTo && postData.replyTo._id) {
    if (!postData.replyTo._id) {
      return alert('Reply to is not populated')
    }
    else if (!postData.replyTo.postedBy._id) {
      return alert('Posted by is not populated')
    }
    const replyToUsername = postData.replyTo.postedBy.username
    replyFlag = `
    <div class="replyFlag">
      Replying to <a href="/profile/${ replyToUsername }">@${ replyToUsername }</a>
    </div>
    `
  }
  let buttons = ''
  let pinnedPostText = ''
  if (postData.postedBy._id == userLoggedIn._id) {
    let pinnedClass = ''
    let dataTarget = '#confirmPinModal'
    if (postData.pinned === true) {
      pinnedClass = 'active'
      dataTarget = '#unpinModal'
      pinnedPostText = '<i class="fas fa-thumbtack"></i> <span>Pinned post</span>'
    }
    buttons = `
    <button class="pinnedButton ${ pinnedClass }" data-id="${ postData._id }" data-toggle="modal" data-target="${ dataTarget }">
      <i class="fas fa-thumbtack"></i>
    </button>
    <button data-id="${ postData._id }" data-toggle="modal" data-target="#deletePostModal">
      <i class="fas fa-times"></i>
    </button>
    `
  }
  return `
    <div class="post ${ largeFontClass }" data-id='${ _id }'>
      <div class="postActionContainer">
        ${ retweetText }
      </div>
      <div class="mainContentContainer">
        <div class="userImageContainer">
          <img src="${ profilePic }">
        </div>
        <div class="postContentContainer">
          <div class="pinnedPostText">${ pinnedPostText }</div>
          <div class="header">
            <a href="/profile/${ username }" class="displayName">${ firstName + ' ' + lastName }</a>
            <span class="username">@${ username }</span>
            <span class="date">${ timestamp }</span>
            ${ buttons }
          </div>
          ${ replyFlag }
          <div class="postBody">
            <span>${ content }</span>
          </div>
          <div class="postFooter">
            <div class="postButtonContainer">
              <button data-toggle='modal' data-target='#replyModal'>
                <i class="far fa-comment"></i>
              </button>
            </div>
            <div class="postButtonContainer green">
              <button class="retweetButton ${ retweetButtonActiveClass }">
                <i class="fas fa-retweet"></i>
                <span>${ retweetUsers.length || '' }</span>
              </button>
            </div>
            <div class="postButtonContainer red">
              <button class="likeButton ${ likeButtonActiveClass }">
                <i class="far fa-heart"></i>
                <span>${ likes.length || '' }</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function timeDifference (current, previous) {
  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;
  var elapsed = current - previous;
  if (elapsed < msPerMinute) {
    if (elapsed / 1000 < 30) return 'Just now'
    return Math.round(elapsed/1000) + ' seconds ago';   
  }
  else if (elapsed < msPerHour) {
    return Math.round(elapsed/msPerMinute) + ' minutes ago';   
  }
  else if (elapsed < msPerDay ) {
    return Math.round(elapsed/msPerHour ) + ' hours ago';   
  }
  else if (elapsed < msPerMonth) {
    return Math.round(elapsed/msPerDay) + ' days ago';   
  }
  else if (elapsed < msPerYear) {
    return Math.round(elapsed/msPerMonth) + ' months ago';   
  }
  else {
    return Math.round(elapsed/msPerYear ) + ' years ago';   
  }
}

const outputPosts = (results, container) => {
  container.html('')
  if (!Array.isArray(results)) {
    results = [results]
  }
  // 如果 results 不是 Array 的話，轉為 Array
  results.forEach(result => {
    const html = createPostHtml(result)
    container.append(html)
  })
  if (results.length == 0) {
    container.append('<span class="noResults">Nothing to show.</span>')
  }
}

const outputPinnedPosts = (results, container) => {
  if (results.length === 0) {
    container.hide()
    return
  }
  container.html('')
  results.forEach(result => {
    const html = createPostHtml(result)
    container.append(html)
  })
}

const outputPostsWithReplies = (results, container) => {
  container.html('')
  if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
    const html = createPostHtml(results.replyTo)
    container.append(html)
  }
  const mainPosthtml = createPostHtml(results.postData, true)
  container.append(mainPosthtml)
  results.replies.forEach(result => {
    const html = createPostHtml(result)
    container.append(html)
  })
}

$('#filePhoto').change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const image = document.querySelector('#imagePreview')
      image.src = e.target.result
      if (cropper !== undefined) cropper.destroy()
      cropper = new Cropper(image, {
        aspectRatio: 1 / 1,
        background: false
      })

    }
    reader.readAsDataURL(this.files[0])
  }
})

$('#coverPhoto').change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const image = document.querySelector('#coverPreview')
      image.src = e.target.result
      if (cropper !== undefined) cropper.destroy()
      cropper = new Cropper(image, {
        aspectRatio: 16 / 9,
        background: false
      })

    }
    reader.readAsDataURL(this.files[0])
  }
})

$('#imageUploadButton').click(() => {
  const canvas = cropper.getCroppedCanvas()
  if (canvas == null) {
    alert('Could not upload image. Make sure it is an image file.')
    return
  }
  canvas.toBlob((blob) => {
    // image or video 的傳輸格式
    const formData = new FormData()
    formData.append('croppedImage', blob)
    $.ajax({
      url: '/api/users/profilePicture',
      type: 'POST',
      data: formData,
      processData: false, //將原本不是xml時會自動將所發送的data轉成字串(String)的功能關掉
      contentType: false, //不加入 head 的 contentType
      success: () => location.reload()
    })
  })
})

$('#coverPhotoButton').click(() => {
  const canvas = cropper.getCroppedCanvas()
  if (canvas == null) {
    alert('Could not upload image. Make sure it is an image file.')
    return
  }
  canvas.toBlob((blob) => {
    // image or video 的傳輸格式
    const formData = new FormData()
    formData.append('croppedImage', blob)
    $.ajax({
      url: '/api/users/coverPhoto',
      type: 'POST',
      data: formData,
      processData: false, //將原本不是xml時會自動將所發送的data轉成字串(String)的功能關掉
      contentType: false, //不加入 head 的 contentType
      success: () => location.reload()
    })
  })
})

$('#userSearchTextBox').keydown((event) => {
  clearTimeout(timer)
  const textBox = $(event.target)
  let value = textBox.val()
  if (value == '' && (event.keyCode == 8 || event.which == 8)) { // .which 是 jQuery 的方法，避免在某些瀏覽器 .keyCode 無效時卡住
    // keycode == 8 delete button
    // remove user from selection by no value and press backspace
    selectedUsers.pop()
    updateSelectedUsersHtml()
    $('.resultsContainer').html('')
    if (selectedUsers.length == 0) {
      $('#createChatButton').prop('disabled', true)
    }
    return
  }
  timer = setTimeout(() => {
    value = textBox.val().trim()
    if (value == '') {
      $('.resultsContainer').html('')
    }
    else {
      searchUsers(value)
    }
  }, 1000)
})

const outputUsers = (results, container) => {
  container.html('')
  results.forEach(result => {
    const html = createUserHtml(result, true)
    container.append(html)
  })
  if (results.length == 0) {
    container.append('<span class="noResult">No Result Found</span>')
  }
}

const createUserHtml = (userData, showFollowButton) => {
  const { profilePic, username, firstName, lastName } = userData
  let followButton = ''
  const isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id)
  const text = isFollowing ? 'Following' : 'Follow'
  const buttonClass = isFollowing ? 'followButton following' : 'followButton'
  if (showFollowButton && userLoggedIn._id != userData._id) {
    followButton = `
    <div class="followButtonContainer">
      <button class="${ buttonClass }" data-user=${ userData._id }>${ text }</button>
    </div>
    `
  }
  return `
  <div class="user">
    <div class="userImageContainer">
      <img src="${ profilePic }" />
    </div>
    <div class="userDetailContainer">
      <div class="header">
        <a href="/profile/${ username }">${ firstName + ' ' + lastName}</a>
        <span class="username">@${username}</span>
      </div>
      </div>
      ${ followButton }
  </div>
  `
}

const searchUsers = (searchTerm) => {
  $.get('/api/users', { search: searchTerm }, results => {
    outputSelectableUsers(results, $('.resultsContainer'))
  })
}

const outputSelectableUsers = (results, container) => {
  container.html('')
  results.forEach(result => {
    if (result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)) {
      // .some() 陣列方法，若查找的項目中至少一項為 true，則返回 true
      return
    }
    const html = createUserHtml(result, false)
    const element = $(html)
    element.click(() => userSelected(result))
    container.append(element)
  })
  if (results.length == 0) {
    container.append('<span class="noResult">No Result Found</span>')
  }
}

const userSelected = (user) => {
  selectedUsers.push(user)
  updateSelectedUsersHtml()
  $('#userSearchTextBox').val('').focus()
  $('.resultsContainer').html('')
  $('#createChatButton').prop('disabled', false)
}

const updateSelectedUsersHtml = () => {
  const elements = []
  selectedUsers.forEach(user => {
    const { firstName, lastName } = user
    const userElement = $(`<span class="selectedUser">${ firstName + ' ' + lastName }</span>`)
    elements.push(userElement)
  })
  $('.selectedUser').remove()
  $('#selectedUsers').prepend(elements) // 放在選中的元素前面
}

$('#createChatButton').click((event) => {
  const data = JSON.stringify(selectedUsers)
  // in ajax request can only send string as data
  $.post('/api/chats', { users: data }, chat => {
    if (!chat || !chat._id) return alert('Invalid response from sever')
    window.location.href = `/messages/${ chat._id }`
  })
})

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