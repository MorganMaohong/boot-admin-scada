import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { type ConfigEnv, type UserConfigExport, loadEnv } from 'vite'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import svgLoader from 'vite-svg-loader'

function getPackageName(id: string) {
  const normalizedId = id.replace(/\\/g, '/')
  const nodeModulesIndex = normalizedId.lastIndexOf('/node_modules/')
  if (nodeModulesIndex === -1) return ''

  const packagePath = normalizedId.slice(nodeModulesIndex + '/node_modules/'.length)
  const parts = packagePath.split('/')
  if (!parts[0]) return ''
  if (parts[0].startsWith('@')) return `${parts[0]}/${parts[1] || ''}`
  return parts[0]
}

function extractHeadAssets(html: string) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '组态编辑'
  const styles = [...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((match) => match[1])
  const scripts = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)].map((match) => match[1])
  return { title, styles, scripts }
}

function createConditionalIndexPlugin() {
  let outDir = ''

  return {
    name: 'conditional-index-html',
    apply: 'build',
    configResolved(config: { build: { outDir: string } }) {
      outDir = path.resolve(config.build.outDir)
    },
    closeBundle() {
      const displayHtmlPath = path.join(outDir, 'display.html')
      const editorHtmlPath = path.join(outDir, 'editor.html')
      if (!fs.existsSync(displayHtmlPath) || !fs.existsSync(editorHtmlPath)) return

      const displayAssets = extractHeadAssets(fs.readFileSync(displayHtmlPath, 'utf8'))
      const editorAssets = extractHeadAssets(fs.readFileSync(editorHtmlPath, 'utf8'))
      displayAssets.styles = displayAssets.styles.filter((href) => !href.includes('/editor-src-'))

      for (const scriptSrc of displayAssets.scripts) {
        const scriptPath = path.join(outDir, scriptSrc.replace(/^\/monitor\//, ''))
        if (!fs.existsSync(scriptPath)) continue
        const script = fs.readFileSync(scriptPath, 'utf8')
        const nextScript = script
          .replace(/import"\.\/editor-src-[^"]+\.js";/, '')
          .replace(/import"\.\/naive-ui-[^"]+\.js";/, '')
        if (nextScript !== script) {
          fs.writeFileSync(scriptPath, nextScript)
        }
      }

      const title = displayAssets.title || editorAssets.title || '组态编辑'

      const indexHtml = `<!DOCTYPE html>
<html lang="">
<head>
  <meta charset="UTF-8">
  <link rel="icon" href="/monitor/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script>
    const __monitorDisplayAssets = ${JSON.stringify(displayAssets)};
    const __monitorEditorAssets = ${JSON.stringify(editorAssets)};
    const __monitorIsDisplayRoute = (() => {
      const hash = window.location.hash || '';
      const pathname = window.location.pathname || '';
      return hash.startsWith('#/display') || pathname.endsWith('/display');
    })();
    const __monitorAssets = __monitorIsDisplayRoute ? __monitorDisplayAssets : __monitorEditorAssets;

    for (const href of __monitorAssets.styles) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.crossOrigin = '';
      link.href = href;
      document.head.appendChild(link);
    }

    for (const src of __monitorAssets.scripts) {
      const script = document.createElement('script');
      script.type = 'module';
      script.crossOrigin = '';
      script.src = src;
      document.head.appendChild(script);
    }
  </script>
</head>
<body>
<div id="app"></div>
</body>
</html>
`

      fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml)
      fs.rmSync(displayHtmlPath, { force: true })
      fs.rmSync(editorHtmlPath, { force: true })
    },
  }
}

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
      createConditionalIndexPlugin(),
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
      modulePreload: false,
      /** 单个 chunk 文件的大小超过 2048KB 时发出警告 */
      chunkSizeWarningLimit: 2048,
      /** 禁用 gzip 压缩大小报告 */
      reportCompressedSize: false,
      /** 打包后静态资源目录 */
      assetsDir: 'static',
      rollupOptions: {
        input: {
          display: path.resolve(__dirname, 'display.html'),
          editor: path.resolve(__dirname, 'editor.html'),
        },
      },
    },
  }
}
