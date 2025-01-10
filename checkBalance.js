require("dotenv").config();
const { Uploader } = require("@irys/upload");
const { Solana } = require("@irys/upload-solana");

const checkBalance = async () => {
    try {
        // 初始化 Irys uploader
        const irys = await Uploader(Solana).withWallet(process.env.PRIVATE_KEY);
        console.log("Irys uploader initialized.");

        // 获取余额（原子单位）
        const atomicBalance = await irys.getBalance();
        console.log(`当前余额 (atomic units): ${atomicBalance}`);

        // 转换为可读格式
        const convertedBalance = irys.utils.fromAtomic(atomicBalance);
        console.log(`当前余额 (SOL): ${convertedBalance}`);

    } catch (error) {
        console.error("Error checking balance:", error);
    }
};

checkBalance(); 