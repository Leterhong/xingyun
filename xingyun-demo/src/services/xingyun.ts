// 声明全局XmovAvatar类型
declare global {
  interface Window {
    XmovAvatar: any
  }
}

export interface XingyunConfig {
  containerId: string
  appId: string
  appSecret: string
  gatewayServer?: string
  onMessage?: (message: any) => void
  onStateChange?: (state: string) => void
  onStatusChange?: (status: any) => void
  onStateRenderChange?: (state: string, duration: number) => void
  onNetworkInfo?: (info: any) => void
  onVoiceStateChange?: (status: string) => void
  onWidgetEvent?: (data: any) => void
  proxyWidget?: Record<string, (data: any) => void>
  enableLogger?: boolean
}

export class XingyunService {
  private sdk: any = null
  private config: XingyunConfig

  constructor(config: XingyunConfig) {
    this.config = {
      gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',
      ...config
    }
  }

  /**
   * 初始化SDK
   */
  async init(options?: { onDownloadProgress?: (progress: number) => void }) {
    if (!window.XmovAvatar) {
      throw new Error('魔珐星云SDK未加载，请检查script标签')
    }

    this.sdk = new window.XmovAvatar({
      containerId: this.config.containerId,
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      gatewayServer: this.config.gatewayServer,
      onMessage: this.config.onMessage,
      onStateChange: this.config.onStateChange,
      onStatusChange: this.config.onStatusChange,
      onStateRenderChange: this.config.onStateRenderChange,
      onNetworkInfo: this.config.onNetworkInfo,
      onVoiceStateChange: this.config.onVoiceStateChange,
      onWidgetEvent: this.config.onWidgetEvent,
      proxyWidget: this.config.proxyWidget,
      enableLogger: this.config.enableLogger || false
    })

    await this.sdk.init(options)
  }

  /**
   * 让数字人说话
   */
  speak(text: string, isStart: boolean = true, isEnd: boolean = true) {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.speak(text, isStart, isEnd)
  }

  /**
   * 切换到待机状态
   */
  idle() {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.idle()
  }

  /**
   * 切换到待机互动状态
   */
  interactiveidle() {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.interactiveidle()
  }

  /**
   * 切换到倾听状态
   */
  listen() {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.listen()
  }

  /**
   * 切换到思考状态
   */
  think() {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.think()
  }

  /**
   * 设置音量
   */
  setVolume(volume: number) {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.setVolume(volume)
  }

  /**
   * 显示调试信息
   */
  showDebugInfo() {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.showDebugInfo()
  }

  /**
   * 隐藏调试信息
   */
  hideDebugInfo() {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.hideDebugInfo()
  }

  /**
   * 切换到离线模式
   */
  offlineMode() {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.offlineMode()
  }

  /**
   * 切换到在线模式
   */
  onlineMode() {
    if (!this.sdk) throw new Error('SDK未初始化')
    this.sdk.onlineMode()
  }

  /**
   * 销毁SDK
   */
  destroy() {
    if (this.sdk) {
      this.sdk.destroy()
      this.sdk = null
    }
  }

  /**
   * 检查SDK是否已初始化
   */
  isInitialized(): boolean {
    return this.sdk !== null
  }
}
