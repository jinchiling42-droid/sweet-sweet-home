# Sweet Sweet Home 项目规范

- 固定 GitHub 仓库 `jinchiling42-droid/sweet-sweet-home`、正式试玩地址 `https://jinchiling42-droid.github.io/sweet-sweet-home/` 和发布分支 `codex/sweet-sweet-home-private-playtest`。保留 GitHub Pages 的 GitHub Actions 发布来源和 Vite 的相对资源路径。
- 从最新发布分支创建开发分支。新资源随代码一起提交，通过 Vite 导入或使用兼容 Pages 子路径的本地资源路径，并检查大小写。
- 按 [README 的发布流程](README.md#github-pages-开发与发布) 测试完成并取得用户对该版本的发布确认后，才合入发布分支。开发分支的 Pull Request 检查只构建与测试。
- 发布后核对 GitHub Actions 中的构建、部署和正式站点校验。用 Chrome 打开原正式地址，实际验证本次改动和新增资源。
- 保留 Git 提交历史及每次稳定发布的提交号。发布异常时在当前仓库排查，回退使用新的提交，沿用相同的测试与发布确认流程。
- 每次交付从 **仅完成开发，尚未发布**、**测试完成，等待发布** 和 **已成功部署至正式网页** 中注明一项状态。
