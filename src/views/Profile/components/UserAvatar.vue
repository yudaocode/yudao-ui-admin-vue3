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
import { updateUserProfile } from '@/api/system/user/profile'
import { CropperAvatar } from '@/components/Cropper'
import { useUserStore } from '@/store/modules/user'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import { UploadRequestOptions } from 'element-plus/es/components/upload/src/upload'
import { generateUUID } from '@/utils'

defineOptions({ name: 'UserAvatar' })

defineProps({
  img: propTypes.string.def('')
})

const userStore = useUserStore()

const cropperRef = ref()
const handelUpload = async ({ data }) => {
  const { httpRequest } = useUpload()
  // 裁剪结果为 PNG Blob，包装为带唯一文件名的 File，避免同日同名的头像相互覆盖
  const file = new File([data], `avatar_${generateUUID()}.png`, { type: data.type })
  const avatar = (
    (await httpRequest({
      file,
      filename: file.name
    } as UploadRequestOptions)) as unknown as { data: string }
  ).data
  await updateUserProfile({ avatar })

  // 关闭弹窗，并更新 userStore
  cropperRef.value.close()
  await userStore.setUserAvatarAction(avatar)
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
