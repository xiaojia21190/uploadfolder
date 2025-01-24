// 后台脚本，可以根据需要添加功能

// 设置最大切片大小为50KB
const MAX_SLICE_SIZE = 50 * 1024;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "UPLOAD_PDF") {
    handlePdfUpload(request.pdfBase64, request.doi)
      .then((receiptIds) => {
        sendResponse({ success: true, receiptIds });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开启
  }
});

async function handlePdfUpload(pdfBase64, doi) {
  try {
    // 更新上传状态
    await chrome.storage.local.set({
      uploadStatus: {
        status: "processing",
        message: "开始处理文件...",
        progress: 0,
      },
    });

    const chunks = [];
    for (let i = 0; i < pdfBase64.length; i += MAX_SLICE_SIZE) {
      const chunk = pdfBase64.slice(i, i + MAX_SLICE_SIZE);
      chunks.push(chunk);
    }

    console.log(`Total chunks created: ${chunks.length}`);

    // 检查是否已存在相同DOI的PDF
    const existingIds = await checkExistingPdf(doi);
    if (existingIds.length > 0) {
      await chrome.storage.local.set({
        uploadStatus: {
          status: "exists",
          message: "文件已存在",
          receiptIds: existingIds,
        },
      });
      return existingIds;
    }

    // 上传每个切片
    const receiptIds = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const progress = Math.round((i / chunks.length) * 100);

      // 更新进度
      await chrome.storage.local.set({
        uploadStatus: {
          status: "uploading",
          message: `正在上传第 ${i + 1}/${chunks.length} 块...`,
          progress: progress,
        },
      });

      const response = await uploadToIrys(chunk, doi);
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const result = await response.json();
      receiptIds.push(result.id);
    }

    // 更新完成状态
    await chrome.storage.local.set({
      uploadStatus: {
        status: "completed",
        message: "上传完成！",
        progress: 100,
        receiptIds: receiptIds,
      },
    });

    return receiptIds;
  } catch (error) {
    // 更新错误状态
    await chrome.storage.local.set({
      uploadStatus: {
        status: "error",
        message: `上传失败: ${error.message}`,
        progress: 0,
      },
    });
    console.error("Error uploading PDF:", error);
    throw error;
  }
}

async function checkExistingPdf(doi) {
  const query = `
    query {
      transactions(
        tags: [
          { name: "Content-Type", values: ["application/pdf"] },
          { name: "App-Name", values: ["SciQuery"] },
          { name: "Type", values: ["pdf-index"] },
          { name: "Collection", values: ["${doi}"] }
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();
  const pdfIds = result.data?.transactions?.edges?.map((edge) => edge.node.id) || [];
  return pdfIds;
}

async function uploadToIrys(chunk, doi) {
  const tags = [
    { name: "Content-Type", value: "application/pdf" },
    { name: "App-Name", value: "SciQuery" },
    { name: "Type", value: "pdf-index" },
    { name: "Collection", value: doi },
  ];

  // 这里需要替换为实际的Irys上传endpoint
  return fetch("https://your-irys-endpoint.com/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: chunk,
      tags: tags,
    }),
  });
}
