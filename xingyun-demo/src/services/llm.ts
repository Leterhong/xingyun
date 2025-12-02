export interface LLMConfig {
  model: string
  apiKey: string
  baseURL?: string
  systemPrompt?: string
}

export class LLMService {
  private config: LLMConfig
  private conversationHistory: Array<{ role: string; content: string }> = []

  constructor(config: LLMConfig) {
    // 根据模型自动设置 baseURL
    const defaultBaseURL = this.getDefaultBaseURL(config.model)
    
    this.config = {
      baseURL: defaultBaseURL,
      systemPrompt: `你是一位路演数字人洪，专业的数据分析师。

【重要约束】：
1. 每次只回复一段话，不能分多段
2. 回复内容不能超过200个字
3. 必须以句号（。）结尾
4. 绝对不要使用任何表情符号、emoji、特殊符号
5. 不要使用换行符、不要分段、不要使用列表
6. 如果内容太多，只说最核心的一句话
7. 语气简洁、专业、友好

回答示例：
问：你好
答：你好，我是洪，很高兴为您服务。

问：请介绍一下你自己
答：我是路演数字人洪，可以帮您分析数据和解答问题。

问：什么是数据分析
答：数据分析是通过收集和研究数据来发现规律并支持决策的过程。`,
      ...config
    }

    // 初始化对话历史
    this.conversationHistory.push({
      role: 'system',
      content: this.config.systemPrompt!
    })
  }

  /**
   * 根据模型名称获取默认的 baseURL
   */
  private getDefaultBaseURL(model: string): string {
    if (model.startsWith('doubao')) {
      return 'https://ark.cn-beijing.volces.com/api/v3'
    } else if (model.startsWith('deepseek')) {
      return 'https://api.deepseek.com'
    } else if (model.startsWith('qwen')) {
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    } else if (model.startsWith('gpt')) {
      return 'https://api.openai.com/v1'
    } else if (model === 'lanyun-model') {
      return 'https://maas-api.lanyun.net/v1'
    }
    // 默认使用豆包
    return 'https://ark.cn-beijing.volces.com/api/v3'
  }

  /**
   * 发送消息（流式）
   */
  async sendStream(
    userMessage: string,
    onChunk: (chunk: string, done: boolean) => void
  ) {
    // 添加用户消息到历史
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    })

    console.log('🤖 开始LLM请求...', {
      baseURL: this.config.baseURL,
      model: this.config.model,
      hasApiKey: !!this.config.apiKey
    })

    try {
      // 使用 fetch 进行流式请求
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: this.conversationHistory,
          stream: true,
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      console.log('📡 LLM响应状态:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API错误响应:', errorText)
        
        // 根据状态码提供更具体的错误信息
        let errorMessage = `HTTP错误 ${response.status}`
        if (response.status === 401) {
          errorMessage = 'API Key无效或已过期，请检查配置'
        } else if (response.status === 403) {
          errorMessage = 'API访问被拒绝，请检查权限设置'
        } else if (response.status === 404) {
          errorMessage = 'API接口不存在，请检查模型名称和接口地址'
        } else if (response.status === 429) {
          errorMessage = 'API调用频率超限，请稍后重试'
        } else if (response.status >= 500) {
          errorMessage = '服务器内部错误，请稍后重试'
        }
        
        throw new Error(`${errorMessage}: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let assistantMessage = ''
      let chunkCount = 0

      console.log('📥 开始接收流式响应...')

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('✅ 流式响应结束，总接收:', assistantMessage.length, '字，共', chunkCount, '个chunk')
          
          // 添加助手消息到历史
          this.conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
          })
          
          onChunk('', true)
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              console.log('🏁 收到 [DONE] 标记')
              continue
            }

            try {
              const json = JSON.parse(data)
              const content = json.choices?.[0]?.delta?.content || ''
              
              if (content) {
                assistantMessage += content
                chunkCount++
                onChunk(content, false)
                console.log(`📝 Chunk ${chunkCount}:`, content)
              }
            } catch (e) {
              console.error('⚠️ 解析JSON失败:', e, '数据:', data)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('❌ LLM请求失败:', error)
      
      // 根据错误类型提供更友好的错误信息
      let errorMessage = '大模型调用失败'
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = '网络连接失败，请检查网络设置'
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请稍后重试'
      } else if (error.message.includes('API Key')) {
        errorMessage = error.message
      } else {
        errorMessage = `大模型调用失败: ${error.message}`
      }
      
      throw new Error(errorMessage)
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.conversationHistory = [
      {
        role: 'system',
        content: this.config.systemPrompt!
      }
    ]
  }

  /**
   * 获取对话历史
   */
  getHistory() {
    return [...this.conversationHistory]
  }
}
