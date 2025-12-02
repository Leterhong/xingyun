<template>
  <div class="avatar-panel">
    <!-- 数字人容器 -->
    <div class="avatar-container">
      <div id="xingyun-sdk" ref="sdkContainer"></div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading" :size="40">
          <Loading />
        </el-icon>
        <p>正在连接数字人...</p>
        <el-progress 
          :percentage="loadingProgress" 
          :show-text="false"
          style="width: 200px;"
        />
      </div>

      <!-- 状态指示器 -->
      <div class="status-indicator" :class="statusClass">
        <el-icon><VideoCamera /></el-icon>
        {{ statusText }}
      </div>

      <!-- 字幕区域 -->
      <div v-if="subtitle" class="subtitle-area">
        {{ subtitle }}
      </div>
    </div>

    <!-- 信息面板 -->
    <div class="info-panel">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="状态">
          <el-tag :type="isConnected ? 'success' : 'info'">
            {{ isConnected ? '已连接' : '未连接' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="延时">
          {{ networkInfo.rtt }}ms
        </el-descriptions-item>
        <el-descriptions-item label="下载速率">
          {{ networkInfo.downlink.toFixed(2) }}MB/s
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          {{ currentState }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 调试按钮 -->
      <div class="debug-actions">
        <el-button 
          size="small" 
          @click="toggleDebug"
        >
          {{ showDebug ? '隐藏' : '显示' }}调试信息
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, VideoCamera } from '@element-plus/icons-vue'
import { XingyunService } from '../services/xingyun'
import { LLMService } from '../services/llm'

const props = defineProps<{
  config: any
}>()

const emit = defineEmits<{
  ready: []
  error: [error: any]
  stateChange: [state: string]
  message: [role: string, content: string]
}>()

// 状态
const loading = ref(true)
const loadingProgress = ref(0)
const isConnected = ref(false)
const currentState = ref('idle')
const subtitle = ref('')
const showDebug = ref(false)

// 网络信息
const networkInfo = ref({
  rtt: 0,
  downlink: 0
})

// 服务实例
let xingyunService: XingyunService | null = null
let llmService: LLMService | null = null

// 状态样式
const statusClass = computed(() => {
  return {
    'status-online': isConnected.value,
    'status-offline': !isConnected.value
  }
})

const statusText = computed(() => {
  if (!isConnected.value) return '离线'
  return currentState.value === 'speak' ? '说话中' : '待机中'
})

// 初始化SDK
const initSDK = async () => {
  try {
    loading.value = true
    loadingProgress.value = 0

    console.log('🔍 开始诊断数字人连接...')
    console.log('📋 配置信息:', {
      appId: props.config.appId ? `${props.config.appId.substring(0, 8)}...` : '未配置',
      appSecret: props.config.appSecret ? `${props.config.appSecret.substring(0, 8)}...` : '未配置',
      llmModel: props.config.llmModel,
      llmApiKey: props.config.llmApiKey ? `${props.config.llmApiKey.substring(0, 8)}...` : '未配置'
    })

    // 检查必要配置
    if (!props.config.appId || !props.config.appSecret) {
      throw new Error('魔珐星云 App ID 和 App Secret 不能为空，请在配置中填写正确的认证信息')
    }

    // 检查SDK是否加载
    if (!window.XmovAvatar) {
      throw new Error('魔珐星云SDK未加载，请检查网络连接或刷新页面重试')
    }

    console.log('✅ SDK检查通过，开始创建服务实例...')

    // 创建魔珐星云服务
    xingyunService = new XingyunService({
      containerId: '#xingyun-sdk',
      appId: props.config.appId,
      appSecret: props.config.appSecret,
      onMessage: handleSDKMessage,
      onStateChange: handleStateChange,
      onNetworkInfo: handleNetworkInfo,
      onVoiceStateChange: handleVoiceStateChange,
      onStatusChange: handleStatusChange,
      proxyWidget: {
        'subtitle_on': (data: any) => {
          subtitle.value = data.text || ''
        },
        'subtitle_off': () => {
          subtitle.value = ''
        },
        'widget_pic': (data: any) => {
          console.log('图片widget:', data)
        }
      },
      enableLogger: true // 开启详细日志
    })

    console.log('🚀 开始初始化SDK...')

    // 初始化（带进度回调）
    await xingyunService.init({
      onDownloadProgress: (progress: number) => {
        loadingProgress.value = progress
        console.log(`📥 SDK加载进度: ${progress}%`)
      }
    })

    console.log('✅ SDK初始化成功')

    // 创建LLM服务
    if (props.config.llmApiKey && props.config.llmModel) {
      console.log('🤖 初始化LLM服务...')
      llmService = new LLMService({
        model: props.config.llmModel,
        apiKey: props.config.llmApiKey
      })
      console.log('✅ LLM服务初始化成功')
    } else {
      console.warn('⚠️ LLM配置不完整，将无法进行AI对话')
    }

    loading.value = false
    isConnected.value = true
    console.log('🎉 数字人连接成功！')
    ElMessage.success('数字人连接成功！')
    emit('ready')

  } catch (error: any) {
    loading.value = false
    console.error('❌ 数字人初始化失败:', error)
    
    // 根据错误类型提供更具体的错误信息
    let errorMessage = '初始化失败'
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      errorMessage = '认证失败：请检查 App ID 和 App Secret 是否正确'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = '网络连接失败：请检查网络连接或防火墙设置'
    } else if (error.message.includes('timeout')) {
      errorMessage = '连接超时：请检查网络连接或稍后重试'
    } else if (error.message.includes('App ID') || error.message.includes('App Secret')) {
      errorMessage = '配置错误：' + error.message
    } else {
      errorMessage = `初始化失败: ${error.message}`
    }
    
    ElMessage.error(errorMessage)
    emit('error', error)
  }
}

// SDK消息处理
const handleSDKMessage = (message: any) => {
  console.log('SDK消息:', message)
  if (message.code && message.code !== 0) {
    ElMessage.warning(`SDK警告 [${message.code}]: ${message.message}`)
  }
}

// 状态变化
const handleStateChange = (state: string) => {
  currentState.value = state
  emit('stateChange', state)
}

// 网络信息
const handleNetworkInfo = (info: any) => {
  networkInfo.value = info
}

// 语音状态
let shouldReturnToIdle = false  // 标记是否需要在播放结束后回到待机

const handleVoiceStateChange = (status: string) => {
  console.log('语音状态:', status)
  
  if (status === 'start') {
    console.log('🎤 数字人开始说话')
  } else if (status === 'end') {
    console.log('🎤 数字人说话结束')
    
    // 如果标记了需要回到待机，则执行
    if (shouldReturnToIdle && xingyunService) {
      console.log('✅ 回到待机状态')
      xingyunService.interactiveidle()
      shouldReturnToIdle = false
    }
  }
}

// SDK状态变化
const handleStatusChange = (status: any) => {
  console.log('SDK状态变化:', status)
  if (status === 4) { // close
    isConnected.value = false
  }
}

// 过滤表情符号和特殊字符（简化版，主要依赖AI不生成）
const removeEmojis = (text: string): string => {
  // 只过滤最常见的表情符号范围，避免复杂的正则导致错误
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号 😀-🙏
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 符号和象形文字 🌀-🗿
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号 🚀-🛿
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // 补充符号 🤀-🧿
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号 ☀-⛿
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // 装饰符号 ✀-➿
    .trim()
}

// 发送到LLM并驱动数字人
const sendToLLM = async (text: string) => {
  if (!xingyunService || !llmService) {
    ElMessage.error('服务未初始化')
    return
  }

  try {
    // 切换到思考状态
    xingyunService.think()

    // 调用LLM（流式接收，但等全部生成完再发送给数字人）
    let fullResponse = ''

    console.log('开始接收AI响应...')

    await llmService.sendStream(text, (chunk: string, done: boolean) => {
      // 过滤表情符号
      const cleanChunk = removeEmojis(chunk)
      
      if (cleanChunk) {
        fullResponse += cleanChunk
        console.log('接收chunk:', cleanChunk, '累计长度:', fullResponse.length)
      }

      // AI 生成结束后，一次性发送给数字人
      if (done) {
        console.log('========================================')
        console.log('AI生成完成！')
        console.log('完整内容:', fullResponse)
        console.log('总字数:', fullResponse.length)
        console.log('========================================')
        
        if (fullResponse.trim()) {
          // 一次性发送所有内容给数字人（is_start=true, is_end=true）
          console.log('✅ 一次性发送给数字人')
          
          // 标记需要在播放结束后回到待机
          shouldReturnToIdle = true
          
          xingyunService!.speak(fullResponse, true, true)
        } else {
          console.warn('⚠️ AI生成内容为空')
          // 如果内容为空，直接回到待机
          xingyunService!.interactiveidle()
        }
        
        // 发送完整响应给父组件
        emit('message', 'assistant', fullResponse)
      }
    })

  } catch (error: any) {
    console.error('LLM调用错误:', error)
    ElMessage.error(`对话失败: ${error.message}`)
    xingyunService.interactiveidle()
    // 通知父组件错误，重置加载状态
    emit('message', 'assistant', '抱歉，我遇到了一些问题，请重试。')
  }
}

// 打断说话
const interrupt = () => {
  xingyunService?.interactiveidle()
  subtitle.value = ''
}

// 切换调试信息
const toggleDebug = () => {
  showDebug.value = !showDebug.value
  if (showDebug.value) {
    xingyunService?.showDebugInfo()
  } else {
    xingyunService?.hideDebugInfo()
  }
}

// 暴露方法给父组件
defineExpose({
  sendToLLM,
  interrupt
})

// 生命周期
onMounted(() => {
  if (props.config.appId && props.config.appSecret) {
    initSDK()
  }
})

onUnmounted(() => {
  xingyunService?.destroy()
})
</script>

<style scoped>
.avatar-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.avatar-container {
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  min-height: 500px;
  box-shadow: 
    inset 0 0 50px rgba(0, 0, 0, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.2);
  position: relative;
}

.avatar-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 70%),
    radial-gradient(circle at 20% 80%, rgba(240, 147, 251, 0.05) 0%, transparent 60%);
  pointer-events: none;
  animation: pulseGlow 4s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

#xingyun-sdk {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(15, 52, 96, 0.98));
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  gap: 24px;
  z-index: 10;
  animation: fadeIn 0.5s ease-out;
}

.loading-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
  animation: rotateBackground 10s linear infinite;
  pointer-events: none;
}

@keyframes rotateBackground {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.loading-overlay :deep(.el-progress) {
  width: 220px;
}

.loading-overlay :deep(.el-progress__text) {
  color: #fff !important;
  font-weight: 600;
}

.status-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 25px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 5;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: slideIn 0.6s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-indicator:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.status-online {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.95), rgba(82, 196, 26, 0.95));
  box-shadow: 
    0 8px 24px rgba(103, 194, 58, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-color: rgba(103, 194, 58, 0.3);
}

.status-online::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 3s ease-in-out infinite;
}

.status-offline {
  background: linear-gradient(135deg, rgba(144, 147, 153, 0.95), rgba(96, 98, 102, 0.95));
  box-shadow: 
    0 8px 24px rgba(144, 147, 153, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(144, 147, 153, 0.3);
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.status-indicator .el-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.subtitle-area {
  position: absolute;
  bottom: 30px;
  left: 30px;
  right: 30px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(26, 26, 46, 0.9));
  backdrop-filter: blur(20px);
  color: #fff;
  border-radius: 16px;
  font-size: 16px;
  line-height: 1.7;
  text-align: center;
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.15);
  animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 100;
  pointer-events: none;
  position: relative;
  overflow: hidden;
}

.subtitle-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: slideLine 3s ease-in-out infinite;
}

@keyframes slideLine {
  0%, 100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-panel {
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 0 0 16px 16px;
  border-top: 2px solid rgba(102, 126, 234, 0.15);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  position: relative;
}

.info-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 30px;
  right: 30px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.2), transparent);
}

.info-panel :deep(.el-descriptions) {
  border-radius: 8px;
  overflow: hidden;
}

.info-panel :deep(.el-descriptions__label) {
  font-weight: 600;
  color: #606266;
}

.info-panel :deep(.el-descriptions__content) {
  font-weight: 500;
}

.debug-actions {
  margin-top: 14px;
  text-align: center;
}

.debug-actions .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.debug-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式 */
@media (max-width: 768px) {
  .avatar-container {
    min-height: 350px;
  }
  
  .status-indicator {
    top: 12px;
    right: 12px;
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .subtitle-area {
    bottom: 16px;
    left: 16px;
    right: 16px;
    padding: 12px 16px;
    font-size: 14px;
  }
}
</style>

