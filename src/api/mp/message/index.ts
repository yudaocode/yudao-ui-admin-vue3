import request from '@/config/axios'

/** 公众号图文消息的文章 VO */
export interface MpMessageArticleVO {
  title?: string // 标题
  url?: string // 跳转链接
  picUrl?: string // 图片链接
  thumbUrl?: string // 缩略图链接
}

/** 公众号消息 VO */
export interface MpMessageVO {
  id: number // 编号
  userId: number // 公众号粉丝编号
  openid: string // 公众号粉丝标识
  type: string // 消息类型
  sendFrom: number // 发送方：1 粉丝，2 公众号
  createTime: Date // 发送时间
  content?: string // 文本消息内容
  event?: string // 事件类型
  eventKey?: string // 事件 Key
  mediaUrl?: string // 媒体文件地址
  recognition?: string // 语音识别后的文本
  url?: string // 链接消息的地址
  title?: string // 标题
  description?: string // 描述
  thumbMediaUrl?: string // 缩略图地址
  musicUrl?: string // 音乐链接
  hqMusicUrl?: string // 高质量音乐链接
  locationX?: number // 纬度
  locationY?: number // 经度
  label?: string // 地名
  articles?: MpMessageArticleVO[] // 图文消息的文章数组
}

// 获得公众号消息分页
export const getMessagePage = (query: PageParam) => {
  return request.get({
    url: '/mp/message/page',
    params: query
  })
}

// 给粉丝发送消息
export const sendMessage = (data) => {
  return request.post({
    url: '/mp/message/send',
    data: data
  })
}
