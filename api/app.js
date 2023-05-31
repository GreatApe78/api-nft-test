const express = require("express");
const cors = require("cors");
const Web3 = require("web3");
require("dotenv").config();
const { SHOP_ABI, SHOP_ADDRESS } = require("./constants");
const RPC_URL = process.env.BINANCE_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const PRIVATE_KEY = process.env.PRIVATE_KEY; //(DO NOT USE A PRIVATE KEY WITH REAL MONEY!) Testing accounts
const PORT = 3000;
const app = express();
app.use(express.json());
app.use(cors());
//app.use(express.static("public"))
//buy tickets endpoint
app.post("/buytickets", async (req, res) => {
    try {
        const { buyerAddress, id, amount } = req.body;
        console.log(req.body)
        const web3 = new Web3(RPC_URL);
        const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);

        const shop = new web3.eth.Contract(SHOP_ABI, SHOP_ADDRESS);
        // Estimate Gas
        const gasEstimate = await shop.methods.grantTickets(buyerAddress, id, amount).estimateGas({ from: account.address });
        const tx = await shop.methods.grantTickets(buyerAddress, id, amount).send({ from: account.address, gas: gasEstimate });
        if (Boolean(tx)) {
            console.log(tx);
        }
        res.json({ message: "Buy tickets operation successful", transaction: tx });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Something went wrong with the operation",
            formatedError: error,
        });
    }
});
app.post("/createticketsale", async (req, res) => {
    try {
        const { amountOfEachTicketById } = req.body;
        console.log(amountOfEachTicketById);
        const web3 = new Web3(RPC_URL);
        const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);
        const shop = new web3.eth.Contract(SHOP_ABI, SHOP_ADDRESS);
        // Estimate Gas
        const gasEstimate = await shop.methods.createTicketSale(amountOfEachTicketById).estimateGas({ from: account.address });
        const tx = await shop.methods.createTicketSale(amountOfEachTicketById).send({ from: account.address, gas: gasEstimate });
        if (Boolean(tx)) {
            console.log(tx);
            res.status(200).json({ message: "Mint tickets operation successful", transaction: tx });
        }
    } catch (error) {
        res.status(500).json({
            error: "Transaction Failed ",
            formatedError: error,
        });
    }
});
app.listen(PORT, () => {
    console.log(`API server listening at http://localhost:${PORT}`);
});