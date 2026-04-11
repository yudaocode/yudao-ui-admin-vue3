const download0 = (data: Blob, fileName: string, mineType: string) => {
  // 创建 blob
  const blob = new Blob([data], { type: mineType })
  // 创建 href 超链接，点击进行下载
  window.URL = window.URL || window.webkitURL
  const href = URL.createObjectURL(blob)
  const downA = document.createElement('a')
  downA.href = href
  downA.download = fileName
  downA.click()
  // 销毁超连接
  window.URL.revokeObjectURL(href)
}

const download = {
  // 下载 Excel 方法
  excel: (data: Blob, fileName: string) => {
    download0(data, fileName, 'application/vnd.ms-excel')
  },
  // 下载 Word 方法
  word: (data: Blob, fileName: string) => {
    download0(data, fileName, 'application/msword')
  },
  // 下载 Zip 方法
  zip: (data: Blob, fileName: string) => {
    download0(data, fileName, 'application/zip')
  },
  // 下载 Html 方法
  html: (data: Blob, fileName: string) => {
    download0(data, fileName, 'text/html')
  },
  // 下载 Markdown 方法
  markdown: (data: Blob, fileName: string) => {
    download0(data, fileName, 'text/markdown')
  },
  // 下载 Json 方法
  json: (data: Blob, fileName: string) => {
    download0(data, fileName, 'application/json')
  },
  // 下载图片（允许跨域）
  image: ({
    url,
    canvasWidth,
    canvasHeight,
    drawWithImageSize = true
  }: {
    url: string
    canvasWidth?: number // 指定画布宽度
    canvasHeight?: number // 指定画布高度
    drawWithImageSize?: boolean // 将图片绘制在画布上时带上图片的宽高值, 默认是要带上的
  }) => {
    const image = new Image()
    // image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvasWidth || image.width
      canvas.height = canvasHeight || image.height
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      if (drawWithImageSize) {
        ctx.drawImage(image, 0, 0, image.width, image.height)
      } else {
        ctx.drawImage(image, 0, 0)
      }
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'image.png'
      a.click()
    }
  },
  base64ToFile: (base64: any, fileName: string) => {
    // 将base64按照 , 进行分割 将前缀  与后续内容分隔开
    const data = base64.split(',')
    // 利用正则表达式 从前缀中获取图片的类型信息（image/png、image/jpeg、image/webp等）
    const type = data[0].match(/:(.*?);/)[1]
    // 从图片的类型信息中 获取具体的文件格式后缀（png、jpeg、webp）
    const suffix = type.split('/')[1]
    // 使用atob()对base64数据进行解码  结果是一个文件数据流 以字符串的格式输出
    const bstr = window.atob(data[1])
    // 获取解码结果字符串的长度
    let n = bstr.length
    // 根据解码结果字符串的长度创建一个等长的整形数字数组
    // 但在创建时 所有元素初始值都为 0
    const u8arr = new Uint8Array(n)
    // 将整形数组的每个元素填充为解码结果字符串对应位置字符的UTF-16 编码单元
    while (n--) {
      // charCodeAt()：获取给定索引处字符对应的 UTF-16 代码单元
      u8arr[n] = bstr.charCodeAt(n)
    }

    // 将File文件对象返回给方法的调用者
    return new File([u8arr], `${fileName}.${suffix}`, {
      type: type
    })
  }
}

export default download
