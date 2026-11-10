<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { useConfigGlobal } from '@/hooks/web/useConfigGlobal'
import type { ZxcvbnResult } from '@zxcvbn-ts/core'
import { zxcvbn } from '@zxcvbn-ts/core'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'InputPassword' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('input-password')

const props = defineProps({
  // 是否显示密码强度
  strength: propTypes.bool.def(false),
  modelValue: propTypes.string.def('')
})

watch(
  () => props.modelValue,
  (val: string) => {
    if (val === unref(valueRef)) return
    valueRef.value = val
  }
)

const { configGlobal } = useConfigGlobal()

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()

// 传给 ElInput 的 type：显式传入的 type，默认 password。
// 按 ElInput 的优先级，showPassword 开启时原生 input 的 type 由显隐状态决定（password / text），
// 此值仅在 showPassword 关闭时决定原生 type（同时传 type="email" 与 showPassword 时为 password，切换显示后为 text）
const getInputType = () => (attrs.type as string | undefined) ?? 'password'

// 密码显隐：采用 ElInput 内置 showPassword（禁用、空值时不显示，原生状态与指针，不占用 suffix 插槽）；
// 显式传入的 showPassword / show-password 决定是否开启（空字符串视为 true），未传入时仅 type 为 password 才开启
const getShowPassword = () => {
  const value = attrs.showPassword ?? attrs['show-password']
  if (value === undefined) return getInputType() === 'password'
  return value !== false
}

// 输入框的值
const valueRef = ref(props.modelValue)

// 监听
watch(
  () => valueRef.value,
  (val: string) => {
    emit('update:modelValue', val)
  }
)

// 获取密码强度
const getPasswordStrength = computed(() => {
  const value = unref(valueRef)
  const zxcvbnRef = zxcvbn(unref(valueRef)) as ZxcvbnResult
  return value ? zxcvbnRef.score : -1
})
</script>

<template>
  <div :class="[prefixCls, `${prefixCls}--${configGlobal?.size}`]">
    <ElInput
      v-model="valueRef"
      v-bind="$attrs"
      :show-password="getShowPassword()"
      :type="getInputType()"
    />
    <div
      v-if="strength"
      :class="`${prefixCls}__bar`"
      class="relative mb-6px ml-auto mr-auto mt-10px h-6px"
    >
      <div :class="`${prefixCls}__bar--fill`" :data-score="getPasswordStrength"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-input-password;

.#{$prefix-cls} {
  :deep(.#{$elNamespace}-input__clear) {
    margin-left: 5px;
  }

  &__bar {
    background-color: var(--el-text-color-disabled);
    border-radius: var(--el-border-radius-base);

    &::before,
    &::after {
      position: absolute;
      z-index: 10;
      display: block;
      width: 20%;
      height: inherit;
      background-color: transparent;
      border-color: var(--el-color-white);
      border-style: solid;
      border-width: 0 5px;
      content: '';
    }

    &::before {
      left: 20%;
    }

    &::after {
      right: 20%;
    }

    &--fill {
      position: absolute;
      width: 0;
      height: inherit;
      background-color: transparent;
      border-radius: inherit;
      transition:
        width 0.5s ease-in-out,
        background 0.25s;

      &[data-score='0'] {
        width: 20%;
        background-color: var(--el-color-danger);
      }

      &[data-score='1'] {
        width: 40%;
        background-color: var(--el-color-danger);
      }

      &[data-score='2'] {
        width: 60%;
        background-color: var(--el-color-warning);
      }

      &[data-score='3'] {
        width: 80%;
        background-color: var(--el-color-success);
      }

      &[data-score='4'] {
        width: 100%;
        background-color: var(--el-color-success);
      }
    }
  }

  &--mini > &__bar {
    border-radius: var(--el-border-radius-small);
  }
}
</style>
