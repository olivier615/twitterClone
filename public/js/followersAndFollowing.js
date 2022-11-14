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

