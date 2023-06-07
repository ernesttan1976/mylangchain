"use server"
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAI } from "langchain/llms/openai";
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";
import getConfig from 'next/config';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";

const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
    PINECONE_ENVIRONMENT,
    PINECONE_KEY,
    OPENAI_API_KEY,
} = publicRuntimeConfig;


export async function ApiChat(bot, question, history, setMessages) {
    try {
        const chat = new ChatOpenAI({
            openAIApiKey: OPENAI_API_KEY,
            temperature: 0.2,
            streaming: true,
        });
        let tokens = "";

        setMessages((prevMessages) => [...prevMessages, new HumanChatMessage(question)]);

        const handleResponse = async () => {
            try {
                const response = await chat.call([
                    new SystemChatMessage(bot),
                    new HumanChatMessage(question),
                    ...history
                ],
                    undefined,
                    [
                        {
                            handleLLMNewToken(token) {
                                tokens = tokens + token;
                                setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
                            },
                        },
                    ]);

                return ({ result: response });
            } catch (error) {
                throw error
            }
        };

        //do not return until all the tokens are received
        const response = await handleResponse();
        return response;

    } catch (error) {
        console.error("Error during Open AI API call:", error);
        // Handle the error appropriately
    }

}

// export async function ApiChatPinecone(bot, question, history, setMessages) {
//     try {
//         const chat = new ChatOpenAI({
//             openAIApiKey: OPENAI_API_KEY,
//             temperature: 0.2,
//             streaming: true,
//         });
//         let tokens = "";

        
//         const handleResponse = async () => {
//             try {

//                 const embeddings = new OpenAIEmbeddings({
//                     openAIApiKey: OPENAI_API_KEY
//                 });

//                 const pinecone = new PineconeClient();
//                 await pinecone.init({
//                     environment: PINECONE_ENVIRONMENT,
//                     apiKey: PINECONE_KEY,
//                 });

//                 const pineconeIndex = pinecone.Index("index01");

//                 console.log("Pinecone Index", pineconeIndex);

//                 const vectorStore = await PineconeStore.fromExistingIndex(
//                     embeddings,
//                     { pineconeIndex }
//                 );

//                 const model = new OpenAI({
//                     openAIApiKey: OPENAI_API_KEY,
//                 });

//                 console.log("Open AI: model")

//                 const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

//                 console.log("RetrievalQAChain")

//                 const chainData = await chain.call({
//                     query: question,
//                     },
//                     [
//                         {
//                             handleLLMNewToken(token) {
//                                 tokens = tokens + token;
//                                 setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
//                             },
//                         },
//                     ]
//                 );

//                 return ({ result: chainData });
//             } catch (error) {
//                 console.error(error)
//                 throw error
//             }
//         };

//         //do not return until all the tokens are received
//         const response = await handleResponse();
//         return response;

//     } catch (error) {
//         console.error("Error during Open AI API call:", error);
//         // Handle the error appropriately
//     }

// }


