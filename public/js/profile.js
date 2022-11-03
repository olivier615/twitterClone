$(document).ready(() => {
  if (selectedTab === 'replies') {
    loadReplies()
  }
  else {
    loadPosts()
  }
})
// 這邊的 selectedTab 是 pug 宣告的變數，不是 javascript 的變數 profilePage.pug 9 行

const loadPosts = () => {
  // profileUserId 是利用 pug 宣告的環境變數
  // 在 profilePage.pug 7-8 行
  // 先找出 pinned: true 因為 pinnedPost 會放在最上方
  $.get('/api/posts', { postedBy: profileUserId, pinned: true }, results => {
    outputPinnedPosts(results, $('.pinnedPostContainer'))
  })
  $.get('/api/posts', { postedBy: profileUserId, isReply: false }, results => {
    // 這邊的夾在中間的物件就是 query，應用於 post.js 的 12 行
    outputPosts(results, $('.postContainer'))
  })
}

const loadReplies = () => {
  $.get('/api/posts', { postedBy: profileUserId, isReply: true }, results => {
    outputPosts(results, $('.postContainer'))
  })
}