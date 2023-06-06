import fs from "fs";
import path from "path";
import { promisify } from "util";
import multer from "multer";
import { OpenAI } from "langchain/llms/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";

import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
// import { Milvus } from "langchain/vectorstores/milvus";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
// import { createClient } from "@clickhouse/client";
// import { MyScaleStore } from "langchain/vectorstores/myscale";
//console.myscale.com



import getConfig from 'next/config';
const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
  OPENAI_API_KEY,
  PINECONE_ENVIRONMENT,
  PINECONE_KEY,

} = publicRuntimeConfig;


//console.log(publicRuntimeConfig)

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const mkdir = promisify(fs.mkdir);
const rename = promisify(fs.rename);

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  // allow only one file to be uploaded
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 100, // 100 MB
    files: 1 // allow only one file to be uploaded
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
  } else {
    

        const pinecone = new PineconeClient();
        await pinecone.init({
          environment: PINECONE_ENVIRONMENT,
          apiKey: PINECONE_KEY,
        });

        const indexesList = await pinecone.listIndexes();
        let pineconeIndex;

        // if (!indexesList.length>0) {
          console.log("creating index");
          pineconeIndex = pinecone.Index("index01");
          // pineconeIndex = await pinecone.createIndex({
          //   createRequest: {
          //     name: "index01",
          //     dimension: 1536,
          //   },
          // });


        console.log("Pinecone Index", pineconeIndex);

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: OPENAI_API_KEY
      });

        // const documentEmbedding = [];
        // for (let i = 0; i < docs.length; i++) {
        //   const embedding = await embeddings.embedQuery(docs[i].pageContent);
        //   documentEmbedding.push(embedding);
        //   if (i%10===0) console.log(i);
        // }
       
        const textKey= "pageContent";
        const namespace="pdfdocs";

        const vectorStore = await PineconeStore.fromDocuments(docs, embeddings,
          {pineconeIndex,textKey,namespace}
        );

        console.log("Pinecone: vectorStore.length", vectorStore);

        // const model = new OpenAI({
        //   openAIApiKey: OPENAI_API_KEY,
        // });

        // console.log("Open AI: model")

        // const chain = new RetrievalQAChain({
        //   combineDocumentsChain: loadQAStuffChain(model),
        //   retriever: vectorStore.asRetriever(),
        //   returnSourceDocuments: false,
        // });

        // console.log("chain up")

        // const res = await chain.call({
        //   query: "What is Djikstra's algorithm for?",
        // });

        // console.log("Chain response: ", JSON.stringify(res, null, 2));

        const docOutput = ""

        res.status(200).json({
          message: "File uploaded successfully: ",
          vectorStore: vectorStore.length, indexesList: indexesList
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "There was an error: " + err });
      }
    })
  }
}