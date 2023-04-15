import type { UploadProps, UploadRawFile } from 'element-plus'
import { getAccessToken } from '@/utils/auth'
const message = useMessage() // 消息
const HEADERS = { Authorization: 'Bearer ' + getAccessToken() } // 请求头
// const UPLOAD_URL = 'http://127.0.0.1:8000/upload/' // 上传地址
const UPLOAD_URL = import.meta.env.VITE_BASE_URL + '/admin-api/mp/material/upload-permanent' // 上传地址

enum MaterialType {
  Image = 'image',
  Voice = 'voice',
  Video = 'video'
}

interface UploadData {
  type: MaterialType
  title: string
  introduction: string
}

const beforeUpload = (rawFile: UploadRawFile, materialType: MaterialType): boolean => {
  let allowTypes: string[] = []
  let maxSizeMB = 0
  let name = ''
  switch (materialType) {
    case MaterialType.Image:
      allowTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/jpg']
      maxSizeMB = 2
      name = '图片'
      break
    case MaterialType.Voice:
      allowTypes = ['audio/mp3', 'audio/mpeg', 'audio/wma', 'audio/wav', 'audio/amr']
      maxSizeMB = 2
      name = '图片'
      break
    case MaterialType.Video:
      allowTypes = ['video/mp4']
      maxSizeMB = 10
      name = '视频'
      break
  }
  // 格式不正确
  if (!allowTypes.includes(rawFile.type)) {
    message.error(`上传${name}格式不对!`)
    return false
  }
  // 大小不正确
  if (rawFile.size / 1024 / 1024 > maxSizeMB) {
    message.error(`上传${name}大小不能超过${maxSizeMB}M!`)
    return false
  }
  return true
}

const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) =>
  beforeUpload(rawFile, MaterialType.Image)

const beforeVoiceUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) =>
  beforeUpload(rawFile, MaterialType.Voice)

const beforeVideoUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) =>
  beforeUpload(rawFile, MaterialType.Video)

export {
  HEADERS,
  UPLOAD_URL,
  MaterialType,
  UploadData,
  beforeImageUpload,
  beforeVoiceUpload,
  beforeVideoUpload
}
