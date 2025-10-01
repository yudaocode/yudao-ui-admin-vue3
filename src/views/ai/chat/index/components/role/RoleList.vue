<template>
  <div
    class="flex flex-row flex-wrap relative h-full overflow-auto pb-140px items-start content-start justify-start"
    ref="tabsRef"
    @scroll="handleTabsScroll"
  >
    <div v-for="role in roleList" :key="role.id">
      <el-card
        class="inline-block mr-20px rounded-10px mb-20px relative"
        body-class="max-w-240px w-240px pt-15px px-15px pb-10px flex flex-row justify-start relative"
      >
        <!-- 更多操作 -->
        <div class="absolute top-0 right-12px" v-if="showMore">
          <el-dropdown @command="handleMoreClick">
            <span class="el-dropdown-link">
              <el-button type="text">
                <el-icon><More /></el-icon>
              </el-button>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="['edit', role]">
                  <Icon icon="ep:edit" color="var(--el-text-color-placeholder)" />编辑
                </el-dropdown-item>
                <el-dropdown-item :command="['delete', role]" style="color: var(--el-color-danger)">
                  <Icon icon="ep:delete" color="var(--el-color-danger)" />删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <!-- 角色信息 -->
        <div>
          <img class="w-40px h-40px rounded-10px overflow-hidden" :src="role.avatar" />
        </div>
        <div class="ml-10px w-full">
          <div class="h-85px">
            <div class="text-18px font-bold" style="color: var(--el-text-color-primary)">
              {{ role.name }}
            </div>
            <div class="mt-10px text-14px" style="color: var(--el-text-color-regular)">
              {{ role.description }}
            </div>
          </div>
          <div class="flex flex-row-reverse mt-2px">
            <el-button type="primary" size="small" @click="handleUseClick(role)">使用</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatRoleVO } from '@/api/ai/model/chatRole'
import { PropType, ref } from 'vue'
import { More } from '@element-plus/icons-vue'

const tabsRef = ref<any>() // tabs ref

// 定义属性
const props = defineProps({
  loading: {
    type: Boolean,
    required: true
  },
  roleList: {
    type: Array as PropType<ChatRoleVO[]>,
    required: true
  },
  showMore: {
    type: Boolean,
    required: false,
    default: false
  }
})

// 定义钩子
const emits = defineEmits(['onDelete', 'onEdit', 'onUse', 'onPage'])

/** 操作：编辑、删除 */
const handleMoreClick = async (data) => {
  const type = data[0]
  const role = data[1]
  if (type === 'delete') {
    emits('onDelete', role)
  } else {
    emits('onEdit', role)
  }
}

/** 选中 */
const handleUseClick = (role: any) => {
  emits('onUse', role)
}

/** 滚动 */
const handleTabsScroll = async () => {
  if (tabsRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = tabsRef.value
    if (scrollTop + clientHeight >= scrollHeight - 20 && !props.loading) {
      emits('onPage')
    }
  }
}
</script>
