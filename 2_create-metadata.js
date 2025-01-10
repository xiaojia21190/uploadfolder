const fs = require('fs');

// 读取文件
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const papers = JSON.parse(fs.readFileSync('200file.json', 'utf8'));

// 获取所有 irysid，按文件名数字排序
const sortedIrysIds = Object.entries(manifest.paths)
    .sort((a, b) => {
        // 将文件名转换为带前导零的三位数进行比较
        const numA = String(parseInt(a[0])).padStart(3, '0');
        const numB = String(parseInt(b[0])).padStart(3, '0');
        return numA.localeCompare(numB);
    })
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