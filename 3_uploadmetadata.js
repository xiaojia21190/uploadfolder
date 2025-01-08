require("dotenv").config();
const { Uploader } = require("@irys/upload");
const { Solana } = require("@irys/upload-solana");
const fs = require("fs");
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

const lazyFund = async (irys, size) => {
    try {
        const price = await irys.getPrice(size);
        console.log(`Upload ${size} bytes cost: ${irys.utils.fromAtomic(price)} ${irys.token}`);

        const balance = await irys.getBalance();
        console.log(`Current balance: ${irys.utils.fromAtomic(balance)} ${irys.token}`);

        if (new BigNumber(balance).lt(new BigNumber(price))) {
            console.log("Balance too low, funding...");
            const fundTx = await irys.fund(price);
            console.log("Funding transaction created...");
            
            await irys.funder.submitFundTransaction(fundTx.id);
            console.log(`Funded successfully! TX ID: ${fundTx.id}`);
            
            const newBalance = await irys.getBalance();
            console.log(`New balance: ${irys.utils.fromAtomic(newBalance)} ${irys.token}`);
        }
        return true;
    } catch (e) {
        console.error("Funding failed:", e);
        return false;
    }
};

const uploadMetadata = async () => {
    const irys = await getIrysUploader();
    if (!irys) {
        console.error("Irys uploader could not be initialized.");
        return;
    }

    try {
        // 读取metadata.json并解析为数组
        const metadataPath = "./metadata.json";
        const metadataString = fs.readFileSync(metadataPath, 'utf8');
        // 将字符串转换为数组格式
        const metadata = `[${metadataString}]`;
        const metadataBuffer = Buffer.from(metadata);

        // 只使用必要的tags
        const tags = [
            { name: "Content-Type", value: "application/json" },
            { name: "App-Name", value: "SciQuery" },
            { name: "Type", value: "metadata-index" },
            { name: "Collection", value: "sciquery2" }
        ];

        console.log("\nUploading metadata.json...");
        const receipt = await irys.upload(metadataBuffer, {
            tags: tags
        });

        console.log(`\nMetadata uploaded successfully!
            Transaction ID: ${receipt.id}
            Explorer URL: https://gateway.irys.xyz/${receipt.id}`);

        fs.writeFileSync('metadata-id.json', JSON.stringify({
            metadataId: receipt.id,
            uploadTime: new Date().toISOString()
        }, null, 2));

    } catch (error) {
        console.error("Error uploading metadata:", error);
    }
};

uploadMetadata();
