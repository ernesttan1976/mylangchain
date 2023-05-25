import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage, AIChatMessage} from "langchain/schema";
import getConfig from 'next/config';


export default async function ApiChat(question, history, setMessages) {
    try {
        const conf = getConfig();
        const { publicRuntimeConfig } = conf;
        const { OPENAI_API_KEY } = publicRuntimeConfig;
        console.log(OPENAI_API_KEY)
        const chat = new ChatOpenAI({
            openAIApiKey: OPENAI_API_KEY,
            temperature: 0.2,
            streaming: true,
        });
        let tokens = "";
        

        setMessages((prevMessages)=>([...prevMessages, new HumanChatMessage(question)]))
        const handleResponse = async () => {
            try {
                const response = await chat.call([
                    new SystemChatMessage("You are an expert in Javascript, Nextjs 13, Java, Langchain, and LLMs"),
                    new HumanChatMessage(question),
                    ...history
                ],
                    undefined,
                    [
                        {
                            handleLLMNewToken(token) {
                                tokens = tokens + token;
                                setMessages((prevMessages) => ([...prevMessages.slice(0,prevMessages.length-1),new AIChatMessage(tokens)]));
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

