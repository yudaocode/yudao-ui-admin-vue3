<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item label="生成模板" prop="templateType">
          <el-select v-model="formData.templateType" @change="tplSelectChange">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.INFRA_CODEGEN_TEMPLATE_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="前端类型" prop="frontType">
          <el-select v-model="formData.frontType">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.INFRA_CODEGEN_FRONT_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="生成场景" prop="scene">
          <el-select v-model="formData.scene">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.INFRA_CODEGEN_SCENE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>
            <span>
              上级菜单
              <el-tooltip content="分配到指定菜单下，例如 系统管理" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-tree-select
            v-model="formData.parentMenuId"
            :data="menus"
            :props="menuTreeProps"
            check-strictly
            node-key="id"
            placeholder="请选择系统菜单"
          />
        </el-form-item>
      </el-col>

      <!--      <el-col :span="12">-->
      <!--        <el-form-item prop="packageName">-->
      <!--          <span slot="label">-->
      <!--            生成包路径-->
      <!--            <el-tooltip content="生成在哪个java包下，例如 com.ruoyi.system" placement="top">-->
      <!--              <i class="el-icon-question"></i>-->
      <!--            </el-tooltip>-->
      <!--          </span>-->
      <!--          <el-input v-model="formData.packageName" />-->
      <!--        </el-form-item>-->
      <!--      </el-col>-->

      <el-col :span="12">
        <el-form-item prop="moduleName">
          <template #label>
            <span>
              模块名
              <el-tooltip
                content="模块名，即一级目录，例如 system、infra、tool 等等"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.moduleName" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="businessName">
          <template #label>
            <span>
              业务名
              <el-tooltip
                content="业务名，即二级目录，例如 user、permission、dict 等等"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.businessName" />
        </el-form-item>
      </el-col>

      <!--      <el-col :span="12">-->
      <!--        <el-form-item prop="businessPackage">-->
      <!--          <span slot="label">-->
      <!--            业务包-->
      <!--            <el-tooltip content="业务包，自定义二级目录。例如说，我们希望将 dictType 和 dictData 归类成 dict 业务" placement="top">-->
      <!--              <i class="el-icon-question"></i>-->
      <!--            </el-tooltip>-->
      <!--          </span>-->
      <!--          <el-input v-model="formData.businessPackage" />-->
      <!--        </el-form-item>-->
      <!--      </el-col>-->

      <el-col :span="12">
        <el-form-item prop="className">
          <template #label>
            <span>
              类名称
              <el-tooltip
                content="类名称（首字母大写），例如SysUser、SysMenu、SysDictData 等等"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.className" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="classComment">
          <template #label>
            <span>
              类描述
              <el-tooltip content="用作类描述，例如 用户" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.classComment" />
        </el-form-item>
      </el-col>

      <el-col v-if="formData.genType === '1'" :span="24">
        <el-form-item prop="genPath">
          <template #label>
            <span>
              自定义路径
              <el-tooltip
                content="填写磁盘绝对路径，若不填写，则生成到当前Web项目下"
                placement="top"
              >
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.genPath">
            <template #append>
              <el-dropdown>
                <el-button type="primary">
                  最近路径快速选择
                  <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="formData.genPath = '/'">
                      恢复默认的生成基础路径
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-input>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-show="formData.tplCategory === 'tree'">
      <h4 class="form-header">其他信息</h4>
      <el-col :span="12">
        <el-form-item>
          <template #label>
            <span>
              树编码字段
              <el-tooltip content="树显示的编码字段名， 如：dept_id" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.treeCode" placeholder="请选择">
            <el-option
              v-for="(column, index) in formData.columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>
            <span>
              树父编码字段
              <el-tooltip content="树显示的父编码字段名， 如：parent_Id" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.treeParentCode" placeholder="请选择">
            <el-option
              v-for="(column, index) in formData.columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>
            <span>
              树名称字段
              <el-tooltip content="树节点的显示名称字段名， 如：dept_name" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>

          <el-select v-model="formData.treeName" placeholder="请选择">
            <el-option
              v-for="(column, index) in formData.columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row v-show="formData.tplCategory === 'sub'">
      <h4 class="form-header">关联信息</h4>
      <el-col :span="12">
        <el-form-item>
          <template #label>
            <span>
              关联子表的表名
              <el-tooltip content="关联子表的表名， 如：sys_user" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.subTableName" placeholder="请选择" @change="subSelectChange">
            <el-option
              v-for="(table0, index) in tables"
              :key="index"
              :label="table0.tableName + '：' + table0.tableComment"
              :value="table0.tableName"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>
            <span>
              子表关联的外键名
              <el-tooltip content="子表关联的外键名， 如：user_id" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.subTableFkName" placeholder="请选择">
            <el-option
              v-for="(column, index) in subColumns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" name="InfraCodegenGenerateInfoForm" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as CodegenApi from '@/api/infra/codegen'
import * as MenuApi from '@/api/system/menu'
import { PropType } from 'vue'

const message = useMessage() // 消息弹窗
const props = defineProps({
  table: {
    type: Object as PropType<Nullable<CodegenApi.CodegenTableVO>>,
    default: () => null
  }
})

const formRef = ref()
const formData = ref({
  templateType: null,
  frontType: null,
  scene: null,
  moduleName: '',
  businessName: '',
  className: '',
  classComment: '',
  parentMenuId: null,
  genPath: '',
  treeCode: '',
  treeParentCode: '',
  treeName: '',
  tplCategory: '',
  subTableName: '',
  subTableFkName: '',
  genType: ''
})

const rules = reactive({
  templateType: [required],
  frontType: [required],
  scene: [required],
  moduleName: [required],
  businessName: [required],
  businessPackage: [required],
  className: [required],
  classComment: [required]
})

const tables = ref([])
const subColumns = ref([])
const menus = ref<any[]>([])
const menuTreeProps = {
  label: 'name'
}

/** 选择子表名触发 */
const subSelectChange = () => {
  formData.value.subTableFkName = ''
}

/** 选择生成模板触发 */
const tplSelectChange = (value) => {
  if (value !== 1) {
    // TODO 芋艿：暂时不考虑支持树形结构
    message.error(
      '暂时不考虑支持【树形】和【主子表】的代码生成。原因是：导致 vm 模板过于复杂，不利于胖友二次开发'
    )
    return false
  }
  if (value !== 'sub') {
    formData.value.subTableName = ''
    formData.value.subTableFkName = ''
  }
}

watch(
  () => props.table,
  (table) => {
    if (!table) return
    formData.value = table as any
  },
  {
    deep: true,
    immediate: true
  }
)

onMounted(async () => {
  try {
    const resp = await MenuApi.getSimpleMenusList()
    menus.value = handleTree(resp)
  } catch {}
})

defineExpose({
  validate: async () => unref(formRef)?.validate()
})
</script>
