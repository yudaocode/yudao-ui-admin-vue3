import request from '@/config/axios'

export interface MailFolderVO {
  key: string // 目录查询标识
  name: string // 显示名称
  unreadCount: number // 未读数量
}

// 获得文件夹列表
export const getMailFolderList = (accountId: number) => {
  return request.get<MailFolderVO[]>({ url: '/oa/mail-folder/list', params: { accountId } })
}
