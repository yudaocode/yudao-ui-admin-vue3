enum ReplyType {
  News = 'news',
  Image = 'image',
  Voice = 'voice',
  Video = 'video',
  Music = 'music',
  Text = 'text'
}

interface _Reply {
  accountId: number
  type: ReplyType
  name?: string | null
  content?: string | null
  mediaId?: string | null
  url?: string | null
  title?: string | null
  description?: string | null
  thumbMediaId?: string | null
  thumbMediaUrl?: string | null
  musicUrl?: string | null
  hqMusicUrl?: string | null
  introduction?: string | null
  articles?: any[]
}

type Reply = _Reply //Partial<_Reply>

enum NewsType {
  Published = '1',
  Draft = '2'
}

/** 利用旧的reply[accountId, type]初始化新的Reply */
const createEmptyReply = (old: Reply | Ref<Reply>): Reply => {
  return {
    accountId: unref(old).accountId,
    type: unref(old).type,
    name: null,
    content: null,
    mediaId: null,
    url: null,
    title: null,
    description: null,
    thumbMediaId: null,
    thumbMediaUrl: null,
    musicUrl: null,
    hqMusicUrl: null,
    introduction: null,
    articles: []
  }
}

export { Reply, NewsType, ReplyType, createEmptyReply }
