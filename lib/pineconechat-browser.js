"use server"
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RetrievalQAChain } from "langchain/chains";
import getConfig from 'next/config';
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";

const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
  PINECONE_ENVIRONMENT,
  PINECONE_KEY,
  OPENAI_API_KEY,
} = publicRuntimeConfig;

export async function PineconeChat(bot, question, history, setMessages) {

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

    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    console.log("RetrievalQAChain.fromLLM")
    const handleResponse = async () => {
      try {
        let tokens = "";
        const response = chain.call({
          query: question,
          chat_history: history,
          timeout: 20000,
          returnSourceDocuments: true
        }
          ,
          [{
            handleLLMNewToken: (token) => {
              tokens = tokens + token;
              setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
            },
          }])
        return ({ result: tokens });
      } catch (error) {
        console.error("Error during PineconeChat chain.call:", error);
        throw error
      }
    }

    //do not return until all the tokens are received
    const response = await handleResponse();

    return response;

  } catch (error) {
    console.error("Error during PineconeChat:", error);
  }
}