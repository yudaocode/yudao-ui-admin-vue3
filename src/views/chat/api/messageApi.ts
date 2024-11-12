/*
 * @Author: dylan.may@qq.com
 * @Date: 2024-10-16 11:30:31
 * @Last Modified by: dylan.may@qq.com
 * @Last Modified time: 2024-10-16 16:01:25
 */

import request from '@/config/axios'
import { MessageModelType } from '../types/types'

export interface SendMsg {
  clientMessageId: string
  receiverId: number
  conversationType: number
  contentType: number
  content: string
}

export interface SessionMsgReq {
  sendTime: string
  receiverId: number
  userId: number
  conversationType: number
}

/**
 * 消息接口
 */
export default class MessageApi {
  /**
   * 发送消息
   * @param data SendMsg
   * @returns Promise<{ id: number; sendTime: number }>
   */
  static send(data: SendMsg): Promise<{ id: number; sendTime: number }> {
    return request.post({ url: '/im/message/send', data })
  }

  /**
   * 获取会话消息
   * @param data SessionMsgReq
   * @returns Promise<Array<MessageModelType>>
   */
  static getSessionMsg(params: SessionMsgReq): Promise<Array<MessageModelType>> {
    return request.get({ url: '/im/message/list', params })
  }

  /**
   * 获取所有消息
   * @param data { sequence: number; size: number }
   * @returns Promise<Array<MessageModelType>>
   */
  static getMessageForAllSession(params: {
    sequence: number
    size: number
  }): Promise<Array<MessageModelType>> {
    return request.get({ url: '/im/message/pull', params })
  }
}
