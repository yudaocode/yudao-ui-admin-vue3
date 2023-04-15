import { IEditorConfig } from '@wangeditor/editor'
import { getAccessToken, getTenantId } from '@/utils/auth'

const message = useMessage()

type InsertFnType = (url: string, alt: string, href: string) => void

export const createEditorConfig = (
  server: string,
  accountId: number | undefined
): Partial<IEditorConfig> => {
  return {
    MENU_CONF: {
      ['uploadImage']: {
        server,
        // 单个文件的最大体积限制，默认为 2M
        maxFileSize: 5 * 1024 * 1024,
        // 最多可上传几个文件，默认为 100
        maxNumberOfFiles: 10,
        // 选择文件时的类型限制，默认为 ['image/*'] 。如不想限制，则设置为 []
        allowedFileTypes: ['image/*'],

        // 自定义上传参数，例如传递验证的 token 等。参数会被添加到 formData 中，一起上传到服务端。
        meta: {
          accountId: accountId,
          type: 'image'
        },
        // 将 meta 拼接到 url 参数中，默认 false
        metaWithUrl: true,

        // 自定义增加 http  header
        headers: {
          Accept: '*',
          Authorization: 'Bearer ' + getAccessToken(),
          'tenant-id': getTenantId()
        },

        // 跨域是否传递 cookie ，默认为 false
        withCredentials: true,

        // 超时时间，默认为 10 秒
        timeout: 5 * 1000, // 5 秒

        // form-data fieldName，后端接口参数名称，默认值wangeditor-uploaded-image
        fieldName: 'file',

        // 上传之前触发
        onBeforeUpload(file: File) {
          console.log(file)
          return file
        },
        // 上传进度的回调函数
        onProgress(progress: number) {
          // progress 是 0-100 的数字
          console.log('progress', progress)
        },
        onSuccess(file: File, res: any) {
          console.log('onSuccess', file, res)
        },
        onFailed(file: File, res: any) {
          message.alertError(res.message)
          console.log('onFailed', file, res)
        },
        onError(file: File, err: any, res: any) {
          message.alertError(err.message)
          console.error('onError', file, err, res)
        },
        // 自定义插入图片
        customInsert(res: any, insertFn: InsertFnType) {
          insertFn(res.data.url, 'image', res.data.url)
        }
      }
    }
  }
}
