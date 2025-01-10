const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

// 创建 testpdf 目录
const outputDir = 'testpdf';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// 生成所有 PDF
async function generateAllPDFs(count = 75) {
    console.log(`开始生成 ${count} 个PDF文件...`);
    
    for (let i = 1; i <= count; i++) {
        try {
            const doc = new PDFDocument();
            const paddedNumber = String(i).padStart(3, '0');
            const filename = `${paddedNumber}.pdf`;
            const outputPath = path.join(outputDir, filename);
            
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            doc.end();

            // 使用 Promise 等待文件写入完成
            await new Promise((resolve, reject) => {
                stream.on('finish', () => {
                    console.log(`生成了第 ${paddedNumber} 个PDF文件`);
                    resolve();
                });
                stream.on('error', reject);
            });
        } catch (error) {
            console.error(`生成第 ${i} 个PDF时出错:`, error);
        }
    }
    
    console.log('所有PDF文件都生成完成了！');
}

// 运行生成器
generateAllPDFs(); 