import * as FileApi from '@/api/infra/file'
import CryptoJS from 'crypto-js'
import { UploadRawFile, UploadRequestOptions } from 'element-plus/es/components/upload/src/upload'
import axios from 'axios'

export const useUpload = () => {
  // 后端上传地址
  const uploadUrl = import.meta.env.VITE_UPLOAD_URL
  // 是否使用前端直连上传
  const isClientUpload = UPLOAD_TYPE.CLIENT === import.meta.env.VITE_UPLOAD_TYPE
  // 重写ElUpload上传方法
  const httpRequest = async (options: UploadRequestOptions) => {
    // 模式一：前端上传
    if (isClientUpload) {
      // 1.1 生成文件名称
      const fileName = await generateFileName(options.file)
      // 1.2 获取文件预签名地址
      const presignedInfo = await FileApi.getFilePresignedUrl(fileName)
      // 1.3 上传文件（不能使用 ElUpload 的 ajaxUpload 方法的原因：其使用的是 FormData 上传，Minio 不支持）
      return axios.put(presignedInfo.uploadUrl, options.file, {
        headers: {
          'Content-Type': options.file.type,
        }
      }).then(() => {
        // 1.4. 记录文件信息到后端（异步）
        createFile(presignedInfo, fileName, options.file)
        // 通知成功，数据格式保持与后端上传的返回结果一致
        return { data: presignedInfo.url }
      })
    } else {
      // 模式二：后端上传
      // 重写 el-upload httpRequest 文件上传成功会走成功的钩子，失败走失败的钩子
      return new Promise((resolve, reject) => {
        FileApi.updateFile({ file: options.file })
          .then((res) => {
            if (res.code === 0) {
              resolve(res)
            } else {
              reject(res)
            }
          })
          .catch((res) => {
            reject(res)
          })
      })
    }
  }

  return {
    uploadUrl,
    httpRequest
  }
}

/**
 * 创建文件信息
 * @param vo 文件预签名信息
 * @param name 文件名称
 * @param file 文件
 */
function createFile(vo: FileApi.FilePresignedUrlRespVO, name: string, file: UploadRawFile) {
  const fileVo = {
    configId: vo.configId,
    url: vo.url,
    path: name,
    name: file.name,
    type: file.type,
    size: file.size
  }
  FileApi.createFile(fileVo)
  return fileVo
}

/**
 * 生成文件名称（使用算法SHA256）
 * @param file 要上传的文件
 */
async function generateFileName(file: UploadRawFile) {
  // 读取文件内容
  const data = await file.arrayBuffer()
  const wordArray = CryptoJS.lib.WordArray.create(data)
  // 计算SHA256
  const sha256 = CryptoJS.SHA256(wordArray).toString()
  // 拼接后缀
  const ext = file.name.substring(file.name.lastIndexOf('.'))
  return `${sha256}${ext}`
}

/**
 * 上传类型
 */
enum UPLOAD_TYPE {
  // 客户端直接上传（只支持S3服务）
  CLIENT = 'client',
  // 客户端发送到后端上传
  SERVER = 'server'
}
