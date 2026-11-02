<script setup lang="ts">
import { useValidator } from '@/hooks/web/useValidator'
import { useDesign } from '@/hooks/web/useDesign'
import { useLockStore } from '@/store/modules/lock'
import avatarImg from '@/assets/imgs/avatar.gif'
import { useUserStore } from '@/store/modules/user'

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('lock-dialog')

const { required } = useValidator()

const { t } = useI18n()

const lockStore = useLockStore()

const props = defineProps({
  modelValue: {
    type: Boolean
  }
})

const userStore = useUserStore()
const avatar = computed(() => userStore.user.avatar || avatarImg)
const userName = computed(() => userStore.user.nickname ?? 'Admin')

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  }
})

const dialogTitle = ref(t('lock.lockScreen'))

const formData = ref({
  password: undefined
})
const formRules = reactive({
  password: [required()]
})

const formRef = ref() // 表单 Ref
const passwordRef = ref() // 密码输入框 Ref
const locking = ref(false) // 锁定处理中，避免连续回车重复执行
const handleLock = async () => {
  if (!formRef.value || locking.value) return
  locking.value = true
  // 校验表单，校验失败时安全退出
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    locking.value = false
    return
  }
  // 提交请求
  dialogVisible.value = false
  lockStore.setLockInfo({
    ...formData.value,
    isLock: true
  })
}

/** 回车锁定；输入法组合输入（确认候选词）与按住重复触发时忽略 */
const handleEnter = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229 || e.repeat) return
  handleLock()
}

/** 弹窗打开动画结束后聚焦密码框（首次挂载与重新打开都会触发） */
const handleOpened = () => {
  locking.value = false
  passwordRef.value?.focus()
}
</script>

<template>
  <Dialog
    v-model="dialogVisible"
    width="500px"
    max-height="170px"
    :class="prefixCls"
    :title="dialogTitle"
    @opened="handleOpened"
  >
    <div class="flex flex-col items-center">
      <img :src="avatar" alt="" class="w-70px h-70px rounded-[50%]" />
      <span class="text-14px my-10px text-[var(--top-header-text-color)]">
        {{ userName }}
      </span>
    </div>
    <!-- 阻止原生 submit 默认动作，避免单输入框回车整页刷新 -->
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px" @submit.prevent>
      <el-form-item :label="t('lock.lockPassword')" prop="password">
        <el-input
          ref="passwordRef"
          type="password"
          v-model="formData.password"
          :placeholder="'请输入' + t('lock.lockPassword')"
          clearable
          show-password
          @keydown.enter="handleEnter"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleLock">{{ t('lock.lock') }}</el-button>
    </template>
  </Dialog>
</template>

<style lang="scss" scoped>
:global(.v-lock-dialog) {
  @media (width <= 767px) {
    max-width: calc(100vw - 16px);
  }
}
</style>
