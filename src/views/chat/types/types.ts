import BaseConversation from '../model/BaseConversation'
import BaseMessage from '../model/BaseMessage'
import { ChatConversation } from '../model/ChatConversation'
import ImageMessage from '../model/ImageMessage'
import TextMessage from '../model/TextMessage'

export enum MessageRole {
  SELF = 1,
  SYSTEM = 2,
  OTHER = 3
}

export enum SendStatus {
  FAILURE = 1,
  SENDING = 2,
  SUCCESS = 3
}

export enum ContentType {
  TEXT = 101,
  IMAGE = 102,
  AUDIO = 103,
  SYSTEM = 1400
}

export const enum MENU_LIST_ENUM {
  CONVERSATION = 1,
  FRIENDS = 2
}

export const enum CONVERSATION_TYPE {
  SINGLE = 1,
  GROUP = 3,
  NOTIFICATION = 4
}

export enum WEBSOCKET_MESSAGE_TYPE_ENUM {
  IM_MESSAGE_RECEIVE = 'im-message-receive'
}


export type MessageModelType = BaseMessage | TextMessage | ImageMessage
export type ConversationModelType = BaseConversation | ChatConversation
export type ConversationType = CONVERSATION_TYPE

export type ImMessageReceiveResponse = {
  type: WEBSOCKET_MESSAGE_TYPE_ENUM
  content: string
};

export type ImMessageContent = {
  id: number;
  conversationType: number;
  senderId: number;
  senderNickname: string;
  senderAvatar: string;
  receiverId: number;
  contentType: number;
  content: string;
  sendTime: number; // Use `Date` if you'd prefer the time to be a `Date` object
  sequence: number;
}
