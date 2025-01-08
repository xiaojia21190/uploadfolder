const fs = require('fs');

// 读取文件
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const papers = JSON.parse(fs.readFileSync('100file.json', 'utf8'));

// 获取所有 irysid，按文件名数字排序
const sortedIrysIds = Object.entries(manifest.paths)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([_, details]) => details.id);

// 创建一个对象
const metadata = {};

// 为每个论文按顺序分配 irysid
papers.forEach((paper, index) => {
    const irysid = sortedIrysIds[index] || "";
    if (irysid) {
        metadata[irysid] = {
            abstract: paper.abstract || "",
            title: paper.title || "",
            author: paper.authors || "", // 注意这里用 author 而不是 authors
            doi: paper.doi || "",
            aid: paper.aid || "",
            irysid: irysid
        };
    }
});

// 直接写入对象，不要包装在数组中
fs.writeFileSync('metadata.json', JSON.stringify(metadata, null, 2));
console.log('Metadata file generated successfully!'); 