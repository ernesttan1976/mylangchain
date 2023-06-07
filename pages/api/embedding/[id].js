import connect from "../../../config/database";
import Document from "../../../models/Documents";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import getConfig from 'next/config';
const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
  OPENAI_API_KEY,
} = publicRuntimeConfig;


export const config = {
  api: {
    responseLimit: false,
  },
}

export default async function handler(req, res) {

  await connect();
  try {

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
    } else {

      const { id } = req.query;
      console.log("id: ", id)

      const foundDocument = await Document.findById(id);
      console.log("Found document:", foundDocument !== null)

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: OPENAI_API_KEY
      });

      const docs = foundDocument.vectors;

      const documentEmbedding = [];
      for (let i = 0; i < docs.length; i++) {
        const embedding = await embeddings.embedQuery(docs[i].pageContent);
        documentEmbedding.push(embedding);
        docs[i].values.push(embedding);
        // Write the chunk to the response stream
        res.write(JSON.stringify({
          message: `Chunk ${i + 1} of ${docs.length}`,
          embedding,
        }));
    
        if (i % 10 === 0) console.log(i);
      }
    
      foundDocument.save();

      res.end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "There was an error: " + err });
  }
}