const fs = require('fs');
const path = require('path');

// Read manifest.json
const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Create metadata object
const metadata = {};

// Process each PDF entry
for (const [pdfPath, details] of Object.entries(manifest.paths)) {
    // Get corresponding JSON file path
    const jsonFileName = pdfPath.replace('.pdf', '.json');
    const jsonPath = path.join(__dirname, 'json', jsonFileName);
    
    try {
        // Read and parse the JSON file
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        // Extract information from openalex data
        const openalexData = jsonData.openalex || {};
        const authors = openalexData.authorships 
            ? openalexData.authorships.map(a => a.author.display_name).join(', ')
            : "";

        // Get DOI without the prefix
        const doi = openalexData.doi 
            ? openalexData.doi.replace('https://doi.org/', '')
            : jsonData.doi || "";  // 如果openalex中没有，尝试使用json根级别的doi

        // Create metadata entry with expanded format
        metadata[details.id] = {
            abstract: "", // 暂时保持为空
            title: openalexData.title || openalexData.display_name || "",
            author: authors,
            doi: doi,
            aid: pdfPath.replace(/\[.*?\]/, '').replace('.pdf', ''),
            irysid: details.id
        };
        
        console.log(`Processed: ${jsonFileName}`);
        
    } catch (error) {
        console.error(`Error processing ${jsonFileName}:`, error.message);
        // 如果读取失败，创建一个基本的记录
        metadata[details.id] = {
            abstract: "",
            title: pdfPath.replace(/\[.*?\]/, '').replace('.pdf', ''),
            author: "",
            doi: pdfPath.match(/\[(.*?)\]/)?.[1] || "", // 直接从文件名提取DOI，不加前缀
            aid: pdfPath.replace(/\[.*?\]/, '').replace('.pdf', ''),
            irysid: details.id
        };
    }
}

// Save metadata.json to current directory
const metadataPath = path.join(__dirname, 'metadata.json');

// No need to check/create directory since we're saving to current directory
fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

console.log('Metadata file generated successfully!');
