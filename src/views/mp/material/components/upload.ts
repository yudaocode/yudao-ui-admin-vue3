import type { UploadProps, UploadRawFile } from 'element-plus'
import { getRefreshToken } from '@/utils/auth'
import { UploadType, useBeforeUpload } from '@/views/mp/hooks/useUpload'

const HEADERS = { Authorization: 'Bearer ' + getRefreshToken() } // 请求头（解决 el-upload 上传过程中，无法刷新令牌的问题）
const UPLOAD_URL = import.meta.env.VITE_BASE_URL + '/admin-api/mp/material/upload-permanent' // 上传地址

interface UploadData {
  type: UploadType
  title: string
  introduction: string
  accountId: number
}

const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) =>
  useBeforeUpload(UploadType.Image, 2)(rawFile)

const beforeVoiceUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) =>
  useBeforeUpload(UploadType.Voice, 2)(rawFile)

const beforeVideoUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) =>
  useBeforeUpload(UploadType.Video, 10)(rawFile)

export {
  HEADERS,
  UPLOAD_URL,
  UploadType,
  UploadData,
  beforeImageUpload,
  beforeVoiceUpload,
  beforeVideoUpload
}
