# npm 发布流程

本文档用于记录 `langgraph-vue3-chatbot` 发布到 npm 的标准流程，便于后续重复执行。

## 一、发布前确认

发布前先确认以下配置已经满足：

### 1. 包名

当前包名：

```json
"name": "langgraph-vue3-chatbot"
```

发布前可先检查包名是否已被占用：

```bash
npm view langgraph-vue3-chatbot
```

如果返回 404 或 not found，一般表示该包名还未被占用。

### 2. 可发布状态

当前 `package.json` 中需要保证不是私有包：

```json
"private": false
```

### 3. 发布入口

当前组件库发布入口为：

```json
{
  "main": "./dist-lib/index.js",
  "module": "./dist-lib/index.js",
  "types": "./dist-lib/index.d.ts"
}
```

### 4. 发布文件范围

当前只发布构建产物目录：

```json
"files": ["dist-lib"]
```

## 二、发布前本地检查

### 1. 执行库检查

先在仓库根目录执行：

```bash
pnpm check:lib
```

该命令会：

1. 执行 `build:lib`
2. 检查 `dist-lib/index.js`
3. 检查 `dist-lib/index.d.ts`

只有检查通过后，再进行发布。

### 2. 本地打包预览

执行：

```bash
npm pack
```

该命令会在当前目录生成一个 `.tgz` 安装包。

建议重点确认：

- 包是否能成功打出
- 包内是否包含 `dist-lib`
- 是否包含 `dist-lib/index.js`
- 是否包含 `dist-lib/index.d.ts`

## 三、本地安装验证

建议在另一个 Vue 3 项目中安装刚刚生成的 `.tgz` 文件进行验证。

例如：

```bash
pnpm add /你的本地路径/langgraph-vue3-chatbot-0.1.0.tgz
```

安装后重点验证：

- 是否可以正常导入 `AskAiBot` 和 `ChatBot`
- 是否有类型提示
- 样式是否自动生效
- 聊天组件是否可正常渲染与交互

示例：

```ts
import { AskAiBot, ChatBot } from 'langgraph-vue3-chatbot'
```

## 四、登录 npm

如果本机尚未登录 npm，先执行：

```bash
npm login
```

登录完成后可执行：

```bash
npm whoami
```

确认当前发布账号正确。

## 五、正式发布

在仓库根目录执行：

```bash
npm publish
```

如果需要显式指定公开发布，可执行：

```bash
npm publish --access public
```

## 六、发布后验证

发布完成后可执行：

```bash
npm view langgraph-vue3-chatbot version
```

确认 npm 上已经能查到最新版本。

然后在其他 Vue 3 项目中直接安装验证：

```bash
pnpm add langgraph-vue3-chatbot
```

## 七、推荐的完整发布顺序

推荐按以下顺序执行：

```bash
pnpm check:lib
npm pack
npm login
npm whoami
npm publish
```

如果想更稳妥，建议在 `npm pack` 之后，先在外部 Vue 3 项目里安装 `.tgz` 进行一次完整验证，再执行 `npm publish`。

## 八、版本发布注意事项

### 1. 首次发布

首次发布时，确认 `package.json` 中版本号正确，例如：

```json
"version": "0.1.0"
```

### 2. 后续发布新版本

后续每次重新发布前，都需要先更新版本号，例如：

- `0.1.1`
- `0.2.0`
- `1.0.0`

版本号不能与 npm 上已发布的版本重复。

### 3. Vue 依赖说明

当前 `vue` 通过 `peerDependencies` 声明，由宿主项目提供：

```json
"peerDependencies": {
  "vue": "^3.4.0"
}
```

因此使用方项目需要自行安装符合版本要求的 Vue 3。

## 九、发布失败时优先检查

如果发布失败，优先检查以下问题：

1. `package.json` 中的包名是否已被占用
2. 版本号是否已经发布过
3. 是否已经执行 `pnpm check:lib`
4. `dist-lib/index.js` 与 `dist-lib/index.d.ts` 是否存在
5. 当前 npm 账号是否正确登录
6. 网络或 npm registry 是否正常

## 十、当前项目的发布命令速查

```bash
pnpm check:lib
npm pack
npm login
npm whoami
npm publish
```
