import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { loadEnv } from 'vite'
// https://vite.dev/config/

export default defineConfig(({ mode }) => {
  // 方式一：获取baseURL
  // 项目根路径
  const root = process.cwd()
  // 通过vite提供的工具方法去加载相应环境的配置
  // 这里的mode其实就是我们 --mode prod的prod
  const { VITE_APP_API_URL } = loadEnv(mode, root)
  return {
    plugins: [
      vue(),
      vueDevTools(),
      AutoImport({
        imports: [
          'vue',
          'pinia',
          'vue-router',
          {
            'xe-utils': ['cloneDeep'],
          },
        ],
        dts: 'src/types/auto-imports.d.ts', // 生成类型声明文件
        eslintrc: {
          enabled: false, //设置true会生成.eslintrc-auto-import.json，然后设置回默认false
        },
        resolvers: [ElementPlusResolver(), IconsResolver()],
        vueTemplate: true, // 是否在 vue 模板中自动导入
      }),
      Components({
        dirs: ['src/components', 'src/layouts/**/components', 'src/views/**/components'], // 自动导入项目组件
        directoryAsNamespace: true, // 启用目录名作为命名空间（避免重名）
        dts: 'src/types/components.d.ts', // 生成组件类型声明文件
        resolvers: [ElementPlusResolver()], // 第三方 UI 库解析器（如 Element Plus）
      }),
      Icons({
        autoInstall: true,
        // scale: 1,
        // warn: true,
        // compiler: 'vue3',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      open: true,
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: VITE_APP_API_URL, // 方式一
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
      cors: true,
      hmr: {
        timeout: 10000,
        overlay: true,
      },
    },
    css: {
      // CSS 预处理器
      preprocessorOptions: {
        //define global scss variable
        scss: {
          additionalData: `@use "@/styles/variables.scss" as *;`,
        },
      },
    },
  }
})
