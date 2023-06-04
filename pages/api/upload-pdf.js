import fs from "fs";
import path from "path";
import { promisify } from "util";
import multer from "multer";
import {OpenAI} from "openai";
import { RetrievalQAChain } from "langchain/chains";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createClient } from "@clickhouse/client";
//console.myscale.com

import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import getConfig from 'next/config';
const conf = getConfig();
const { publicRuntimeConfig } = conf;
const { 
  OPENAI_API_KEY, 
  MYSCALE_HOST,
  MYSCALE_PORT,
  MYSCALE_USER_NAME,
  MYSCALE_PASSWORD,
 } = publicRuntimeConfig;

const client = createClient({
  host: `${MYSCALE_HOST}:${MYSCALE_PORT}`,
  username: MYSCALE_USER_NAME,
  password: MYSCALE_PASSWORD,
});

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
  if (req.method === "POST") {

    upload.single("file")(req, res, async (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to upload file" });
        return;
      }
    
      const { file } = req;
      const oldPath = file.path;
      const newPath = path.join(UPLOAD_DIR, file.originalname);
    
      try {
        await mkdir(UPLOAD_DIR, { recursive: true });
        await rename(oldPath, newPath);

        const loader = new PDFLoader(newPath);
        const docs = await loader.load();

        console.log(docs.length);
        console.log(docs[50],docs[100],docs[200]);


        const vectorStore = await MemoryVectorStore.fromDocuments(
          docs,
          new OpenAIEmbeddings({
            openAIApiKey: OPENAI_API_KEY
        })
        );

        console.log("vectorStore")

        const model = new OpenAI({
          openAIApiKey: OPENAI_API_KEY,
          temperature: 0.2,
          streaming: true,
      });

        console.log("model")

        const chain = new RetrievalQAChain({
          combineDocumentsChain: loadQAStuffChain(model),
          retriever: vectorStore.asRetriever(),
          returnSourceDocuments: true,
        });

        console.log("chain")

        const res = await chain.call({
          query: "What is Djikstra's algorithm for?",
        });

        console.log(JSON.stringify(res, null, 2));

        // const text = `Hi.\n\nI'm Harrison.\n\nHow? Are? You?\nOkay then f f f f.
        // This is a weird text to write, but gotta test the splittingggg some how.\n\n
        // Bye!\n\n-H.`;
        // const splitter = new RecursiveCharacterTextSplitter({
        //   chunkSize: 10,
        //   chunkOverlap: 1,
        // });
        
        // const docOutput = await splitter.splitDocuments([
        //   new Document({ pageContent: text }),
        // ]);

        // console.log(docOutput)
        const docOutput =""

        res.status(200).json({ message: "File uploaded successfully: ",
          docOutput: docOutput });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "There was an error: " + err });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}