<template>
  <!-- 角色卡片：宽屏一行两个，窄屏一行一个 -->
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-20px relative h-full overflow-auto pb-140px pr-20px content-start"
    ref="tabsRef"
    @scroll="handleTabsScroll"
  >
    <div v-for="role in roleList" :key="role.id" class="min-w-0">
      <el-card
        class="rounded-10px relative"
        body-class="pt-15px px-15px pb-10px flex flex-row justify-start relative"
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
        <div class="shrink-0">
          <img class="w-40px h-40px rounded-10px overflow-hidden" :src="role.avatar" />
        </div>
        <div class="ml-10px min-w-0 flex-1">
          <div class="h-85px">
            <div
              class="text-18px font-bold truncate pr-24px"
              style="color: var(--el-text-color-primary)"
              :title="role.name"
            >
              {{ role.name }}
            </div>
            <div
              class="mt-10px text-14px line-clamp-2 break-all"
              style="color: var(--el-text-color-regular)"
              :title="role.description"
            >
              {{ role.description }}
            </div>
          </div>
          <!-- 引用的技能：只读展示名称，悬停查看描述 -->
          <div v-if="getRoleSkills(role).length" class="flex flex-wrap gap-4px mt-4px">
            <el-tooltip
              v-for="skill in getRoleSkills(role)"
              :key="skill.id"
              :content="`${skill.name}：${skill.description}`"
              popper-class="max-w-300px"
              placement="top"
            >
              <span
                class="max-w-full truncate rounded-4px px-6px text-12px leading-20px bg-[var(--el-fill-color-light)] text-[var(--el-text-color-regular)]"
              >
                {{ skill.name }}
              </span>
            </el-tooltip>
          </div>
          <div class="flex flex-row-reverse mt-6px">
            <el-button type="primary" size="small" @click="handleUseClick(role)">使用</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatRoleVO } from '@/api/ai/model/chatRole'
import { SkillApi, SkillVO } from '@/api/ai/skill'
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

/** 技能：只包含启用的技能，已停用、删除的技能不展示 */
const skillList = ref<SkillVO[]>([])
const getRoleSkills = (role: ChatRoleVO) => {
  return skillList.value.filter((skill) => role.skillIds?.includes(skill.id!))
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

/** 初始化 */
onMounted(async () => {
  skillList.value = await SkillApi.getSkillSimpleList()
})
</script>
