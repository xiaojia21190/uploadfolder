require("dotenv").config(); // 加载 .env 文件中的环境变量
const { Uploader } = require("@irys/upload");
const { Solana } = require("@irys/upload-solana");
const fs = require("fs");
const path = require("path");
const BigNumber = require("bignumber.js");

const getIrysUploader = async () => {
  try {
    const irysUploader = await Uploader(Solana).withWallet(process.env.PRIVATE_KEY);
    console.log("Irys uploader initialized.");
    return irysUploader;
  } catch (error) {
    console.error("Failed to initialize Irys uploader:", error);
  }
};

// 计算文件夹大小
const getFolderSize = (folderPath) => {
  let totalSize = 0;
  const files = fs.readdirSync(folderPath);
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      totalSize += stats.size;
    }
  }
  return totalSize;
};

const lazyFund = async (irys, size) => {
  try {
    // 获取上传价格
    const price = await irys.getPrice(size);
    console.log(`上传 ${size} 字节需要: ${irys.utils.fromAtomic(price)} ${irys.token}`);

    // 获取当前余额
    const balance = await irys.getBalance();
    console.log(`当前余额: ${irys.utils.fromAtomic(balance)} ${irys.token}`);

    // 如果余额不足，进行 Lazy-Funding
    if (new BigNumber(balance).lt(new BigNumber(price))) {
      console.log("余额不足，正在进行 Lazy-Funding...");
      // 获取充值交易
      const fundTx = await irys.fund(price);
      console.log("充值交易已创建，正在提交...");
      
      // 提交充值交易
      const response = await irys.funder.submitFundTransaction(fundTx.id);
      console.log(`充值成功！交易ID: ${fundTx.id}`);
      
      // 再次检查余额
      const newBalance = await irys.getBalance();
      console.log(`充值后余额: ${irys.utils.fromAtomic(newBalance)} ${irys.token}`);
    }
    return true;
  } catch (e) {
    console.error("Lazy-Funding 失败:", e);
    return false;
  }
};

const uploadFolder = async () => {
  const folderToUpload = "./testpdf";
  const irys = await getIrysUploader();

  if (!irys) {
    console.error("Irys uploader could not be initialized.");
    return;
  }

  try {
    // 添加文件检查
    const files = fs.readdirSync(folderToUpload).filter(f => f.endsWith('.pdf'));
    console.log(`准备上传的文件数量: ${files.length}`);
    
    const folderSize = getFolderSize(folderToUpload);
    console.log(`文件夹总大小: ${(folderSize / 1024 / 1024).toFixed(2)} MB`);

    const fundingSuccess = await lazyFund(irys, folderSize);
    if (!fundingSuccess) {
      console.error("充值失败，终止上传");
      return;
    }

    // 修改上传选项，强制重新上传
    console.log("\n开始上传文件夹...");
    const response = await irys.uploadFolder(folderToUpload, {
      indexFile: "",  // 不使用索引文件
      batchSize: 5,   // 每批上传5个文件
      keepDeleted: false,  // 不保留已删除的文件
      manifestName: `manifest-${Date.now()}.json`,  // 使用时间戳创建新的 manifest
    });

    console.log(`\n文件夹上传成功！
      Manifest ID: ${response.id}
      访问地址: https://gateway.irys.xyz/${response.id}`);

  } catch (error) {
    console.error("上传文件夹时发生错误：", error);
  }
};

uploadFolder();
