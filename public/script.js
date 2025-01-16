async function getMetadata() {
  try {
    const query = `
            query {
                transactions(
                    tags: [
                        { name: "App-Name", values: ["SciQuery"] },
                        { name: "Collection", values: ["sciquery2"] }
                    ]
                ) {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        `;

    const response = await fetch("https://uploader.irys.xyz/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    const id = result.data?.transactions?.edges?.[0]?.node?.id;
    if (!id) throw new Error("No metadata found");

    const metadataResponse = await fetch(`https://gateway.irys.xyz/${id}`);
    const metadata = await metadataResponse.json();
    return metadata[0]; // 直接返回第一个对象，它包含了所有论文数据
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}

async function search() {
  const searchType = document.getElementById("searchType").value;
  const searchInput = document.getElementById("searchInput").value.toLowerCase();
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "<p>搜索中...</p>";

  const metadata = await getMetadata();
  if (!metadata) {
    resultsDiv.innerHTML = "<p>无法加载论文索引</p>";
    return;
  }

  const papers = Object.values(metadata);
  const results = papers.filter((paper) => {
    if (!paper || typeof paper !== "object") return false;

    switch (searchType) {
      case "doi":
        return paper.doi?.toLowerCase().includes(searchInput);
      case "title":
        return paper.title?.toLowerCase().includes(searchInput);
      case "author":
        return paper.author?.toLowerCase().includes(searchInput);
      default:
        return false;
    }
  });

  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>未找到匹配的论文</p>";
    return;
  }

  resultsDiv.innerHTML = results
    .map(
      (paper) => `
        <div class="paper-item">
            <div class="paper-title">${paper.title || ""}</div>
            <div class="paper-info">作者: ${paper.author || ""}</div>
            <div class="paper-info">DOI: ${paper.doi || ""}</div>
            <a href="https://gateway.irys.xyz/${paper.irysid}" class="paper-link" target="_blank">下载论文</a>
        </div>
    `
    )
    .join("");
}

async function uploadPdf() {
  const doiInput = document.getElementById("doi-input");
  const doi = doiInput.value;
  const pdfInput = document.getElementById("pdf-input");
  const pdfFile = pdfInput.files[0];
  console.log(pdfFile);
  const pdfPath = pdfFile.path;
  console.log(pdfPath);
  // 调用 express/koa 的api
  //   const pdfId = await sliceUploadPdf(pdfPath, doi);
  //   console.log(pdfId);
  //   return pdfId;
}
