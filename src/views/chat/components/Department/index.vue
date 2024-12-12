<template>
  <view class="flex flex-col items-left h-full py-2 b-1 b-gray b-solid" style="width: 248px; min-width: 248px">
    <!-- <view v-for="item in departListState.list" class="w-full  justify-left custom-hover border-b-gray border-1" :key="item.id" style="height: 70px;">
      <ElAvatar shape="square">{{ item.name.substring(0,1) }}</ElAvatar>
      <view class="text-size-sm ml-1">{{ item.name }}</view>
    </view> -->
    
    <el-skeleton animated  :loading="state.loading" :throttle="{ leading: 500, initVal: true, trailing: 500 }"
    >
      <template #template>
        <div v-for="item in 12" :key="item" class="flex flex-1 mx-2 my-3">
          <el-skeleton-item animated variant="rect" style="width: 50px; height: 50px; max-width: 50px;" />
          <div class="mx-2 flex flex-1 flex-col mt-2">
            <el-skeleton-item animated variant="rect" style="height: 10px;" />
            <el-skeleton-item animated variant="rect" style="height: 10px;" class="mt-3" />
          </div>
        </div>
      </template>
      <template #default>
        <div class="w-full h-full">
          <TreeView :hierarchy="useFriendStore.departmentList" @tree-click="handleNodeClick" />
        </div>
      </template>
    </el-skeleton>
    
    <view
      v-if="useFriendStore.departmentList.length === 0 && !state.loading"
      class="flex justify-center items-center h-full">No data</view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import TreeView from './components/TreeView.vue'
import { useFriendStoreWithOut } from '../../store/friendstore';


defineOptions({ name: 'Department' })
const useFriendStore = useFriendStoreWithOut()
const { fetchDepartment, setCurrentDepartmentId, fetchDeptUser } = useFriendStore

const state = reactive({
  loading: true
})

onMounted(() => {
  fetchDepartment()
})

watch(() => useFriendStore.departmentList, () => {
    setTimeout(() => {
      state.loading = false
    }, 1000);
})

const handleNodeClick = (data: Tree) => {
  setCurrentDepartmentId(data.id)
  fetchDeptUser(data.id)
}



</script>
