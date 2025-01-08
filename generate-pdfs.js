const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

// 创建 testpdf 目录
const outputDir = 'testpdf';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// 生成单个 PDF
async function generatePDF(index) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const filename = `${index + 1}.pdf`;
        const outputPath = path.join(outputDir, filename);
        
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        doc.end();

        stream.on('finish', () => {
            console.log(`Generated PDF ${index + 1}`);
            resolve();
        });

        stream.on('error', reject);
    });
}

// 生成所有 PDF
async function generateAllPDFs(count = 100) {
    console.log(`Generating ${count} PDF files...`);
    
    for (let i = 0; i < count; i++) {
        try {
            await generatePDF(i);
        } catch (error) {
            console.error(`Error generating PDF ${i + 1}:`, error);
        }
    }
    
    console.log('PDF generation completed!');
}

// 运行生成器
generateAllPDFs(); 