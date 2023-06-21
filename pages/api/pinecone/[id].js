import connect from "../../../config/database";
import Document from "../../../models/Documents";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import getConfig from 'next/config';
const conf = getConfig();
const { serverRuntimeConfig } = conf;
const {
    PINECONE_ENVIRONMENT,
    PINECONE_KEY,
    OPENAI_API_KEY,
} = serverRuntimeConfig;


export default async function handler(req, res) {

    await connect();

    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
    } else {

        try {
            const pinecone = new PineconeClient();
            await pinecone.init({
                environment: PINECONE_ENVIRONMENT,
                apiKey: PINECONE_KEY,
            });

            const indexesList = await pinecone.listIndexes();
            let pineconeIndex;

            console.log("creating index");
            pineconeIndex = pinecone.Index("index01");


            console.log("Pinecone Index", pineconeIndex);

            const { id } = req.query;
            console.log("id: ", id)
            const foundDocument = await Document.findById(id);
            console.log("Found document:", foundDocument !== null)

            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: OPENAI_API_KEY
              });

            const vectorStore = await PineconeStore.fromDocuments(foundDocument.vectors,embeddings,
                { pineconeIndex, textKey: "pageContent", namespace: foundDocument.namespace }
            );

            console.log("Pinecone: vectorStore.length", vectorStore);

            if (vectorStore) {
                foundDocument.savedInPinecone = true;
                foundDocument.save();
            }

            res.status(200).json({
                message: "Pinecone vectors saved",
                chainData: chainData
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "There was an error: " + err });
        }
    }
}