interface NewsItem {
  title: string
  thumbMediaId: string
  author: string
  digest: string
  showCoverPic: string
  content: string
  contentSourceUrl: string
  needOpenComment: string
  onlyFansCanComment: string
  thumbUrl: string
}

interface NewsItemList {
  newsItem: NewsItem[]
}

interface Article {
  mediaId: string
  content: NewsItemList
  updateTime: number
}

const createEmptyNewsItem = (): NewsItem => {
  return {
    title: '',
    thumbMediaId: '',
    author: '',
    digest: '',
    showCoverPic: '',
    content: '',
    contentSourceUrl: '',
    needOpenComment: '',
    onlyFansCanComment: '',
    thumbUrl: ''
  }
}

export type { Article, NewsItem, NewsItemList }
export { createEmptyNewsItem }
