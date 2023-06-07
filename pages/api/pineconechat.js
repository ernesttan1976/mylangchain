import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RetrievalQAChain } from "langchain/chains";
import getConfig from 'next/config';

const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
    PINECONE_ENVIRONMENT,
    PINECONE_KEY,
    OPENAI_API_KEY,
} = publicRuntimeConfig;

export default async function handler(req, res) {
  const { bot, question, history } = req.body;

  try {

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY
    });

    console.log("embeddings")

    const pinecone = new PineconeClient();
    await pinecone.init({
      environment: PINECONE_ENVIRONMENT,
      apiKey: PINECONE_KEY,
    });

    console.log("pinecone")

    const pineconeIndex = pinecone.Index("index01");

    console.log("pinecone index")

    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      { pineconeIndex }
    );

    console.log("vectorstore")

    const model = new OpenAI({ 
        openAIApiKey: OPENAI_API_KEY, 
        temperature: 0.2, 
        streaming: true 
    });

    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    console.log("RetrievalQAChain.fromLLM")
    let i=0;
    const result = await new Promise((resolve, reject) => {
        let tokens = "";
        chain.call({
          query: question
          }
          ,
          [{
            handleLLMNewToken: (token)=>{
            tokens = tokens + token;
            i++;
            if (i%10===0) console.log(i)
            res.write(tokens);
            },
            handleResult(result) {
                resolve(result);
              },
            handleError(error) {
                reject(error);
            }
        }])
    })
    res.end();
    res.status(200).json({result});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}