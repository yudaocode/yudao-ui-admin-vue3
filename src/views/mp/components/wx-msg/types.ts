export enum MsgType {
  Event = 'event',
  Text = 'text',
  Voice = 'voice',
  Image = 'image',
  Video = 'video',
  Link = 'link',
  Location = 'location',
  Music = 'music',
  News = 'news'
}

export interface User {
  nickname: string
  avatar: string
  accountId: number
}
