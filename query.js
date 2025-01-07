const readline = require('readline');
const fs = require('fs');

// 创建readline接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 创建异步问题函数
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// 获取metadata
async function getMetadata() {
    try {
        const { metadataId } = JSON.parse(fs.readFileSync('metadata-id.json', 'utf8'));
        const response = await fetch(`https://gateway.irys.xyz/${metadataId}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return null;
    }
}

// 搜索函数
async function searchPapers(metadata, searchParams) {
    if (!metadata) return [];
    
    return Object.entries(metadata).filter(([_, paper]) => {
        if (searchParams.doi && paper.doi.toLowerCase().includes(searchParams.doi.toLowerCase())) {
            return true;
        }
        if (searchParams.title && paper.title.toLowerCase().includes(searchParams.title.toLowerCase())) {
            return true;
        }
        if (searchParams.author && paper.author.toLowerCase().includes(searchParams.author.toLowerCase())) {
            return true;
        }
        return false;
    }).map(([id, paper]) => ({
        ...paper,
        downloadUrl: `https://gateway.irys.xyz/${id}`
    }));
}

// 主程序
async function main() {
    // 首先获取metadata
    console.log('正在加载论文索引...');
    const metadata = await getMetadata();
    if (!metadata) {
        console.error('无法加载论文索引');
        return;
    }

    while (true) {
        console.log('\n=== 论文搜索系统 ===');
        console.log('1. 通过DOI搜索');
        console.log('2. 通过标题搜索');
        console.log('3. 通过作者搜索');
        console.log('4. 退出');

        const choice = await askQuestion('请选择搜索方式 (1-4): ');

        if (choice === '4') {
            break;
        }

        let searchParams = {};
        
        switch (choice) {
            case '1':
                searchParams.doi = await askQuestion('请输入DOI: ');
                break;
            case '2':
                searchParams.title = await askQuestion('请输入标题关键词: ');
                break;
            case '3':
                searchParams.author = await askQuestion('请输入作者姓名: ');
                break;
            default:
                console.log('无效的选择');
                continue;
        }

        console.log('\n正在搜索...');
        const results = await searchPapers(metadata, searchParams);

        if (results.length === 0) {
            console.log('未找到匹配的论文');
        } else {
            console.log('\n找到以下论文：');
            results.forEach((paper, index) => {
                console.log(`\n${index + 1}. ${paper.title}`);
                console.log(`   作者: ${paper.author}`);
                console.log(`   DOI: ${paper.doi}`);
                console.log(`   下载链接: ${paper.downloadUrl}`);
            });
        }

        await askQuestion('\n按回车键继续...');
    }

    rl.close();
    console.log('感谢使用！');
}

// 运行程序
main().catch(console.error);
