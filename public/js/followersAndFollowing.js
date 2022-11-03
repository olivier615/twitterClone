$(document).ready(() => {
  if (selectedTab === 'followers') {
    loadFollowers()
  }
  else {
    loadFollowing()
  }
})
// 這邊的 selectedTab 是 pug 宣告的變數，不是 javascript 的變數 profilePage.pug 9 行

const loadFollowers = () => {
  // profileUserId 是利用 pug 宣告的環境變數
  // 在 profilePage.pug 7-8 行
  $.get(`/api/users/${ profileUserId }/followers`, results => {
    outputUsers(results.followers, $('.resultsContainer'))
  })
}

const loadFollowing = () => {
  $.get(`/api/users/${ profileUserId }/following`, results => {
    outputUsers(results.following, $('.resultsContainer'))
  })
}

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