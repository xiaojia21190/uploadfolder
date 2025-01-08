async function getMetadata() {
    try {
        // GraphQL 查询
        const query = `
            query {
                transactions(
                    first: 1,
                    tags: [
                        { name: "Content-Type", values: ["application/json"] },
                        { name: "App-Name", values: ["SciQuery"] },
                        { name: "Type", values: ["metadata-index"] },
                        { name: "Collection", values: ["sciquery1"] }
                    ]
                ) {
                    edges {
                        node {
                            id
                            tags {
                                name
                                value
                            }
                        }
                    }
                }
            }
        `;

        // 使用正确的 GraphQL endpoint
        const response = await fetch('https://uploader.irys.xyz/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const result = await response.json();
        console.log('GraphQL Response:', result);

        if (!result.data?.transactions?.edges?.length) {
            throw new Error('No metadata found');
        }

        const metadataId = result.data.transactions.edges[0].node.id;
        console.log('Found metadata ID:', metadataId);

        // 获取实际的 metadata 内容
        const metadataResponse = await fetch(`https://gateway.irys.xyz/${metadataId}`);
        const metadata = await metadataResponse.json();
        console.log('Metadata loaded successfully');
        return metadata;

    } catch (error) {
        console.error('Error fetching metadata:', error);
        return null;
    }
}

async function search() {
    const searchType = document.getElementById('searchType').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const resultsDiv = document.getElementById('results');
    
    resultsDiv.innerHTML = '<p>搜索中...</p>';
    
    const metadata = await getMetadata();
    if (!metadata) {
        resultsDiv.innerHTML = '<p>无法加载论文索引</p>';
        return;
    }
    
    const results = Object.entries(metadata).filter(([_, paper]) => {
        switch (searchType) {
            case 'doi':
                return paper.doi.toLowerCase().includes(searchInput);
            case 'title':
                return paper.title.toLowerCase().includes(searchInput);
            case 'author':
                return paper.author.toLowerCase().includes(searchInput);
            default:
                return false;
        }
    }).map(([id, paper]) => ({
        ...paper,
        downloadUrl: `https://gateway.irys.xyz/${id}`
    }));
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>未找到匹配的论文</p>';
        return;
    }
    
    resultsDiv.innerHTML = results.map(paper => `
        <div class="paper-item">
            <div class="paper-title">${paper.title}</div>
            <div class="paper-info">作者: ${paper.author}</div>
            <div class="paper-info">DOI: ${paper.doi}</div>
            <a href="${paper.downloadUrl}" class="paper-link" target="_blank">下载论文</a>
        </div>
    `).join('');
} 