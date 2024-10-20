import { defineStore } from 'pinia'
import BaseConversation from '../model/BaseConversation'
import Friend from '../model/Friend'

interface FriendStoreModel {
  friendList: Array<Friend>
  currentFriend: Friend | null
}

export const useFriendStore = defineStore('friendStore', {
  state: (): FriendStoreModel => ({
    friendList: [
      {
        id: '1111',
        name: 'Elon Musk',
        avatar:
          'https://img0.baidu.com/it/u=4211304696,1059959254&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=1174',
        description: 'cool boy',
        createTime: 1695201147622
      },
      {
        id: '2222',
        name: 'Spider Man',
        avatar:
          'https://www.hottoys.com.cn/wp-content/uploads/2019/06/bloggerreview_spiderman_advanced_ben-9.jpg',
        description: 'hero',
        createTime: 1695201147622
      }
    ],
    currentFriend: null
  }),

  getters: {
    getFriendList(state: FriendStoreModel): Array<Friend> {
      return state.friendList
    }
  },

  actions: {
    addFriend(session: BaseConversation) {
      this.friendList.push(session)
    },
    setCurrentFriend(friend: Friend) {
      this.currentFriend = friend
    }
  }
})
