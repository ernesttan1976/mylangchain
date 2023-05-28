import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";
import getConfig from 'next/config';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
const conf = getConfig();
const { publicRuntimeConfig } = conf;
const { OPENAI_API_KEY } = publicRuntimeConfig;

export async function ApiChat(bot,question, history, setMessages) {
    try {
        // const conf = getConfig();
        // const { publicRuntimeConfig } = conf;
        // const { OPENAI_API_KEY } = publicRuntimeConfig;
        //console.log(OPENAI_API_KEY)
        const chat = new ChatOpenAI({
            openAIApiKey: OPENAI_API_KEY,
            temperature: 0.2,
            streaming: true,
        });
        let tokens = "";


        setMessages((prevMessages) => ([...prevMessages, new HumanChatMessage(question)]))
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

export async function PostEmbedding(query = "Hello world", documents = ["Hello world", "Bye bye"]) {
    try {
        // const conf = getConfig();
        // const { publicRuntimeConfig } = conf;
        // const { OPENAI_API_KEY } = publicRuntimeConfig;
        /* Create instance */
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: OPENAI_API_KEY
        });

        /* Embed queries */
        const queryEmbedding = await embeddings.embedQuery(query);

        /* Embed documents */
        const documentEmbedding = await embeddings.embedDocuments(documents);

        console.log({ queryEmbedding, documentEmbedding })
        return ({ queryEmbedding, documentEmbedding })


    } catch (error) {
        console.error("Error during Open AI API call:", error);
        // Handle the error appropriately
    }

}

