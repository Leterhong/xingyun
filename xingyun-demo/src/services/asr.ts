import CryptoJS from 'crypto-js'

export interface ASRConfig {
  appId: string
  secretId: string
  secretKey: string
  engine?: string
}

export class ASRService {
  private config: ASRConfig
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private stream: MediaStream | null = null
  private isRecording = false

  constructor(config: ASRConfig) {
    this.config = {
      engine: 'zh_CN',
      ...config
    }
  }

  /**
   * 开始录音并识别
   */
  async start(onResult: (text: string, isFinal: boolean) => void) {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })

      // 创建音频上下文
      this.audioContext = new AudioContext({
        sampleRate: 16000
      })

      // 创建媒体录制器
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      const audioChunks: Blob[] = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) return

        // 合并音频数据
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        
        // 这里应该调用实际的ASR API
        // 由于不同的ASR服务API不同，这里提供一个简化的实现
        try {
          const result = await this.recognizeAudio(audioBlob)
          onResult(result, true)
        } catch (error) {
          console.error('语音识别失败:', error)
          onResult('语音识别失败，请重试', true)
        }
      }

      this.mediaRecorder.start()
      this.isRecording = true

      // 实时识别反馈（简化版）
      let silenceTimer: any = null
      const audioLevel = this.createAudioLevelDetector()
      
      audioLevel.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        const sum = input.reduce((acc, val) => acc + Math.abs(val), 0)
        const average = sum / input.length
        
        // 检测静音，自动停止
        if (average < 0.01) {
          if (!silenceTimer) {
            silenceTimer = setTimeout(() => {
              this.stop()
            }, 2000) // 2秒静音自动停止
          }
        } else {
          if (silenceTimer) {
            clearTimeout(silenceTimer)
            silenceTimer = null
          }
        }
      }

    } catch (error: any) {
      console.error('启动录音失败:', error)
      throw new Error(`启动录音失败: ${error.message}`)
    }
  }

  /**
   * 停止录音
   */
  stop() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }

  /**
   * 创建音频电平检测器
   */
  private createAudioLevelDetector() {
    if (!this.audioContext || !this.stream) {
      throw new Error('音频上下文未初始化')
    }

    const source = this.audioContext.createMediaStreamSource(this.stream)
    const processor = this.audioContext.createScriptProcessor(2048, 1, 1)
    
    source.connect(processor)
    processor.connect(this.audioContext.destination)
    
    return processor
  }

  /**
   * 识别音频（需要对接实际的ASR服务）
   * 这里提供一个示例框架，实际使用时需要替换为真实的API调用
   */
  private async recognizeAudio(audioBlob: Blob): Promise<string> {
    // 方案1: 使用腾讯云实时语音识别
    // https://cloud.tencent.com/document/product/1093/48982
    
    // 方案2: 使用阿里云实时语音识别
    // https://help.aliyun.com/document_detail/84428.html
    
    // 方案3: 使用浏览器内置的 Web Speech API（简化方案）
    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore - Web Speech API可能不是所有浏览器都支持
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
        recognition.lang = 'zh-CN'
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          resolve(transcript)
        }

        recognition.onerror = (event: any) => {
          reject(new Error(event.error))
        }

        // 注意：Web Speech API 需要从麦克风直接识别
        // 如果要识别 Blob，需要使用其他方案
        reject(new Error('需要对接真实的ASR服务API'))
        
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 生成腾讯云签名（示例）
   */
  private generateTencentSignature(params: any): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = Math.floor(Math.random() * 1000000)
    
    const signStr = `POSTasr.cloud.tencent.com/asr/v2/${this.config.appId}?${this.formatParams({
      ...params,
      secretid: this.config.secretId,
      timestamp,
      nonce,
      expired: timestamp + 3600
    })}`
    
    return CryptoJS.HmacSHA1(signStr, this.config.secretKey).toString()
  }

  /**
   * 格式化参数
   */
  private formatParams(params: any): string {
    return Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.stop()
  }
}

// 声明 Web Speech API 类型
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

