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
    upload.single("file")(req, res, async (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to upload file" });
        return;
      }

      try {

        const { file } = req;
        const oldPath = file.path;
        const newPath = path.join(UPLOAD_DIR, file.originalname);
        await mkdir(UPLOAD_DIR, { recursive: true });
        await rename(oldPath, newPath);

        const loader = new PDFLoader(newPath);
        const docs = await loader.load();

        console.log(docs.length);
        console.log(docs[50], docs[100], docs[200]);

          res.status(200).json({
          message: "File uploaded successfully and converted into ${docs.length} docs(pages): "+newPath,
          docs: docs,
          path: oldPath.replace(/^.*?\\public/, ''),
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "There was an error: " + err });
      }
    })
  }
}