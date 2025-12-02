export interface DiagnosticResult {
  category: 'network' | 'auth' | 'sdk' | 'config' | 'llm'
  status: 'success' | 'warning' | 'error'
  message: string
  details?: any
}

export class DiagnosticService {
  
  /**
   * 全面诊断数字人连接问题
   */
  static async diagnoseConnection(config: any): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []

    // 1. 检查配置完整性
    results.push(...this.checkConfiguration(config))

    // 2. 检查网络连接
    results.push(...await this.checkNetworkConnectivity())

    // 3. 检查SDK加载
    results.push(...this.checkSDKLoading())

    // 4. 检查认证信息
    if (config.appId && config.appSecret) {
      results.push(...await this.checkAuthentication(config))
    }

    // 5. 检查LLM配置
    if (config.llmModel && config.llmApiKey) {
      results.push(...await this.checkLLMConnection(config))
    }

    return results
  }

  /**
   * 检查配置完整性
   */
  private static checkConfiguration(config: any): DiagnosticResult[] {
    const results: DiagnosticResult[] = []

    // 检查魔珐星云配置
    if (!config.appId) {
      results.push({
        category: 'config',
        status: 'error',
        message: '魔珐星云 App ID 未配置'
      })
    } else if (config.appId.length < 10) {
      results.push({
        category: 'config',
        status: 'warning',
        message: '魔珐星云 App ID 格式可能不正确'
      })
    } else {
      results.push({
        category: 'config',
        status: 'success',
        message: '魔珐星云 App ID 已配置'
      })
    }

    if (!config.appSecret) {
      results.push({
        category: 'config',
        status: 'error',
        message: '魔珐星云 App Secret 未配置'
      })
    } else if (config.appSecret.length < 20) {
      results.push({
        category: 'config',
        status: 'warning',
        message: '魔珐星云 App Secret 格式可能不正确'
      })
    } else {
      results.push({
        category: 'config',
        status: 'success',
        message: '魔珐星云 App Secret 已配置'
      })
    }

    // 检查LLM配置
    if (!config.llmModel) {
      results.push({
        category: 'llm',
        status: 'warning',
        message: 'LLM模型未选择，将无法进行AI对话'
      })
    } else {
      results.push({
        category: 'llm',
        status: 'success',
        message: `LLM模型已选择: ${config.llmModel}`
      })
    }

    if (!config.llmApiKey) {
      results.push({
        category: 'llm',
        status: 'warning',
        message: 'LLM API Key未配置，将无法进行AI对话'
      })
    } else if (config.llmApiKey.length < 20) {
      results.push({
        category: 'llm',
        status: 'warning',
        message: 'LLM API Key 格式可能不正确'
      })
    } else {
      results.push({
        category: 'llm',
        status: 'success',
        message: 'LLM API Key 已配置'
      })
    }

    return results
  }

  /**
   * 检查网络连接
   */
  private static async checkNetworkConnectivity(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []

    try {
      // 检查SDK文件访问
      await fetch('https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar@latest.js', {
        method: 'HEAD',
        mode: 'no-cors'
      })
      
      results.push({
        category: 'network',
        status: 'success',
        message: '魔珐星云SDK文件可访问'
      })
    } catch (error) {
      results.push({
        category: 'network',
        status: 'error',
        message: '无法访问魔珐星云SDK文件，请检查网络连接',
        details: error
      })
    }

    try {
      // 检查网关连接（会返回401，但说明网络可达）
      // 修复后代码：
      await fetch('https://nebula-agent.xingyun3d.com/user/v1/ttsa/session', {
        method: 'HEAD',
        mode: 'no-cors'
      })
      
      results.push({
        category: 'network',
        status: 'success',
        message: '魔珐星云网关服务器可达'
      })
    } catch (error) {
      results.push({
        category: 'network',
        status: 'error',
        message: '无法连接到魔珐星云网关服务器',
        details: error
      })
    }

    return results
  }

  /**
   * 检查SDK加载
   */
  private static checkSDKLoading(): DiagnosticResult[] {
    const results: DiagnosticResult[] = []

    if (typeof window !== 'undefined' && window.XmovAvatar) {
      results.push({
        category: 'sdk',
        status: 'success',
        message: '魔珐星云SDK已加载'
      })
    } else {
      results.push({
        category: 'sdk',
        status: 'error',
        message: '魔珐星云SDK未加载，请检查script标签或刷新页面'
      })
    }

    return results
  }

  /**
   * 检查认证信息
   */
  private static async checkAuthentication(config: any): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []

    try {
      // 尝试连接网关（预期会返回401，但能说明认证信息格式）
      const response = await fetch('https://nebula-agent.xingyun3d.com/user/v1/ttsa/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: config.appId,
          appSecret: config.appSecret
        })
      })

      if (response.status === 401) {
        results.push({
          category: 'auth',
          status: 'warning',
          message: '网关可达但认证失败，请检查App ID和App Secret是否正确'
        })
      } else if (response.status === 400) {
        results.push({
          category: 'auth',
          status: 'error',
          message: '认证信息格式错误，请检查App ID和App Secret格式'
        })
      } else {
        results.push({
          category: 'auth',
          status: 'success',
          message: '认证信息格式正确'
        })
      }
    } catch (error) {
      results.push({
        category: 'auth',
        status: 'error',
        message: '无法验证认证信息',
        details: error
      })
    }

    return results
  }

  /**
   * 检查LLM连接
   */
  private static async checkLLMConnection(config: any): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []

    let baseURL = ''
    if (config.llmModel.startsWith('doubao')) {
      baseURL = 'https://ark.cn-beijing.volces.com/api/v3'
    } else if (config.llmModel.startsWith('deepseek')) {
      baseURL = 'https://api.deepseek.com'
    } else if (config.llmModel.startsWith('qwen')) {
      baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    } else if (config.llmModel.startsWith('gpt')) {
      baseURL = 'https://api.openai.com/v1'
    } else if (config.llmModel === 'lanyun-model') {
      baseURL = 'https://maas-api.lanyun.net/v1'
    }

    if (baseURL) {
      try {
        const response = await fetch(`${baseURL}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.llmApiKey}`
          }
        })

        if (response.ok) {
          results.push({
            category: 'llm',
            status: 'success',
            message: 'LLM API连接正常'
          })
        } else if (response.status === 401) {
          results.push({
            category: 'llm',
            status: 'error',
            message: 'LLM API Key无效或已过期'
          })
        } else {
          results.push({
            category: 'llm',
            status: 'warning',
            message: `LLM API返回状态码: ${response.status}`
          })
        }
      } catch (error) {
        results.push({
          category: 'llm',
          status: 'error',
          message: '无法连接到LLM API服务器',
          details: error
        })
      }
    }

    return results
  }

  /**
   * 获取诊断建议
   */
  static getRecommendations(results: DiagnosticResult[]): string[] {
    const recommendations: string[] = []
    const errors = results.filter(r => r.status === 'error')
    const warnings = results.filter(r => r.status === 'warning')

    if (errors.length > 0) {
      recommendations.push('🔴 发现严重问题，需要立即解决：')
      errors.forEach(error => {
        if (error.category === 'config') {
          recommendations.push(`• 请在配置页面填写正确的${error.message.includes('App ID') ? 'App ID' : 'App Secret'}`)
        } else if (error.category === 'network') {
          recommendations.push('• 请检查网络连接，确保可以访问外网')
        } else if (error.category === 'sdk') {
          recommendations.push('• 请刷新页面重新加载SDK')
        } else if (error.category === 'auth') {
          recommendations.push('• 请检查魔珐星云平台获取正确的认证信息')
        } else if (error.category === 'llm') {
          recommendations.push('• 请检查LLM API Key是否正确')
        }
      })
    }

    if (warnings.length > 0) {
      recommendations.push('\n🟡 发现潜在问题，建议优化：')
      warnings.forEach(warning => {
        recommendations.push(`• ${warning.message}`)
      })
    }

    if (errors.length === 0 && warnings.length === 0) {
      recommendations.push('✅ 所有检查通过，系统运行正常！')
    }

    return recommendations
  }
}