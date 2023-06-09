import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RetrievalQAChain } from "langchain/chains";
import getConfig from 'next/config';
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";

const conf = getConfig();
const { serverRuntimeConfig } = conf;
const {
  PINECONE_ENVIRONMENT,
  PINECONE_KEY,
  OPENAI_API_KEY,
} = serverRuntimeConfig;

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

    const pineconeIndex = pinecone.Index("index01");

    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      { pineconeIndex }
    );

    console.log("Pinecone vectorstore loaded")

    const model = new OpenAI({
      openAIApiKey: OPENAI_API_KEY,
      temperature: 0.2,
      streaming: true
    });

    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(),{
      verbose: true,
      returnSourceDocuments: true,
    });


    console.log("RetrievalQAChain.fromLLM")
    const handleResponse = async () => {
      try {

        const response = chain.call({
          query: question,
          chat_history: history,
          timeout: 5000,
        }
          ,
          [{
            handleLLMNewToken: (token) => {
              // console.log("token")
              // tokens = token;
              // res.write(JSON.stringify(tokens));
            },
            handleChainEnd(output) {
              console.log("chain end")
              console.log(output)
              // const outputclean = output.text.replace(/json|```/gm, '')
              // tokens = tokens + "\n\nChain: " + outputclean + "\n\n";
              // res.write(JSON.stringify({done: false, value: tokens}));
            },
            handleLLMError(err){
              console.log("llm error")
              res.status(500).json({err})
            },
            handleChainError(err){
              console.log("chain error");
              res.status(500).json({err})
            },
            handleLLMEnd(output){
              console.log("LLM end")
              console.log(output)
              const generations = output.generations[0][0].text;
              tokens = generations;
              //res.write(JSON.stringify({done: false, value: tokens}));
              res.end(JSON.stringify(tokens));
              
            },
          }])

      } catch (error) {
        console.error("Error during PineconeChat chain.call:", error);
        throw error
      }
    }

    let tokens = "";
    //do not return until all the tokens are received
    const response = await handleResponse();

    //res.end(JSON.stringify({ data: tokens, done: true }));
    return;

  } catch (error) {
    console.error("Error during PineconeChat:", error);
    res.status(500).send(error.message);
  }
}