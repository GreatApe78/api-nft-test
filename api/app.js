const express = require("express");
const cors = require("cors");
const Web3 = require("web3");
require("dotenv").config();
const { SHOP_ABI, SHOP_ADDRESS } = require("./constants");
const { uploadToIPFS } = require("./uploadToIPFS");

const RPC_URL =
    process.env.BINANCE_TESTNET_RPC ||
    "https://data-seed-prebsc-1-s1.binance.org:8545/" ||
    "";
//(DO NOT USE A PRIVATE KEY WITH REAL MONEY!) Testing accounts
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PORT = 3000;
const app = express();

app.use(express.json());

app.use(cors());

//creating an event Party

/* 
REQUEST EXAMPLE BELOW!

  method ---> POST

  endpoint ---> http://localhost:3000/create-party-event

{
  "name":"Mega Party",
  "symbol":"MGP",
  "uri":"https://gateway.pinata.cloud/ipfs/QmSpF67MaFaXnZVz2gRYavafx1oMDq6Fkfe47W9ayX3Lv2/{id}.json",
  "collectionBannerImageUrl":"https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29uY2VydCUyMGNyb3dkfGVufDB8fDB8fHww&w=1000&q=80",
  "numberOfTicketTypes": 3,
  "quantitiesById": [1000,450,75]
}
 */
app.post("/create-party-event", async (req, res) => {
    const incomingData = req.body;
    if (
        !(
            incomingData.collectionMetadata.imagesArray.length ===
            incomingData.collectionMetadata.ticketInfo.length &&
            parseInt(incomingData.numberOfTicketTypes) ===
            incomingData.collectionMetadata.imagesArray.length &&
            parseInt(incomingData.numberOfTicketTypes) === incomingData.quantitiesById.length
        )
    ) {
        console.log(incomingData)
        res.status(400).send({ message: "Information is not matching!" });
    } else {
        try {
            const uri = await uploadToIPFS(
                incomingData.collectionMetadata.imagesArray,
                incomingData.collectionMetadata.ticketInfo
            );
            const web3 = new Web3(RPC_URL);

            const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
            web3.eth.accounts.wallet.add(account);
            const shop = new web3.eth.Contract(SHOP_ABI, SHOP_ADDRESS);

            const gasEstimate = await shop.methods
                .createPartyEvent(
                    incomingData.name,
                    incomingData.symbol,
                    uri,
                    incomingData.collectionBannerImageUrl,
                    incomingData.numberOfTicketTypes,
                    incomingData.quantitiesById
                )
                .estimateGas({ from: account.address });

            const tx = await shop.methods
                .createPartyEvent(
                    incomingData.name,
                    incomingData.symbol,
                    uri,
                    incomingData.collectionBannerImageUrl,
                    incomingData.numberOfTicketTypes,
                    incomingData.quantitiesById
                )
                .send({ from: account.address, gas: gasEstimate });

            const event = tx.events.PartyCreation;

            res.status(200).json({
                message: `Event Created at address: ${event.returnValues._eventAddress}`,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Error", error: error });
        }
    }
});

//transfer tickets route

app.post("/buy-tickets", async (req, res) => {
    const incomingData = req.body;
    try {
        const web3 = new Web3(RPC_URL);
        const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);

        const shop = new web3.eth.Contract(SHOP_ABI, SHOP_ADDRESS);

        const gasEstimate = await shop.methods
            .buyTickets(
                incomingData.eventAddress,
                incomingData.buyer,
                incomingData.id,
                incomingData.amount
            )
            .estimateGas({ from: account.address });

        const tx = await shop.methods
            .buyTickets(
                incomingData.eventAddress,
                incomingData.buyer,
                incomingData.id,
                incomingData.amount
            )
            .send({ from: account.address, gas: gasEstimate });
        res
            .status(200)
            .json({ message: "Buy tickets operation successful", transaction: tx });
    } catch (error) {
        res.status(500).json({ message: "Internal Error", error: error });
        console.error(error);
    }
});

app.post("/transfer-tickets", async (req, res) => {
    const incomingData = req.body;
    try {
        const web3 = new Web3(RPC_URL);
        const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);

        const shop = new web3.eth.Contract(SHOP_ABI, SHOP_ADDRESS);

        const gasEstimate = await shop.methods
            .transferTickets(
                incomingData.eventAddress,
                incomingData.from,
                incomingData.to,
                incomingData.id,
                incomingData.amount
            )
            .estimateGas({ from: account.address });

        const tx = await shop.methods
            .transferTickets(
                incomingData.eventAddress,
                incomingData.from,
                incomingData.to,
                incomingData.id,
                incomingData.amount
            )
            .send({ from: account.address, gas: gasEstimate });

        res.status(200).json({ message: "Tickets Transfered!", transaction: tx });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Error!", error: error });
    }
});
app.get("/party-event/:eventAddress", async (req, res) => {
    const incomingData = req.params;
    //console.log(req.params.eventAddress)
    try {
        const web3 = new Web3(RPC_URL);
        const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);
        const shop = new web3.eth.Contract(SHOP_ABI, SHOP_ADDRESS);

        const partyEvent = await shop.methods
            .getPartyEvent(incomingData.eventAddress)
            .call();

        //console.log(partyEvent);
        const partyEventJson = {
            name: partyEvent.name,
            symbol: partyEvent.symbol,
            uri: partyEvent.uri,
            collectionBannerImageUrl: partyEvent.collectionBannerImageUrl,
            numberOfTicketTypes: partyEvent.numberOfTicketTypes,
            quantitiesById: partyEvent.quantitiesById,
        };
        res.status(200).json({ message: "OK", partyEvent: partyEventJson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Error!", error: error });
    }
});
app.listen(PORT, () => {
    console.log(`API server listening at http://localhost:${PORT}`);
});