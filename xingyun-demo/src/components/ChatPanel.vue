<template>
  <div class="chat-panel">
    <div class="chat-header">
      <h3>对话历史</h3>
      <el-button 
        size="small" 
        :icon="Delete" 
        @click="clearMessages"
      >
        清空
      </el-button>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        class="message-item"
        :class="`message-${message.role}`"
      >
        <div class="message-avatar">
          <el-avatar :size="32">
            <el-icon v-if="message.role === 'user'"><User /></el-icon>
            <el-icon v-else><Avatar /></el-icon>
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="message-meta">
            <span class="message-role">
              {{ message.role === 'user' ? '用户' : 'AI助手' }}
            </span>
            <span class="message-time">
              {{ formatTime(message.timestamp) }}
            </span>
          </div>
          <div class="message-text">{{ message.content }}</div>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="isLoading" class="message-item message-assistant">
        <div class="message-avatar">
          <el-avatar :size="32">
            <el-icon><Avatar /></el-icon>
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="message-text">
            <el-icon class="is-loading"><Loading /></el-icon>
            思考中...
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="3"
        placeholder="输入您的问题..."
        @keydown.ctrl.enter="handleSend"
        :disabled="isLoading"
      />
      <div class="input-actions">
        <span class="input-tip">Ctrl + Enter 发送</span>
        <el-button 
          type="primary" 
          :icon="Promotion"
          @click="handleSend"
          :loading="isLoading"
          :disabled="!inputText.trim()"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Delete, User, Avatar, Loading, Promotion } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const props = defineProps<{
  messages: Message[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  sendMessage: [text: string]
}>()

const inputText = ref('')
const messageListRef = ref<HTMLElement>()

// 发送消息
const handleSend = () => {
  const text = inputText.value.trim()
  if (!text) return
  
  emit('sendMessage', text)
  inputText.value = ''
}

// 清空消息
const clearMessages = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有对话记录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    props.messages.splice(0, props.messages.length)
  } catch {
    // 用户取消
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(() => props.messages.length, () => {
  scrollToBottom()
})

watch(() => props.isLoading, () => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.chat-panel:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-header h3::before {
  content: '💬';
  font-size: 20px;
}

.message-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #fafbfc;
}

.message-item {
  display: flex;
  gap: 12px;
  animation: messageIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-avatar .el-avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.message-avatar .el-avatar:hover {
  transform: scale(1.1);
}

.message-content {
  flex: 1;
  max-width: 75%;
}

.message-user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.message-user .message-meta {
  flex-direction: row-reverse;
}

.message-role {
  font-weight: 600;
  color: #606266;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.7;
  word-break: break-word;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.message-text:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.message-user .message-text {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-assistant .message-text {
  background: #ffffff;
  color: #303133;
  border: 1px solid #e4e7ed;
  border-bottom-left-radius: 4px;
}

.input-area {
  padding: 20px 24px;
  border-top: 2px solid rgba(102, 126, 234, 0.1);
  background: linear-gradient(to top, rgba(255, 255, 255, 0.98), rgba(250, 251, 252, 0.98));
  backdrop-filter: blur(10px);
}

.input-area :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.6;
  border-radius: 12px;
  border: 2px solid #e4e7ed;
  padding: 12px 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  resize: none;
}

.input-area :deep(.el-textarea__inner):focus {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.input-area :deep(.el-textarea__inner):hover {
  border-color: #c0c4cc;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
}

.input-tip {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-tip::before {
  content: '💡';
  font-size: 14px;
}

.input-actions .el-button {
  font-size: 14px;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  transition: all 0.3s ease;
}

.input-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 滚动条样式 */
.message-list::-webkit-scrollbar {
  width: 8px;
}

.message-list::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 4px;
}

.message-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c0c4cc, #909399);
  border-radius: 4px;
  transition: background 0.3s;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #909399, #606266);
}

/* 加载状态 */
.message-assistant .el-icon.is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  
  .input-area {
    padding: 16px;
  }
  
  .message-list {
    padding: 16px;
  }
}
</style>

