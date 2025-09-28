import { fileURLToPath, URL } from 'node:url'

import { type ConfigEnv, type UserConfigExport, loadEnv } from 'vite'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import svgLoader from 'vite-svg-loader'

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const viteEnv = loadEnv(mode, process.cwd())
  return {
    base: viteEnv.VITE_PUBLIC_PATH,
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      svgLoader({ defaultImport: 'url' }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
        symbolId: 'icon-[dir]-[name]',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      /** 设置 host: true 才可以使用 Network 的形式，以 IP 访问项目 */
      host: true, // host: "0.0.0.0"
      /** 端口号 */
      port: 7777,
      /** 是否自动打开浏览器 */
      open: true,
      /** 跨域设置允许 */
      cors: true,
      /** 端口被占用时，是否直接退出 */
      strictPort: false,
      /** 接口代理 */
      proxy: {
        [viteEnv.VITE_BASE_API]: {
          target: viteEnv.VITE_BASE_URL,
          ws: true,
          /** 是否允许跨域 */
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp('^' + viteEnv.VITE_BASE_API), ''),
        },
      },
      /** 预热常用文件，提高初始页面加载速度 */
      warmup: {
        clientFiles: ['./src/layouts/**/*.vue'],
      },
    },
    build: {
      outDir: 'monitor',
      /** 单个 chunk 文件的大小超过 2048KB 时发出警告 */
      chunkSizeWarningLimit: 2048,
      /** 禁用 gzip 压缩大小报告 */
      reportCompressedSize: false,
      /** 打包后静态资源目录 */
      assetsDir: 'static',
    },
  }
}
