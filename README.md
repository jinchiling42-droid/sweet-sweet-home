# Sweet Sweet Home

네 환자의 이야기를 읽고, 사례개념화 보고서를 정리한 뒤 전화 상담을 마치는 데스크톱 미스터리 게임입니다. 업무 기록에서 원하는 환자로 시작하세요.

## 本地启动

在项目目录使用 Node.js 和 npm。

```sh
npm ci
npm run dev
```

用 Chrome 打开终端显示的地址。使用 `npm run build` 生成 `dist/`。运行 `node --test tests/progress.test.mjs` 可验证解锁和存档规则。

## 从个案报告到最终剧情

1. 打开电脑，在「工作记录」任选患者。读完这位患者的三段回忆，每段末尾点击「记录回忆」。
2. 打开「个案报告」，选择同一位患者。记录一项主要行为、一个可能的影响因素、两条证据和一项后续咨询重点。右侧纸张即时更新。提交后显示「记录已归档」，可以重新查看报告。
3. 点击「电话回访」，读到最后并选择「结束通话」。中途可以从顶部「系统设置」存档、读档或退出再回来。
4. 四位患者均完成后，在「隐藏文件夹」自由查看文件。图钉标出本版的必读档案。文字读至末尾，影像和音频可播放至结束或点击「查看完成」，照片可点击放大。
5. 在「贴在相册上的便签」可找到相册密码 `041206`。可随时用密码进入桌面相册，查看并放大照片。
6. 读完必读档案后点击「返回桌面」。点击左下方出现蜡烛的蛋糕，翻完主角评估报告并点击「继续」，进入最终剧情。

自动进度和手动存档保存在当前浏览器。旧版患者故事和电话回访的阅读进度可以沿用，本版个案报告需要重新整理。读回提交前的存档可以修改已提交的报告。

## 替换初始界面美术

初始界面直接显示原始房间图的横向裁切区域。当前取景从原图 (8, 316) 开始，宽 352、高 198（16:9）。场景等比例缩放，外部为纯白色。物品坐标和尺寸均以 736 × 736 原图像素为单位。打开电脑、观察蛋糕和蜡烛解锁继续使用游戏原有的状态与事件。

| 文件 | 内容 |
| --- | --- |
| `src/assets/opening/computer.png` | 129 × 121，上一版的电脑抠图，保留供以后使用。 |
| `src/assets/opening/computer-hotspot.png` | 129 × 121，与原图电脑位置对齐的可见轮廓热区，排除挡住主机的书堆。 |
| `src/assets/opening/strawberry-cake.png` | 335 × 398，原图草莓蛋糕抠图。 |
| `src/assets/opening/strawberry-cake-lit.png` | 同尺寸，已有蜡烛的剧情状态。 |
| `src/assets/source/original-room.png`、`src/assets/source/original-cake.png` | 上传的 736 × 736 原图。 |
| `src/opening-config.ts` | 物品路径、X/Y 坐标、宽度、层级、透明度、悬停亮度和 Alpha 热区阈值；标题位置及可替换图像。 |
| `src/opening.css` | 开场背景、标题排版及响应式缩放。 |
| `src/opening.tsx` | 图片加载、透明像素点击检测和事件连接。 |

需要调整取景时编辑 `openingScene.crop`。蛋糕的位置和大小由 `openingObjects` 中的 X/Y/width 决定。电脑依然显示在原始背景中，热区与原图像素对齐，悬停时只加亮对应区域。若更换原始房间图，需要同步对齐电脑热区。替换蛋糕透明 PNG 时，可以修改导入路径支持 WebP 或 GIF。透明热点由加载图像的 Alpha 通道计算。标题也可导入图像，赋给 `openingTitle.image`。

生产构建会打包原始房间图、实际使用的蛋糕素材与电脑热区，并使用相对资源路径，支持静态托管的子目录。

## 开发调试

通过 `npm run dev` 启动后，打开「设置 → 开发调试」。可以按患者完成故事、提交报告或结束回访，也可以一键完成四位患者、解锁隐藏文件夹、标记单份档案和完成全部必读档案。面板有两种蛋糕状态的预览，也可以返回桌面测试蜡烛，或直接进入主角评估报告和最终剧情。调试会更新当前自动进度，测试前可另存一份手动档。生产构建仅包含玩家流程。

## 替换故事与素材

| 内容 | 文件 |
| --- | --- |
| 患者资料、咨询摘要、回访记录摘要 | `src/patients.ts` |
| 个案报告候选项与证据摘录 | `src/report-content.ts` |
| 咨询回忆、回访对白、最终剧情 | `src/story.ts` 的 `memories`、`calls`、`finalStory` |
| 隐藏文件、必读标记、相册便签与多媒体 | `src/archive-content.ts` 的 `archiveFiles`、`albumPhotos`。将素材作为资源导入并填写 `src`。 |
| 主角评估报告 | `src/evaluation-content.ts` |
| 纸张与档案界面、蛋糕画面 | `src/case-reports.tsx`、`src/hidden-archive.tsx`、`src/evaluation.tsx`、`src/visuals.tsx`、`src/playtest.css` |

每条文本依次填写韩文和中文。替换内容时保留已有档案、回忆和选项的 ID，以便兼容旧存档。

## GitHub Pages 开发与发布

| 项目 | 固定配置 |
| --- | --- |
| 仓库 | `jinchiling42-droid/sweet-sweet-home` |
| 正式试玩 | [Sweet Sweet Home](https://jinchiling42-droid.github.io/sweet-sweet-home/) |
| 发布分支 | `codex/sweet-sweet-home-private-playtest` |
| 发布来源 | Settings → Pages → GitHub Actions |
| 自动化 | [Pages 工作流](.github/workflows/pages.yml) |

1. 从发布分支最新提交创建开发分支。图片、GIF、字体、音频和视频等资源连同引用代码一起提交。游戏资源优先从 `src/assets/` 导入，Vite 保持 `base: './'`。检查文件名大小写及构建产物中的路径。
2. 使用 Node.js 24 运行以下检查，再在 Chrome 中预览构建产物。打开终端显示的地址下的 `/sweet-sweet-home/`，确认改动、页面刷新和新增资源正常。

   ```sh
   npm ci
   node --test tests/progress.test.mjs
   npm run build
   node scripts/check-pages.mjs
   npm exec vite -- preview --base /sweet-sweet-home/
   ```

3. 向发布分支发起 Pull Request，查看 Actions 的构建检查。检查通过后，记录待发布的提交号并取得用户对该版本的发布确认。
4. 合入已确认的版本。发布分支的推送会依次触发 `build`、`deploy` 和 `verify`。`verify` 通过正式地址比较首页及资源文件与当次构建产物的 SHA-256，区分旧缓存与本次发布。
5. 核对三个任务的结果，用 Chrome 打开原正式地址，验证本次改动和实际资源加载。记录已发布的提交号、Actions 运行链接和验证结果。

出现失败时查看 [Actions 运行记录](https://github.com/jinchiling42-droid/sweet-sweet-home/actions) 中失败的任务。构建失败先修复并重测。部署失败检查 Pages 发布来源和 `github-pages` 环境的发布分支规则。校验失败检查正式站点、资源和 CDN 是否已更新。回退时，从当前发布分支创建开发分支，用 `git revert` 撤销有问题的提交。如果是合并提交，执行 `git revert -m 1`。回退候选版本遵循相同的测试和发布确认流程。保留提交历史、现有仓库和正式地址。

发布前的稳定版本可参照 [当前已验证的发布提交 `7f8fef4`](https://github.com/jinchiling42-droid/sweet-sweet-home/commit/7f8fef4c51bc66be7e3a2ae5f48974a013baa37e)。
