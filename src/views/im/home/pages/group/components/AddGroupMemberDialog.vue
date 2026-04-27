<template>
  <!--
    邀请好友入群对话框（对应 boxim group/AddGroupMember.vue）
    - 左：好友列表（带 checkbox）
    - 右：已勾选预览
    - 已在群内的好友标记为 disabled
    - TODO 接入 /im/group/invite
  -->
  <el-dialog
    v-model="visible"
    title="邀请好友"
    width="620px"
    :close-on-click-modal="false"
  >
    <div class="im-add-group-member">
      <div class="im-add-group-member__left">
        <el-input v-model="searchText" placeholder="搜索好友" size="small" clearable>
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-scrollbar class="im-add-group-member__scroll">
          <FriendItem
            v-for="f in shownFriends"
            :key="f.id"
            :friend="f"
            :menu="false"
            :active="false"
            @click="toggleCheck(f)"
          >
            <el-checkbox
              :model-value="f.isCheck"
              :disabled="f.disabled"
              @click.stop
              @change="(v: boolean) => (f.isCheck = v)"
            />
          </FriendItem>
        </el-scrollbar>
      </div>

      <div class="im-add-group-member__arrow">
        <el-icon><DArrowRight /></el-icon>
      </div>

      <div class="im-add-group-member__right">
        <div class="im-add-group-member__tip">已勾选 {{ checkCount }} 位好友</div>
        <el-scrollbar class="im-add-group-member__scroll">
          <FriendItem
            v-for="f in checkedFriends"
            :key="f.id"
            :friend="f"
            :menu="false"
            :active="false"
          />
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

import FriendItem, { type FriendLite } from '../../friend/components/FriendItem.vue'
import type { GroupMemberLite } from '../../chat/components/ChatGroupMember.vue'

defineOptions({ name: 'ImAddGroupMemberDialog' })

interface FriendCheckable extends FriendLite {
  isCheck?: boolean
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    groupId?: string | number
    /** 本群现有成员，用来判断好友是否已在群里 */
    members?: GroupMemberLite[]
    /** 全量好友（由调用方从 friendStore 传入） */
    friends?: FriendLite[]
  }>(),
  {
    members: () => [],
    friends: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 邀请完成，携带被邀请的好友 id 列表 */
  reload: [friendIds: (string | number)[]]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const searchText = ref('')
const friends = ref<FriendCheckable[]>([])

watch(
  visible,
  (v) => {
    if (!v) return
    friends.value = props.friends
      .filter((f) => !f.deleted)
      .map((f) => {
        const inGroup = props.members.some(
          (m) => !m.quit && String(m.userId) === String(f.id)
        )
        return {
          ...f,
          disabled: inGroup,
          isCheck: inGroup
        }
      })
  },
  { immediate: true }
)

const shownFriends = computed(() =>
  friends.value.filter((f) => f.nickName.includes(searchText.value))
)

const checkedFriends = computed(() =>
  friends.value.filter((f) => f.isCheck && !f.disabled)
)

const checkCount = computed(() => checkedFriends.value.length)

function toggleCheck(f: FriendCheckable) {
  if (!f.disabled) f.isCheck = !f.isCheck
}

// TODO 接入 /im/group/invite
async function handleOk() {
  const ids = checkedFriends.value.map((f) => f.id)
  if (ids.length === 0) {
    ElMessage.warning('请选择至少一个好友')
    return
  }
  ElMessage.info('邀请入群接口待接入，当前为占位实现')
  emit('reload', ids)
  visible.value = false
}
</script>

<style scoped>
.im-add-group-member {
  display: flex;
  gap: 10px;
}

.im-add-group-member__left,
.im-add-group-member__right {
  display: flex;
  flex-direction: column;
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.im-add-group-member__scroll {
  height: 400px;
}

.im-add-group-member__arrow {
  display: flex;
  align-items: center;
  font-size: 18px;
  color: #409eff;
}

.im-add-group-member__tip {
  height: 40px;
  padding-left: 10px;
  line-height: 40px;
  font-size: 13px;
  color: #909399;
  border-bottom: 1px solid #f0f2f5;
}
</style>
