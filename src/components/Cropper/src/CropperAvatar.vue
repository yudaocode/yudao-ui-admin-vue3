<template>
  <div class="user-info-head" @click="open()">
    <el-avatar v-if="sourceValue" :src="sourceValue" alt="avatar" class="img-circle img-lg" />
    <el-avatar v-if="!sourceValue" :src="avatar" alt="avatar" class="img-circle img-lg" />
    <el-button v-if="showBtn" :class="`${prefixCls}-upload-btn`" @click="open()">
      {{ btnText ? btnText : t('cropper.selectImage') }}
    </el-button>
    <CopperModal
      ref="cropperModelRef"
      :srcValue="sourceValue"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>
<script lang="ts" setup>
import { useDesign } from '@/hooks/web/useDesign'

import { propTypes } from '@/utils/propTypes'
import { useI18n } from 'vue-i18n'
import CopperModal from './CopperModal.vue'
import avatar from '@/assets/imgs/avatar.jpg'

defineOptions({ name: 'CropperAvatar' })

const props = defineProps({
  width: propTypes.string.def('200px'),
  value: propTypes.string.def(''),
  showBtn: propTypes.bool.def(true),
  btnText: propTypes.string.def('')
})

const emit = defineEmits(['update:value', 'change'])
const sourceValue = ref(props.value)
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('cropper-avatar')
const message = useMessage()
const { t } = useI18n()

const cropperModelRef = ref()

watchEffect(() => {
  sourceValue.value = props.value
})

watch(
  () => sourceValue.value,
  (v: string) => {
    emit('update:value', v)
  }
)

function handleUploadSuccess({ source, data, filename }) {
  sourceValue.value = source
  emit('change', { source, data, filename })
  message.success(t('cropper.uploadSuccess'))
}

function open() {
  cropperModelRef.value.openModal()
}

function close() {
  cropperModelRef.value.closeModal()
}

defineExpose({
  open,
  close
})
</script>
<style lang="scss" scoped>
$prefix-cls: #{$namespace}--cropper-avatar;

.#{$prefix-cls} {
  display: inline-block;
  text-align: center;

  &-image-wrapper {
    overflow: hidden;
    cursor: pointer;
    border: 1px solid;
    border-radius: 50%;

    img {
      width: 100%;
    }
  }

  &-image-mask {
    position: absolute;
    width: inherit;
    height: inherit;
    cursor: pointer;
    background: rgb(0 0 0 / 40%);
    border: inherit;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.4s;

    ::v-deep(svg) {
      margin: auto;
    }
  }

  &-image-mask:hover {
    opacity: 40;
  }

  &-upload-btn {
    margin: 10px auto;
  }
}

.user-info-head {
  position: relative;
  display: inline-block;
}

.img-circle {
  border-radius: 50%;
}

.img-lg {
  width: 120px;
  height: 120px;
}

.user-info-head:hover::after {
  position: absolute;
  inset: 0;
  font-size: 24px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
  line-height: 110px;
  color: #eee;
  cursor: pointer;
  background: rgb(0 0 0 / 50%);
  border-radius: 50%;
  content: '+';
}
</style>
