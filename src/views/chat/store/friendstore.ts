import { defineStore } from 'pinia'
import { store } from '@/store/index'
import BaseConversation from '../model/BaseConversation'
import Friend from '../model/Friend'
import { getAllUser, getDeptUser } from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'

interface FriendStoreModel {
  friendList: Array<Friend>
  currentFriend: Friend | null,
  selectedDepartmentId: number,
  departmentList: DeptApi.DeptVO[]
}

export const useFriendStore = defineStore('friendStore', {
  state: (): FriendStoreModel => ({
    friendList: [],
    currentFriend: null,
    selectedDepartmentId: 0,
    departmentList: []
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
    },
    setCurrentDepartmentId(id: number) {
      this.selectedDepartmentId = id
    },
    resetFriendList() {
      this.friendList = []
      this.currentFriend = null
    },
    async fetchDepartment () {
      try {
        const result = await DeptApi.getSimpleDeptList()
        this.departmentList = this.buildHierarchy(result)
      } catch (e) {
        console.log(e)
      }
    },

    async fetchFriend() {

      try {
        const res  = await getAllUser()
        this.friendList = res

      } catch (error) {
        console.error(error)
      }
    },

    async fetchDeptUser(id) {

      try {
        const res = await getDeptUser(id)
        if (res) {
          this.friendList = res.map(item =>  {
            return {
              ...item,
              name: item.nickname
            }
          })
        } else {
          this.friendList = []
        }
   

      } catch (error) {
        console.error(error)
      }
    },
    
     buildHierarchy(data: DeptApi.DeptVO[]): DeptApi.DeptVO[] {
      const map = new Map<number, DeptApi.DeptVO>();
  
      // 初始化 map，确保每个 id 都有一条记录
      data.forEach(item => map.set(item.id, { ...item, children: [] }));
  
      const result: DeptApi.DeptVO[] = [];
  
      data.forEach(item => {
          if (item.parentId === 0) {
              // 根节点
              result.push(map.get(item.id)!);
          } else {
              // 子节点，放入父节点的 children 数组
              const parent = map.get(item.parentId);
              if (parent) {
                  parent.children!.push(map.get(item.id)!);
              }
          }
      });
  
      return result;
  }
  }
})


export const useFriendStoreWithOut = () => {
  return useFriendStore(store)
}