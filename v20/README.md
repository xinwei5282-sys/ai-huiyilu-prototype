# 云忆 V20：最终版 + 夸一夸

用户确认的线上 V17 为唯一基线。对应正式原型仓库 `ai-huiyilu-prototype`，不是历史 `ai-huiyilu-prototype-uifix`。

## 预览

在本工作目录运行 `python3 -m http.server 8880 --bind 127.0.0.1`。

- 默认讲述入口：http://127.0.0.1:8880/prototype-v20.html
- 直接体验夸夸：http://127.0.0.1:8880/prototype-v20.html#praise
- 版本对照：http://127.0.0.1:8880/v20/versions.html
- 保留的最终版：http://127.0.0.1:8880/prototype-v17.html

## 改动方式

`prototype-v20.html` 精确复制最终 V17，只改变标题并加载附加 CSS/JS。所有原页面和原内联脚本保留；新增能力在 `praise.js` 注入，样式在 `praise.css`，不修改 V17 原文件。

新增3屏及四入口导航，默认仍为讲述；我的新增夸夸记录；回忆预览新增一个可选原文授权。书房不放夸夸，不改采访、追问、人物形象、章节、家人协作、分享和成书流程。

手机直接展示应用，桌面保留页面地图和 PRD 评审面板。首发功能与后端接入范围见 `docs/LAUNCH-SCOPE.md`。

## 本地保存与演示

夸夸使用独立键 `yunyi.praise.v20`，记录原文、照片、夸赞文案与授权来源。草稿在当前页面运行期间保留；已收藏记录可刷新回看。照片仅本地读取压缩，不上传。

原型不含真实 AI、云存储、微信登录和微信分享调用。保存图片导出真实 PNG，可用于演示后续分享路径。共享知识仅模拟同人物且已授权原文的关键词检索；原回忆录演示已有的原声文本，通过可选勾选共享，AI 摘要不会入库。

## 版本与验收

分支：`prototype/v20-praise-integration`，基线提交 `c60bd06`。`version.json` 保存线上地址与内容哈希，避免同名 V17 混淆。V19 仅为历史定位探索稿。

运行 `node v20/qa/verify.cjs` 验收原基线保留、旧路由、采访入口、新业务、授权、持久化、PNG 下载及手机溢出。`node v20/qa/capture.cjs` 生成主页面截图。当前 QA 复用本机已有 V19 浏览器启动工具与原项目的 puppeteer-core；HTML 原型运行无需这些 QA 依赖。

新增照片来自 Unsplash：https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1 。原素材全部沿用基线仓库。
