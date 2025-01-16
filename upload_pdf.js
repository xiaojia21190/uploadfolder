require("dotenv").config(); // 加载 .env 文件中的环境变量
const { Uploader } = require("@irys/upload");
const { Solana } = require("@irys/upload-solana");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const MAX_SLICE_SIZE = 50 * 1024;

const getIrysUploader = async () => {
  try {
    const irysUploader = await Uploader(Solana).withWallet(process.env.PRIVATE_KEY);
    console.log("Irys uploader initialized.");
    return irysUploader;
  } catch (error) {
    console.error("Failed to initialize Irys uploader:", error);
  }
};

const sliceUploadPdf = async (inputPath, doi) => {
  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入路径不存在: ${inputPath}`);
    }

    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    let fileBase64 = await pdfDoc.saveAsBase64();

    // 获取文件总大小
    const fileSize = fileBase64.length;
    console.log(`File size: ${fileSize} bytes`);

    // 创建分割后的块数组
    const chunks = [];
    for (let i = 0; i < fileBase64.length; i += MAX_SLICE_SIZE) {
      const chunk = fileBase64.slice(i, i + MAX_SLICE_SIZE);
      chunks.push(chunk);
    }

    console.log(`Total chunks created: ${chunks.length}`);

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

    // 使用正确的 GraphQL endpoint
    const response = await fetch("https://uploader.irys.xyz/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    const id = result.data?.transactions?.edges?.[0]?.node?.id;
    if (id) {
      console.log(`PDF index ID: ${id}`);
      // 获取所有pdf的id
      let pdfIds = [];
      result.data.transactions.edges.forEach((edge) => {
        pdfIds.push(edge.node.id);
      });
      console.log(`PDF IDs: ${pdfIds.join(", ")}`);
      return pdfIds;
    }

    const irys = await getIrysUploader();

    if (!irys) {
      console.error("Irys uploader could not be initialized.");
      return;
    }

    let receiptIDs = [];
    const tags = [
      { name: "Content-Type", value: "application/pdf" },
      { name: "App-Name", value: "SciQuery" },
      { name: "Type", value: "pdf-index" },
      { name: "Collection", value: doi },
    ];
    for (const slice of chunks) {
      console.log(`\nUploading slice...`);
      const receipt = await irys.upload(Buffer.from(slice), { tags: tags });
      receiptIDs.push(receipt.id);
      console.log(`Explorer URL: https://gateway.irys.xyz/${receipt.id}`);
    }

    console.log(`\nPDF uploaded successfully!\nReceipt IDs: ${receiptIDs.join(", ")}`);

    return receiptIDs;
  } catch (error) {
    console.error("切割PDF时发生错误:", error.message);
    throw error;
  }
};

const mergeSlices = async (doi, outputPath) => {
  //根据doi查询数据
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

  // 使用正确的 GraphQL endpoint
  const response = await fetch("https://uploader.irys.xyz/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();
  const id = result.data?.transactions?.edges?.[0]?.node?.id;
  if (id) {
    console.log(`PDF index ID: ${id}`);
    // 获取所有pdf的id
    let pdfIds = [];
    result.data.transactions.edges.forEach((edge) => {
      pdfIds.push(edge.node.id);
    });
    let pdfTexts = [];
    for (const pdfId of pdfIds) {
      const pdf = await fetch(`https://gateway.irys.xyz/${pdfId}`, {
        method: "GET",
      });
      const pdfBuffer = await pdf.text();
      pdfTexts.push(pdfBuffer);
    }
    // 合并切片
    const mergedBase64 = pdfTexts.join("");
    const mergedBuffer = Buffer.from(mergedBase64, "base64");
    fs.writeFileSync(outputPath, mergedBuffer);
    console.log(`PDF merged successfully to: ${outputPath}`);
  }
};

// 使用示例
const inputPdfPath = path.join(__dirname, "10.1017%2Fs0263574718001145.pdf"); // 替换为你的输入 PDF 文件路径
// const outputPdfPath = path.join(__dirname, "output.pdf"); // 替换为你的输出 PDF 文件路径

(async () => {
  // const pdfId = await sliceUploadPdf(inputPdfPath, "10.1017/s0263574718001145");
  // console.log(pdfId);
  await mergeSlices("10.1017/s0263574718001145", "output.pdf");
})();

module.exports = {
  getIrysUploader,
  sliceUploadPdf,
  mergeSlices,
};
