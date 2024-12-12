/*
 * @Author: dylan.may@qq.com
 * @Date: 2024-10-16 11:30:31
 * @Last Modified by: dylan.may@qq.com
 * @Last Modified time: 2024-11-28 17:32:26
 */

import request from '@/config/axios'
import { ChatConversation } from '../model/ChatConversation'

interface createConversationParam {
  targetId: string, 
  type: number
}

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

  
  /**
   * 创建会话
   * @param data createConversationParam
   * @returns Promise<ChatConversation>
   */
  static createConversation(data: createConversationParam):Promise<ChatConversation> {
    return request.post({
      url: '/im/conversation/create',
      data
    })
  }
}
