import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import WindiCSS from 'vite-plugin-windicss';
import theme from './src/assets/style/theme.js';
import viteCompression from 'vite-plugin-compression';

import path from 'path'
export default defineConfig(({ command, mode }) => {
  const root = process.cwd(); // 项目绝对路径
  const env = loadEnv(mode, root); // mode: 开发环境/生产环境； env: env配置文件

  return {
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: theme,
          javascriptEnabled: true,
          // 更多自定义样式
          additionalData: `@import "${path.resolve(__dirname, 'src/assets/style/mixins.less')}";`
        },
      },
    },
    plugins: [
      vue(),
      vueJsx({
        transformOn: true,
      }),
      Components({
        dts: true,
        dirs: ["src/components/global"], // 按需加载的文件夹
        extensions: ["vue", "js", "ts", "jsx", "tsx"], // 扩展属性
        resolvers: [AntDesignVueResolver()], // AntDesignVueResolver 按需加载
      }),
      AutoImport({
        imports: ["vue", "vue-router"],
      }),
      WindiCSS(),
      viteCompression({
        threshold: 500000, // 启用压缩的文件大小限制，单位是字节，默认为0
        deleteOriginFile: false, // 压缩后删除原文件
        algorithm: 'gzip', // 压缩算法
      }),
    ],
    base: "./", // ./ 本地双击可打开, 默认 /
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: true,
      open: true,
      port: 8004,
      strictPort: false,
      cors: true,
      proxy: {
        "/gateway": {
          target: "http://192.168.0.188:8080",
          changeOrigin: true, 
          rewrite: (path) => {
            return path.replace(/\/gateway/, "");
          },
        },
      },
      hmr: true,
    },
    build: {
      outDir: 'docker/dist',
      assetsDir: 'assets',
    },
  };
});
