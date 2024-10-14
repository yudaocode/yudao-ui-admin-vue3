<template>
  <div class="upload-container">
    <!-- 标题 -->
    <div class="title">
      <div>选择数据源</div>
    </div>

    <!-- 数据源选择 -->
    <div class="resource-btn" >导入已有文本</div>

    <!-- 上传文件区域 -->
    <el-form>
      <div class="upload-section">
        <div class="upload-label">上传文本文件</div>
        <el-upload
          class="upload-area"
          action="#"
          :file-list="fileList"
          :on-remove="handleRemove"
          :before-upload="beforeUpload"
          list-type="text"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">拖拽文件至此，或者 <em>选择文件</em></div>
          <div class="el-upload__tip">
            已支持 TXT、MARKDOWN、PDF、HTML、XLSX、XLS、DOCX、CSV、EML、MSG、PPTX、PPT、XML、EPUB，每个文件不超过 15MB。
          </div>
        </el-upload>
      </div>

      <!-- 下一步按钮 -->
      <div class="next-button">
        <el-button type="primary" :disabled="!fileList.length">下一步</el-button>
      </div>
    </el-form>

    <!-- 知识库创建 -->
    <div class="create-knowledge">
      <el-link type="primary" underline>创建一个空知识库</el-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const fileList = ref([])

const handleRemove = (file, fileList) => {
  console.log(file, fileList)
}

const beforeUpload = (file) => {
  fileList.value.push(file)
  return false
}
</script>

<style scoped lang="scss">
.upload-container {
  width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ebebeb;
}

.title {
  font-size: 22px;
  font-weight: bold;
}

.resource-btn {
  margin-top: 20px;
  border-radius: 10px;
  cursor: pointer;
  width: 150px;
  border: 1.5px solid #528bff;
  padding: 10px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  line-height: 30px;
  color: #101828;
}

.upload-section {
  margin: 20px 0;
  padding-top: 10px;
}

.upload-label {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.upload-area {
  margin-top: 10px;
  border: 1px dashed #d9d9d9;
  padding: 40px;
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.el-upload__text em {
  color: #409eff;
  cursor: pointer;
}

.el-upload__tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.next-button {
  text-align: left;
  margin-top: 20px;
}

.create-knowledge {
  text-align: left;
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 0;
}

.source-radio-group {
  display: flex;
  justify-content: space-between;
}

.el-radio-button {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 10px 20px;
}

.el-radio-button .el-icon {
  margin-right: 8px;
}
</style>
