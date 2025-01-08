<<<<<<< HEAD
# uploadfolder
Upload 100T files for paper search and storage system based on Irys

## 使用方法

### 1. 准备工作
- 安装依赖：`npm install`
- 创建 `.env` 文件并添加 Solana 钱包私钥：

### 2. 上传论文
- 创建 `pdf` 文件夹并放入要上传的论文
- 创建 `json` 文件夹存放论文元数据
```bash
node upload.js
```
将 pdf 文件夹中的论文上传到 Irys

### 3. 生成元数据
```bash
node getmetadata.js
```

### 4. 上传元数据
```bash
node uploadmetadata.js
```
将元数据上传到 Irys

### 5. 搜索论文
```bash
node query.js
```
可以通过以下方式搜索：
- DOI
- 标题关键词
- 作者姓名
=======
Directly searching PDF by irys query
>>>>>>> 26089003ba314997ae87b682ba842ade35350e1f
