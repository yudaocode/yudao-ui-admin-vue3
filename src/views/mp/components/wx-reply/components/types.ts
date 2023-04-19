type ReplyType = '' | 'news' | 'image' | 'voice' | 'video' | 'music' | 'text'

interface ObjData {
  accountId: number
  type: ReplyType
  name: string | null
  content: string | null
  mediaId: string | null
  url: string | null
  title: string | null
  description: string | null
  thumbMediaId: string | null
  thumbMediaUrl: string | null
  musicUrl: string | null
  hqMusicUrl: string | null
  introduction: string | null
  articles: any[]
}

enum NewsType {
  Published = '1',
  Draft = '2'
}

export { ObjData, NewsType }
