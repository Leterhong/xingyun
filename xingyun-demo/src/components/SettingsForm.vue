<template>
  <el-form 
    ref="formRef" 
    :model="formData" 
    :rules="rules" 
    label-width="120px"
  >
    <el-divider content-position="left">魔珐星云配置</el-divider>
    
    <el-form-item label="App ID" prop="appId">
      <el-input 
        v-model="formData.appId" 
        placeholder="请输入魔珐星云 App ID"
      />
      <div class="form-tip">
        从 <a href="https://xingyun3d.com/" target="_blank">魔珐星云平台</a> 获取
      </div>
    </el-form-item>

    <el-form-item label="App Secret" prop="appSecret">
      <el-input 
        v-model="formData.appSecret" 
        type="password"
        show-password
        placeholder="请输入魔珐星云 App Secret"
      />
    </el-form-item>

    <el-divider content-position="left">大模型配置</el-divider>

    <el-form-item label="模型" prop="llmModel">
      <el-select 
        v-model="formData.llmModel" 
        placeholder="请选择大模型"
        style="width: 100%;"
      >
        <el-option label="豆包 Pro 32K" value="doubao-pro-32k" />
        <el-option label="豆包 Lite 32K" value="doubao-lite-32k" />
        <el-option label="DeepSeek Chat" value="deepseek-chat" />
        <el-option label="通义千问" value="qwen-plus" />
        <el-option label="ChatGPT-4" value="gpt-4" />
        <el-option label="蓝耘平台" value="lanyun-model" />
      </el-select>
    </el-form-item>

    <el-form-item label="API Key" prop="llmApiKey">
      <el-input 
        v-model="formData.llmApiKey" 
        type="password"
        show-password
        placeholder="请输入大模型 API Key"
      />
      <div class="form-tip">
        根据选择的模型，从对应平台获取 API Key
      </div>
    </el-form-item>

    <el-divider content-position="left">语音识别配置（可选）</el-divider>

    <el-form-item label="ASR App ID" prop="asrAppId">
      <el-input 
        v-model="formData.asrAppId" 
        placeholder="请输入语音识别 App ID"
      />
      <div class="form-tip">
        腾讯云或阿里云语音识别服务
      </div>
    </el-form-item>

    <el-form-item label="Secret ID" prop="asrSecretId">
      <el-input 
        v-model="formData.asrSecretId" 
        placeholder="请输入 Secret ID"
      />
    </el-form-item>

    <el-form-item label="Secret Key" prop="asrSecretKey">
      <el-input 
        v-model="formData.asrSecretKey" 
        type="password"
        show-password
        placeholder="请输入 Secret Key"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSave" :loading="saving">
        保存配置
      </el-button>
      <el-button @click="handleReset">
        重置
      </el-button>
      <el-button type="info" @click="runDiagnostic" :loading="diagnosing">
        🔍 连接诊断
      </el-button>
    </el-form-item>

    <!-- 诊断结果 -->
    <el-dialog v-model="showDiagnostic" title="连接诊断结果" width="800px">
      <div v-if="diagnosticResults.length > 0">
        <div v-for="result in diagnosticResults" :key="result.message" class="diagnostic-item">
          <el-alert
            :type="result.status === 'error' ? 'error' : result.status === 'warning' ? 'warning' : 'success'"
            :title="result.message"
            :closable="false"
            show-icon
            class="mb-2"
          >
            <template #default>
              <div class="diagnostic-details">
                <small>类别: {{ getCategoryName(result.category) }}</small>
                <div v-if="result.details" class="mt-1">
                  <small>详细信息: {{ JSON.stringify(result.details) }}</small>
                </div>
              </div>
            </template>
          </el-alert>
        </div>

        <el-divider />

        <div class="recommendations">
          <h4>💡 解决建议：</h4>
          <div v-for="(recommendation, index) in recommendations" :key="index" class="recommendation-item">
            {{ recommendation }}
          </div>
        </div>
      </div>
    </el-dialog>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { DiagnosticService, type DiagnosticResult } from '../services/diagnostic'

const props = defineProps<{
  config: any
}>()

const emit = defineEmits<{
  save: [config: any]
}>()

const formRef = ref<FormInstance>()
const saving = ref(false)
const diagnosing = ref(false)
const showDiagnostic = ref(false)
const diagnosticResults = ref<DiagnosticResult[]>([])
const recommendations = ref<string[]>([])

// 表单数据
const formData = reactive({
  appId: props.config.appId || '',
  appSecret: props.config.appSecret || '',
  llmModel: props.config.llmModel || 'doubao-pro-32k',
  llmApiKey: props.config.llmApiKey || '',
  asrAppId: props.config.asrAppId || '',
  asrSecretId: props.config.asrSecretId || '',
  asrSecretKey: props.config.asrSecretKey || ''
})

// 验证规则
const rules: FormRules = {
  appId: [
    { required: true, message: '请输入 App ID', trigger: 'blur' }
  ],
  appSecret: [
    { required: true, message: '请输入 App Secret', trigger: 'blur' }
  ],
  llmModel: [
    { required: true, message: '请选择大模型', trigger: 'change' }
  ],
  llmApiKey: [
    { required: true, message: '请输入 API Key', trigger: 'blur' }
  ]
}

// 保存配置
const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    saving.value = true
    
    // 保存到 localStorage
    localStorage.setItem('xingyun_appId', formData.appId)
    localStorage.setItem('xingyun_appSecret', formData.appSecret)
    localStorage.setItem('llm_model', formData.llmModel)
    localStorage.setItem('llm_apiKey', formData.llmApiKey)
    localStorage.setItem('asr_appId', formData.asrAppId)
    localStorage.setItem('asr_secretId', formData.asrSecretId)
    localStorage.setItem('asr_secretKey', formData.asrSecretKey)

    // 触发保存事件
    emit('save', { ...formData })
    
    saving.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields()
}

// 运行连接诊断
const runDiagnostic = async () => {
  diagnosing.value = true
  try {
    ElMessage.info('正在运行连接诊断，请稍候...')
    
    const config = {
      appId: formData.appId,
      appSecret: formData.appSecret,
      llmModel: formData.llmModel,
      llmApiKey: formData.llmApiKey
    }
    
    diagnosticResults.value = await DiagnosticService.diagnoseConnection(config)
    recommendations.value = DiagnosticService.getRecommendations(diagnosticResults.value)
    
    showDiagnostic.value = true
    
    const errorCount = diagnosticResults.value.filter(r => r.status === 'error').length
    const warningCount = diagnosticResults.value.filter(r => r.status === 'warning').length
    
    if (errorCount === 0) {
      ElMessage.success('诊断完成，未发现严重问题')
    } else {
      ElMessage.warning(`诊断完成，发现 ${errorCount} 个错误和 ${warningCount} 个警告`)
    }
  } catch (error: any) {
    ElMessage.error(`诊断失败: ${error.message}`)
  } finally {
    diagnosing.value = false
  }
}

// 获取类别名称
const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'network': '网络连接',
    'auth': '身份认证',
    'sdk': 'SDK加载',
    'config': '配置信息',
    'llm': '大模型'
  }
  return names[category] || category
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

.form-tip a {
  color: #409eff;
  text-decoration: none;
}

.form-tip a:hover {
  text-decoration: underline;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}

/* API示例卡片样式 */
.api-example-card {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #409eff;
}

.api-example {
  font-size: 14px;
  line-height: 1.6;
}

.api-url {
  display: inline-block;
  background: #f5f7fa;
  padding: 6px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #e6a23c;
  border: 1px solid #e6a23c;
  margin: 8px 0;
  word-break: break-all;
}

.code-block {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 12px 0;
  border: 1px solid #3e4451;
}

.code-block code {
  background: none;
  padding: 0;
  color: inherit;
}

.param-list, .notice-list {
  margin: 12px 0;
  padding-left: 20px;
}

.param-list li, .notice-list li {
  margin: 8px 0;
  color: #606266;
}

.param-list code, .notice-list code {
  background: #f0f9ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.notice-list {
  color: #e6a23c;
}

.mt-3 {
  margin-top: 12px;
}

/* 诊断结果样式 */
.diagnostic-item {
  margin-bottom: 12px;
}

.diagnostic-details {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.recommendations {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.recommendations h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.recommendation-item {
  margin: 8px 0;
  line-height: 1.6;
  color: #606266;
  font-size: 14px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mt-1 {
  margin-top: 4px;
}
</style>
