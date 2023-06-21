const Moralis = require("moralis").default;


require("dotenv").config();

function replaceNumberWithURLId(url) {
    const regex = /\/\d+\.json/;
    return url.replace(regex, "/{id}.json");
}

async function startMoralisSDK() {
    await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
}
startMoralisSDK();
//optimized function by chat gpt
async function uploadToIPFS(imagesArray, ticketInfo) {
    try {
        const response = await Moralis.EvmApi.ipfs.uploadFolder({
            abi: imagesArray,
        });

        const nftMetadataArray = response.result.map((file, index) => {
            return {
                path: `${index + 1}.json`,
                content: {
                    name: ticketInfo[index].name,
                    description: ticketInfo[index].description,
                    image: file.path,
                },
            };
        });

        const jsonResponseUri = await Moralis.EvmApi.ipfs.uploadFolder({
            abi: nftMetadataArray,
        });
        console.log(jsonResponseUri);
        const replacedURL = replaceNumberWithURLId(jsonResponseUri.result[0].path);
        console.log(replacedURL);

        return replacedURL;
    } catch (error) {
        console.error("An error occurred:", error);
        throw error;
    }
}

//input examples below
/* uploadToIPFS(
  [
    { path: "mateus.svg", content: imagemDeTeste },
    { path: "eduardo.svg", content: imagemDeTeste },
    { path: "3.svg", content: imagemDeTeste },
  ],
  [
    { name: "boneco caipira", description: "Um boneco caipira" },
    { name: "girafa espacial", description: "Uma girafa do espaco" },
    { name: "ingresso superior cima", description: "Ingresso para o show" },
  ]
); */

/*
{
  imagesArray:[
    { path: "mateus.svg", content: imagemDeTeste },
    { path: "eduardo.svg", content: imagemDeTeste },
    { path: "3.svg", content: imagemDeTeste },
  ],
  ticketInfo:[
    { name: "boneco caipira", description: "Um boneco caipira" },
    { name: "girafa espacial", description: "Uma girafa do espaco" },
    {name:"ingresso superior cima",description:"Ingresso para o show"}
  ]
}

*/
module.exports = {
    uploadToIPFS,
};