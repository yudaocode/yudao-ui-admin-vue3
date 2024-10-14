import type { UploadProps, UploadRawFile } from 'element-plus'
import { getAccessToken } from '@/utils/auth'
import { UploadType, useBeforeUpload } from '@/views/mp/hooks/useUpload'

const HEADERS = { Authorization: 'Bearer ' + getAccessToken() } // 请求头
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
