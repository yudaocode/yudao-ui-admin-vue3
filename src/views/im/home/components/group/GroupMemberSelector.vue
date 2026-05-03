<template>
  <!--
    群成员选择器
    - 左：搜索 + 群成员列表（带 checkbox）
    - 右：已勾选的成员（宫格预览）
    - 确定时 emit complete，抛出选中的成员列表
  -->
  <el-dialog v-model="visible" :title="title" width="700px" :close-on-click-modal="false">
    <div class="flex gap-2.5">
      <div
        class="flex flex-col flex-1 overflow-hidden rounded border border-[var(--el-border-color)]"
      >
        <el-input v-model="searchText" placeholder="搜索" clearable>
          <template #suffix>
            <Icon icon="ant-design:search-outlined" />
          </template>
        </el-input>
        <div class="h-[400px]">
          <PagedScroller :items="showMembers" :page-size="30">
            <template #default="{ item }">
              <GroupMemberItem
                :member="item as GroupMemberFlag"
                :height="46"
                @click="handleToggleCheck(item as GroupMemberFlag)"
              >
                <el-checkbox
                  :model-value="(item as GroupMemberFlag).checked"
                  :disabled="(item as GroupMemberFlag).locked"
                  @click.stop
                  @change="(val: boolean) => handleCheckChange(item as GroupMemberFlag, val)"
                />
              </GroupMemberItem>
            </template>
          </PagedScroller>
        </div>
      </div>

      <div class="flex items-center text-xl text-[#409eff]">
        <Icon icon="ant-design:double-right-outlined" />
      </div>

      <div
        class="flex flex-col flex-1 overflow-hidden rounded border border-[var(--el-border-color)]"
      >
        <div
          class="h-10 pl-2.5 leading-10 text-13px text-[var(--el-text-color-secondary)] border-b border-[var(--el-border-color-lighter)]"
        >
          已勾选 {{ checkedMembers.length }} 位成员
        </div>
        <el-scrollbar class="h-[400px]">
          <div class="flex flex-wrap p-2.5">
            <GroupMemberGrid v-for="m in checkedMembers" :key="m.userId" :member="m" />
          </div>
        </el-scrollbar>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" @click="handleOk">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { CommonStatusEnum } from '@/utils/constants'
import GroupMemberItem from './GroupMemberItem.vue'
import GroupMemberGrid from './GroupMemberGrid.vue'
import PagedScroller from '../PagedScroller.vue'
import type { GroupMemberLite } from './GroupMember.vue'

defineOptions({ name: 'ImGroupMemberSelector' })

/** 选择器内部扩展：加上 checked / locked / hide 标记 */
export interface GroupMemberFlag extends GroupMemberLite {
  checked?: boolean
  locked?: boolean
  hide?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    members?: GroupMemberLite[] // 传入的群成员列表（含 status/avatar 等基础字段）
    checkedIds?: number[] // 默认选中的 userId 列表
    lockedIds?: number[] // 锁定的 userId 列表（不能取消）
    hideIds?: number[] // 隐藏的 userId 列表（不展示）
    maxSize?: number // 最多可选数量，-1 表示不限制
  }>(),
  {
    title: '选择成员',
    members: () => [],
    checkedIds: () => [],
    lockedIds: () => [],
    hideIds: () => [],
    maxSize: -1
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  complete: [members: GroupMemberFlag[]] // 点击"确定"时抛出被勾选的成员列表
}>()

const message = useMessage()

/** 弹窗显隐：把父侧 v-model 转双向计算 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchText = ref('')
const workingMembers = ref<GroupMemberFlag[]>([])

watch(
  visible,
  (v) => {
    if (v) rebuild()
  },
  { immediate: true }
)

/** 重建工作副本：把 checkedIds / lockedIds / hideIds 翻译成每个 member 的 flag */
function rebuild() {
  workingMembers.value = props.members.map((member) => ({
    ...member,
    checked: props.checkedIds.some((id) => id === member.userId),
    locked: props.lockedIds.some((id) => id === member.userId),
    hide: props.hideIds.some((id) => id === member.userId)
  }))
}

/** 当前展示的成员：过滤 hide / DISABLE / 不匹配关键字 */
const showMembers = computed(() =>
  workingMembers.value.filter(
    (member) =>
      !member.hide &&
      member.status !== CommonStatusEnum.DISABLE &&
      member.showName.includes(searchText.value)
  )
)

/** 已勾选成员：右侧宫格预览 + complete 抛参 */
const checkedMembers = computed(() => workingMembers.value.filter((member) => member.checked))

/** 落勾选并校验上限：超过 maxSize 时自动取消并提示，避免出现"勾上但实际不算"的中间态 */
function applyCheck(member: GroupMemberFlag, checked: boolean) {
  member.checked = checked
  if (props.maxSize > 0 && checkedMembers.value.length > props.maxSize) {
    message.error(`最多选择 ${props.maxSize} 位成员`)
    member.checked = false
  }
}

/** 行点击：切换勾选态，locked 的不响应 */
function handleToggleCheck(member: GroupMemberFlag) {
  if (member.locked) {
    return
  }
  applyCheck(member, !member.checked)
}

/** checkbox change：直接落 checked（locked 已由 disabled 拦截） */
function handleCheckChange(member: GroupMemberFlag, checked: boolean) {
  applyCheck(member, checked)
}

/** 确定：把已勾选成员通过 complete 抛给父侧 */
function handleOk() {
  emit('complete', checkedMembers.value)
  visible.value = false
}
</script>
