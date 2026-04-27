<template>
  <!--
    群成员选择器（对应 boxim group/GroupMemberSelector.vue）
    - 左：搜索 + 群成员列表（带 checkbox）
    - 右：已勾选的成员（宫格预览）
    - 确定时 emit complete，抛出选中的成员列表
  -->
  <el-dialog
    v-model="visible"
    :title="title"
    width="700px"
    :close-on-click-modal="false"
  >
    <div class="im-group-member-selector">
      <div class="im-group-member-selector__left">
        <el-input v-model="searchText" placeholder="搜索" clearable>
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="im-group-member-selector__scroll">
          <PagedScroller :items="showMembers" :page-size="30">
            <template #default="{ item }">
              <GroupMemberItem
                :member="(item as GroupMemberFlag)"
                :height="46"
                @click="toggleCheck(item as GroupMemberFlag)"
              >
                <el-checkbox
                  :model-value="(item as GroupMemberFlag).checked"
                  :disabled="(item as GroupMemberFlag).locked"
                  @click.stop
                  @change="(val: boolean) => onCheckChange(item as GroupMemberFlag, val)"
                />
              </GroupMemberItem>
            </template>
          </PagedScroller>
        </div>
      </div>

      <div class="im-group-member-selector__arrow">
        <el-icon><DArrowRight /></el-icon>
      </div>

      <div class="im-group-member-selector__right">
        <div class="im-group-member-selector__tip">已勾选 {{ checkedMembers.length }} 位成员</div>
        <el-scrollbar class="im-group-member-selector__scroll">
          <div class="im-group-member-selector__grid">
            <GroupMemberGrid
              v-for="m in checkedMembers"
              :key="m.userId"
              :member="m"
            />
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
import { Search, DArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import GroupMemberItem from './GroupMemberItem.vue'
import GroupMemberGrid from './GroupMemberGrid.vue'
import PagedScroller from '../../../components/PagedScroller.vue'
import type { GroupMemberLite } from '../../chat/components/ChatGroupMember.vue'

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
    /** 传入的群成员列表（已经有 quit/headImage 等基础字段） */
    members?: GroupMemberLite[]
    /** 默认选中的 userId 列表 */
    checkedIds?: (string | number)[]
    /** 锁定的 userId 列表（不能取消） */
    lockedIds?: (string | number)[]
    /** 隐藏的 userId 列表（不展示） */
    hideIds?: (string | number)[]
    /** 最多可选数量，-1 表示不限制 */
    maxSize?: number
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
  /** 点击"确定"时抛出被勾选的成员列表 */
  complete: [members: GroupMemberFlag[]]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
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

function rebuild() {
  workingMembers.value = props.members.map((m) => ({
    ...m,
    checked: props.checkedIds.some((id) => String(id) === String(m.userId)),
    locked: props.lockedIds.some((id) => String(id) === String(m.userId)),
    hide: props.hideIds.some((id) => String(id) === String(m.userId))
  }))
}

const showMembers = computed(() =>
  workingMembers.value.filter(
    (m) => !m.hide && !m.quit && m.showNickName.includes(searchText.value)
  )
)

const checkedMembers = computed(() => workingMembers.value.filter((m) => m.checked))

function toggleCheck(m: GroupMemberFlag) {
  if (m.locked) return
  m.checked = !m.checked
  if (props.maxSize > 0 && checkedMembers.value.length > props.maxSize) {
    ElMessage.error(`最多选择 ${props.maxSize} 位成员`)
    m.checked = false
  }
}

function onCheckChange(m: GroupMemberFlag, val: boolean) {
  m.checked = val
  if (props.maxSize > 0 && checkedMembers.value.length > props.maxSize) {
    ElMessage.error(`最多选择 ${props.maxSize} 位成员`)
    m.checked = false
  }
}

function handleOk() {
  emit('complete', checkedMembers.value)
  visible.value = false
}
</script>

<style scoped>
.im-group-member-selector {
  display: flex;
  gap: 10px;
}

.im-group-member-selector__left,
.im-group-member-selector__right {
  display: flex;
  flex-direction: column;
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.im-group-member-selector__scroll {
  height: 400px;
}

.im-group-member-selector__arrow {
  display: flex;
  align-items: center;
  font-size: 20px;
  color: #409eff;
}

.im-group-member-selector__tip {
  height: 40px;
  padding-left: 10px;
  line-height: 40px;
  font-size: 13px;
  color: #909399;
  border-bottom: 1px solid #f0f2f5;
}

.im-group-member-selector__grid {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
}
</style>
