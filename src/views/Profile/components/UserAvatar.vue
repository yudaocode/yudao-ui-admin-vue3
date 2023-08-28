<template>
  <div class="change-avatar">
    <CropperAvatar
      ref="cropperRef"
      :btnProps="{ preIcon: 'ant-design:cloud-upload-outlined' }"
      :showBtn="false"
      :value="img"
      width="120px"
      @change="handelUpload"
    />
  </div>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { uploadAvatar } from '@/api/system/user/profile'
import { CropperAvatar } from '@/components/Cropper'

defineOptions({ name: 'UserAvatar' })

defineProps({
  img: propTypes.string.def('')
})

const cropperRef = ref()
const handelUpload = async ({ data }) => {
  await uploadAvatar({ avatarFile: data })
  cropperRef.value.close()
}
</script>

<style lang="scss" scoped>
.change-avatar {
  img {
    display: block;
    margin-bottom: 15px;
    border-radius: 50%;
  }
}
</style>
