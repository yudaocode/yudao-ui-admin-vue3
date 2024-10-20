/*
 * @Author: dylan.may@qq.com
 * @Date: 2024-10-16 11:30:31
 * @Last Modified by: dylan.may@qq.com
 * @Last Modified time: 2024-10-16 16:01:25
 */

import request from '@/config/axios'
import { ChatConversation } from '../model/ChatConversation'

/**
 * 会话接口
 */
export default class SessionApi {
  /**
   * 获取会话列表
   * @returns Promise<Array<ChatConversation>>
   */
  static getSessionList(): Promise<Array<ChatConversation>> {
    return request.get({ url: '/im/conversation/list' })
  }
}
