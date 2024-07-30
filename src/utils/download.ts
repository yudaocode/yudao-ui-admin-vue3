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
  }
}

export default download
