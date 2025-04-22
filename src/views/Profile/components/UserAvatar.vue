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
import { useUserStore } from '@/store/modules/user'

// TODO @芋艿：合并到 ProfileUser 组件中，更简洁一点
defineOptions({ name: 'UserAvatar' })

defineProps({
  img: propTypes.string.def('')
})

const userStore = useUserStore()

const cropperRef = ref()
const handelUpload = async ({ data }) => {
  // TODO @芋艿：去掉这个接口，使用 url 直接上传
  const res = await uploadAvatar({ avatarFile: data })
  cropperRef.value.close()
  userStore.setUserAvatarAction(res.data)
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
