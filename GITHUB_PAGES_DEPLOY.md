# 🚀 安监智能查询系统 — GitHub Pages 部署指南

> 按顺序执行以下步骤，每一步都有截图提示位置。

---

## 第一步：配置 Git 身份信息

打开 **Git Bash**（或终端），执行：

```bash
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的GitHub邮箱"
```

> 💡 这两行只需要配一次，以后所有项目通用。邮箱建议用 GitHub 注册时的**主邮箱**。

---

## 第二步：提交代码

```bash
# 进入项目目录
cd C:/Users/asus/Desktop/安监系统重构

# 初始化仓库（已完成可跳过）
git init
git branch -m main

# 添加所有文件并提交
git add .
git commit -m "安监智能查询系统 - 模块化重构版"
```

---

## 第三步：在 GitHub 上创建仓库

1. 打开浏览器访问 **https://github.com/new**
2. 填写信息：
   - **Repository name**：`anjian-system`（或你喜欢的名字）
   - **Description**：`安监智能查询系统`
   - 选择 **🔒 Private**（私有）或 **🌍 Public**（公开，Pages 才能免费访问）
3. ⚠️ **不要勾选** "Add a README file"、"Add .gitignore"、"Choose a license"
4. 点击 **Create repository**

---

## 第四步：推送代码到 GitHub

创建仓库后，GitHub 会显示推送命令，复制类似下面的命令执行：

```bash
git remote add origin https://github.com/你的用户名/anjian-system.git
git push -u origin main
```

> 🔑 如果弹出登录窗口，输入你的 GitHub 账号密码（或用 Personal Token）

---

## 第五步：开启 GitHub Pages（关键！）

1. 进入你刚创建的仓库页面
2. 点击顶部菜单栏的 **Settings**（设置）
3. 左侧菜单找到 **Pages**（页面）选项，点击进入
4. 配置以下选项：

| 设置项 | 选择值 |
|--------|--------|
| **Source** | Deploy from a branch |
| **Branch** | `main` |
| **Folder** | `/ (root)` |

5. 点击 **Save**

---

## 第六步：获取访问地址

保存后页面会显示：

> 🌐 **Your site is ready to be published at:**
>
> `https://你的用户名.github.io/anjian-system/`

⏳ 第一次部署需要 **1-2 分钟**，刷新页面看到绿色✅标记就说明成功了！

---

## 第七步：（可选）绑定自定义域名

如果你有自己的域名（如 `anjian.example.com`）：

1. 在 Pages Settings 页面找到 **Custom domain**
2. 输入域名 → Save
3. 去你的域名 DNS 管理处添加 CNAME 记录：
   - 主机记录：`www`（或 `@`）
   - 记录值：`你的用户名.github.io.`

---

## 日常更新流程

每次修改代码后，只需三步：

```bash
cd C:/Users/asus/Desktop/安监系统重构
git add .
git commit -m "描述你改了什么"
git push
```

Push 后 GitHub Pages 会**自动重新部署**，约 1-2 分钟后生效。

---

## ⚠️ 常见问题排查

### Q1：页面显示空白 / 样式丢失
- **原因**：文件路径用了绝对路径（如 `C:/...`）
- **解决**：确保所有 CSS/JS 引用使用**相对路径**（当前已修复 ✅）

### Q2：404 页面找不到
- 检查 Branch 是否选了 `main`（不是 master）
- 检查 Folder 是否选了 `/ (root)`

### Q3：push 时报错 "Authentication failed"
- GitHub 已禁用密码登录，需要用 **Personal Access Token**：
  1. GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  2. 勾选 `repo` 权限
  3. 生成后用 Token 代替密码输入

### Q4：更新后网站没变化
- Pages 部署有延迟，等 1-2 分钟再试
- 在仓库 Actions 页面可以看到部署进度

### Q5：豆包/智能助手模块无法使用
- 这是正常的！豆包模块依赖 doubao.com 的 iframe，在非 HTTPS 环境或跨域时可能受限
- 本地使用双击 `index.html` 即可完整体验

---

## 📋 部署检查清单

- [ ] Git 用户名和邮箱已配置
- [ ] 代码已 commit 并 push 到 GitHub
- [ ] 仓库设为 Public（Private 需要 Pro 账号才能用 Pages）
- [ ] Pages 设置中 Branch 选 `main`、Folder 选 `/ (root)`
- [ ] 浏览器访问 `https://你的用户名.github.io/仓库名/` 确认正常

全部打 ✅ 就大功告成了！🎉
