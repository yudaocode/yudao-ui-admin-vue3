<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item label="生成模板" prop="templateType">
          <el-select v-model="formData.templateType">
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

    <!-- 树表信息 -->
    <el-row v-if="formData.templateType == 2">
      <el-col :span="24">
        <h4 class="form-header">树表信息</h4>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="treeParentColumnId">
          <template #label>
            <span>
              父编号字段
              <el-tooltip content="树显示的父编码字段名， 如：parent_Id" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.treeParentColumnId" placeholder="请选择">
            <el-option
              v-for="(column, index) in props.columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="treeNameColumnId">
          <template #label>
            <span>
              树名称字段
              <el-tooltip content="树节点的显示名称字段名， 如：dept_name" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.treeNameColumnId" placeholder="请选择">
            <el-option
              v-for="(column, index) in props.columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 主表信息 -->
    <el-row v-if="formData.templateType == 15">
      <el-col :span="24">
        <h4 class="form-header">主表信息</h4>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="masterTableId">
          <template #label>
            <span>
              关联的主表
              <el-tooltip content="关联主表（父表）的表名， 如：system_user" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.masterTableId" placeholder="请选择">
            <el-option
              v-for="(table0, index) in tables"
              :key="index"
              :label="table0.tableName + '：' + table0.tableComment"
              :value="table0.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="subJoinColumnId">
          <template #label>
            <span>
              子表关联的字段
              <el-tooltip content="子表关联的字段， 如：user_id" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="formData.subJoinColumnId" placeholder="请选择">
            <el-option
              v-for="(column, index) in props.columns"
              :key="index"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="subJoinMany">
          <template #label>
            <span>
              关联关系
              <el-tooltip content="主表与子表的关联关系" placement="top">
                <Icon icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-radio-group v-model="formData.subJoinMany" placeholder="请选择">
            <el-radio :label="true">一对多</el-radio>
            <el-radio :label="false">一对一</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as CodegenApi from '@/api/infra/codegen'
import * as MenuApi from '@/api/system/menu'
import { PropType } from 'vue'

defineOptions({ name: 'InfraCodegenGenerateInfoForm' })

const message = useMessage() // 消息弹窗
const props = defineProps({
  table: {
    type: Object as PropType<Nullable<CodegenApi.CodegenTableVO>>,
    default: () => null
  },
  columns: {
    type: Array as unknown as PropType<CodegenApi.CodegenColumnVO[]>,
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
  genType: '',
  masterTableId: undefined,
  subJoinColumnId: undefined,
  subJoinMany: undefined,
  treeParentColumnId: undefined,
  treeNameColumnId: undefined
})

const rules = reactive({
  templateType: [required],
  frontType: [required],
  scene: [required],
  moduleName: [required],
  businessName: [required],
  businessPackage: [required],
  className: [required],
  classComment: [required],
  masterTableId: [required],
  subJoinColumnId: [required],
  subJoinMany: [required],
  treeParentColumnId: [required],
  treeNameColumnId: [required]
})

const tables = ref([]) // 表定义列表
const menus = ref<any[]>([])
const menuTreeProps = {
  label: 'name'
}

watch(
  () => props.table,
  async (table) => {
    if (!table) return
    formData.value = table as any
    // 加载表列表
    if (table.dataSourceConfigId >= 0) {
      tables.value = await CodegenApi.getCodegenTableList(formData.value.dataSourceConfigId)
    }
  },
  {
    deep: true,
    immediate: true
  }
)

onMounted(async () => {
  try {
    // 加载菜单
    const resp = await MenuApi.getSimpleMenusList()
    menus.value = handleTree(resp)
  } catch {}
})

defineExpose({
  validate: async () => unref(formRef)?.validate()
})
</script>
