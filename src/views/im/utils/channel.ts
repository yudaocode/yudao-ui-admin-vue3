import { useChannelStore } from '../home/store/channelStore'
import { ImConversationType } from './constants'

/**
 * 构建频道会话描述（type / targetId / name / avatar）
 *
 * 优先用 channelStore 拉到的真实名称 / 头像；本地缓存还没拉到时退化为「频道 N」占位文案。
 * 抽到 utils/channel.ts 后，useMessagePuller / websocketStore 共用同一份占位逻辑，避免多处复制；类似 utils/user.ts 取昵称的工具集。
 */
export const buildChannelConversationStub = (channelId: number) => {
  const channel = useChannelStore().getChannel(channelId)
  return {
    type: ImConversationType.CHANNEL,
    targetId: channelId,
    name: channel?.name || `频道 ${channelId}`,
    avatar: channel?.avatar || ''
  }
}
