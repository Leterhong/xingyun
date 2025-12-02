<template>
  <div class="app-container">
    <!-- 头部 -->
    <header class="app-header">
      <div class="header-content">
        <img src="./assets/vue.svg" alt="Logo" class="logo" />
        <h1>路演数字人</h1>
        <div class="header-actions">
          <el-button 
            type="primary" 
            :icon="Setting" 
            @click="showSettings = true"
          >
            配置
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <!-- 左侧：数字人展示区 -->
      <div class="avatar-section">
      <AvatarPanel 
        ref="avatarPanelRef"
        :config="sdkConfig"
        @ready="handleAvatarReady"
        @error="handleAvatarError"
        @state-change="handleStateChange"
        @message="handleAvatarMessage"
      />
      </div>

      <!-- 右侧：交互区 -->
      <div class="interaction-section">
        <!-- 对话面板 -->
        <ChatPanel 
          ref="chatPanelRef"
          :messages="messages"
          :is-loading="isLoading"
          @send-message="handleSendMessage"
        />
        
        <!-- 控制面板 -->
        <ControlPanel 
          :is-connected="isConnected"
          :is-speaking="isSpeaking"
          :is-listening="isListening"
          @start-voice="handleStartVoice"
          @stop-voice="handleStopVoice"
          @interrupt="handleInterrupt"
          @quick-message="handleSendMessage"
        />
      </div>
    </main>

    <!-- 配置对话框 -->
    <el-dialog 
      v-model="showSettings" 
      title="配置参数" 
      width="600px"
      :close-on-click-modal="false"
    >
      <SettingsForm 
        :config="sdkConfig"
        @save="handleSaveSettings"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import AvatarPanel from './components/AvatarPanel.vue'
import ChatPanel from './components/ChatPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import SettingsForm from './components/SettingsForm.vue'

// 状态管理
const showSettings = ref(false)
const isConnected = ref(false)
const isSpeaking = ref(false)
const isListening = ref(false)
const isLoading = ref(false)
const messages = ref<any[]>([])

// SDK配置
const sdkConfig = reactive({
  appId: localStorage.getItem('xingyun_appId') || '',
  appSecret: localStorage.getItem('xingyun_appSecret') || '',
  asrAppId: localStorage.getItem('asr_appId') || '',
  asrSecretId: localStorage.getItem('asr_secretId') || '',
  asrSecretKey: localStorage.getItem('asr_secretKey') || '',
  llmModel: localStorage.getItem('llm_model') || 'doubao-pro-32k',
  llmApiKey: localStorage.getItem('llm_apiKey') || ''
})

// 组件引用
const avatarPanelRef = ref()
const chatPanelRef = ref()

// 数字人就绪
const handleAvatarReady = () => {
  isConnected.value = true
  ElMessage.success('数字人连接成功！')
}

// 数字人错误
const handleAvatarError = (error: any) => {
  ElMessage.error(`数字人错误: ${error.message}`)
  isLoading.value = false
}

// 状态变化
const handleStateChange = (state: string) => {
  isSpeaking.value = state === 'speak'
}

// 数字人消息
const handleAvatarMessage = (role: string, content: string) => {
  messages.value.push({
    role,
    content,
    timestamp: Date.now()
  })
  isLoading.value = false
}

// 发送消息
const handleSendMessage = async (text: string) => {
  if (!text.trim() || !isConnected.value || isLoading.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: text,
    timestamp: Date.now()
  })

  isLoading.value = true

  // 调用大模型并驱动数字人
  try {
    await avatarPanelRef.value?.sendToLLM(text)
  } catch (error) {
    isLoading.value = false
  }
}

// 开始语音识别
const handleStartVoice = () => {
  if (!isConnected.value) {
    ElMessage.warning('请先连接数字人')
    return
  }
  isListening.value = true
  ElMessage.info('语音识别功能需要配置ASR服务')
  // TODO: 实现语音识别
  // avatarPanelRef.value?.startListening()
}

// 停止语音识别
const handleStopVoice = () => {
  isListening.value = false
  // avatarPanelRef.value?.stopListening()
}

// 打断说话
const handleInterrupt = () => {
  avatarPanelRef.value?.interrupt()
  isSpeaking.value = false
}

// 保存配置
const handleSaveSettings = (config: any) => {
  Object.assign(sdkConfig, config)
  
  // 保存到localStorage
  Object.keys(config).forEach(key => {
    localStorage.setItem(key, config[key])
  })
  
  showSettings.value = false
  ElMessage.success('配置已保存，请刷新页面重新连接')
}

// 页面加载时检查配置
onMounted(() => {
  if (!sdkConfig.appId || !sdkConfig.appSecret) {
    showSettings.value = true
    ElMessage.warning('请先配置SDK参数')
  }
})
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  animation: fadeIn 0.8s ease-out;
  position: relative;
  overflow: hidden;
}

.app-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.app-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(circle at 30% 70%, rgba(102, 126, 234, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 70% 30%, rgba(240, 147, 251, 0.1) 0%, transparent 40%);
  animation: floatBackground 20s ease-in-out infinite;
  pointer-events: none;
}

@keyframes floatBackground {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(-20px, -20px) rotate(120deg);
  }
  66% {
    transform: translate(20px, -10px) rotate(240deg);
  }
}

.app-header {
  height: 80px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  padding: 0 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 100;
  transition: all 0.3s ease;
}

.app-header:hover {
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  height: 50px;
  width: 50px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 8px;
  position: relative;
  overflow: hidden;
}

.logo::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.logo:hover::before {
  left: 100%;
}

.logo:hover {
  transform: scale(1.15) rotate(8deg);
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.header-content h1 {
  flex: 1;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.header-content h1::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.header-content h1:hover::after {
  width: 100px;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.header-actions .el-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 25px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.header-actions .el-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.header-actions .el-button:hover::before {
  left: 100%;
}

.header-actions .el-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.header-actions .el-button:active {
  transform: translateY(0) scale(0.98);
}

.app-main {
  flex: 1;
  display: flex;
  gap: 30px;
  padding: 30px;
  overflow: hidden;
  animation: slideIn 0.8s ease-out;
  position: relative;
  z-index: 1;
}

.avatar-section {
  flex: 0 0 480px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(25px);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.avatar-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
}

.avatar-section:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 30px 80px rgba(0, 0, 0, 0.2),
    0 12px 32px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.interaction-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-width: 0;
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .avatar-section {
    flex: 0 0 420px;
  }
  
  .header-content h1 {
    font-size: 26px;
  }
}

@media (max-width: 1200px) {
  .app-main {
    padding: 20px;
    gap: 20px;
  }
  
  .avatar-section {
    flex: 0 0 380px;
  }
  
  .app-header {
    padding: 0 30px;
  }
  
  .header-content h1 {
    font-size: 24px;
  }
}

@media (max-width: 992px) {
  .app-main {
    flex-direction: column;
    gap: 20px;
  }
  
  .avatar-section {
    flex: 0 0 400px;
  }
  
  .interaction-section {
    flex: 1;
  }
  
  .header-content h1 {
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .app-header {
    height: 70px;
    padding: 0 20px;
  }
  
  .header-content h1 {
    font-size: 20px;
  }
  
  .logo {
    height: 40px;
    width: 40px;
  }
  
  .app-main {
    padding: 16px;
    gap: 16px;
  }
  
  .avatar-section {
    flex: 0 0 350px;
  }
  
  .header-content {
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .app-header {
    height: 65px;
    padding: 0 16px;
  }
  
  .header-content h1 {
    font-size: 18px;
  }
  
  .logo {
    height: 35px;
    width: 35px;
  }
  
  .app-main {
    padding: 12px;
    gap: 12px;
  }
  
  .avatar-section {
    flex: 0 0 300px;
  }
  
  .header-content {
    gap: 12px;
  }
  
  .header-actions {
    gap: 8px;
  }
}
</style>
