// mqttUtil.ts
import mqtt from "mqtt"
import { ref, reactive } from "vue"
const host = import.meta.env.VITE_MQTT_HOST
const port = import.meta.env.VITE_MQTT_PORT
export const mqttUtil = {
  // MQTT 客户端实例
  client: ref<mqtt.MqttClient | null>(null),

  // 连接配置
  connection: reactive({
    protocol: "wss",
    host: host,
    // port: port,
    clientId: "emqx_vue3_" + Math.random().toString(16).substring(2, 8),
    username: "",
    password: "",
    clean: true,
    connectTimeout: 30 * 1000, // 连接超时
    reconnectPeriod: 4000 // 重连周期（毫秒）
    // will: { topic: "topic/will", payload: "client disconnected", qos: 0, retain: false } // 遗嘱消息
  }),

  // 订阅信息
  subscription: ref({
    topic: "topic/mqttx",
    qos: 0 as mqtt.QoS
  }),

  // 发布信息
  publish: ref({
    topic: "topic/browser",
    qos: 0 as mqtt.QoS,
    payload: '{ "msg": "Hello, I am browser." }'
  }),

  // 连接重试次数
  retryTimes: ref(0),

  // 标志是否正在重连
  isReconnecting: ref(false),

  // 初始化状态
  initData() {
    this.client.value = null
    this.retryTimes = ref(0) // 初始化 retryTimes
    this.isReconnecting = ref(false) // 重置重连标志
  },

  // 创建连接
  createConnection() {
    // console.log(`ready connect mqtt server:${this.connection.host},port:${this.connection.port}`)

    if (this.client.value?.connected || this.client.value) return
    try {
      // debugger
      // const { protocol, host, port, ...options } = this.connection
      const { protocol, host, ...options } = this.connection
      const connectUrl = `${protocol}://${host}`

      // 建立 MQTT 连接
      this.client.value = mqtt.connect(connectUrl, options)

      if (this.client.value) {
        // 监听连接成功事件
        this.client.value.on("connect", this.handleConnect)
        // 监听重连事件
        // this.client.value.on("reconnect", this.handleReConnect)
        // 监听错误事件
        // this.client.value.on("error", this.handleError)
        // 监听断开事件
        // this.client.value.on("close", this.handleClose)
        // 监听离线事件
        // this.client.value.on("offline", this.handleOffline)
        // 监听消息事件
        // this.client.value.on("message", this.handleMessage);
      }
    } catch (error) {
      console.log("mqtt.connect error:", error)
    }
  },
  // 连接成功后的处理逻辑
  handleConnect() {
    console.log("Connection successful")
    this.retryTimes = ref(0) // 初始化 retryTimes
    this.isReconnecting = ref(false) // 重置重连标志
  },

  // 重连后的处理逻辑
  handleReConnect() {
    if (this.retryTimes.value >= 5) {
      console.log("Max reconnect attempts reached.")
      this.isReconnecting.value = false // 防止重复重连
      return
    }

    this.retryTimes.value += 1
    console.log(`Reconnecting... Attempt ${this.retryTimes.value}`)
  },

  // 连接错误处理
  handleError(error: Error) {
    console.log("Connection error:", error)
  },

  // 处理接收到的消息
  handleMessage(topic: string, message: mqtt.MqttMessage) {
    console.log(`Received message on topic: ${topic}`)
    console.log(`Message: ${message.toString()}`)
  },

  // 断开连接的处理逻辑
  handleClose() {
    console.log("MQTT client connection closed")
    // 如果连接断开并且没有进行重连，则触发重连
    console.log("Attempting to reconnect...")
    this.reconnect()
  },

  // 离线事件的处理
  handleOffline() {
    console.log("MQTT client is offline")
    // 离线时尝试重连
    if (!this.isReconnecting.value) {
      console.log("Attempting to reconnect...")
      this.isReconnecting.value = true
      this.reconnect()
    }
  },

  // 重连方法
  reconnect() {
    // 检查客户端是否连接，避免重复连接
    if (this.client.value || this.client.value.connected) {
      console.log("Client is already connected or in reconnecting state.")
      return
    }

    console.log("Attempting to reconnect...")
    this.createConnection()
  },

  // 订阅功能
  doSubscribe(topic: string, qos: mqtt.QoS = 0) {
    if (this.client.value) {
      this.client.value.subscribe(topic, { qos }, (error: Error, granted: mqtt.ISubscriptionGrant[]) => {
        if (error) {
          console.log("Subscribe error:", error)
          return
        }
        console.log("Subscribed successfully:", granted)
      })
    }
  },

  // 取消订阅
  doUnSubscribe(topic: string) {
    if (this.client.value) {
      this.client.value.unsubscribe(topic, (error) => {
        if (error) {
          console.log("Unsubscribe error:", error)
          return
        }
        console.log(`Unsubscribed from topic: ${topic}`)
      })
    }
  },

  // 发布消息
  doPublish(topic: string, payload: string, qos: mqtt.QoS = 0) {
    if (this.client.value) {
      this.client.value.publish(topic, payload, { qos }, (error) => {
        if (error) {
          console.log("Publish error:", error)
          return
        }
        console.log(`Published message: ${payload}`)
      })
    }
  },

  // 销毁连接
  destroyConnection() {
    if (this.client.value?.connected) {
      try {
        this.client.value.end(false, () => {
          this.initData()
          console.log("Disconnected successfully")
        })
      } catch (error) {
        console.log("Disconnect error:", error)
      }
    }
  }
}
