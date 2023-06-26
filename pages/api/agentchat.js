"use server"

import { ChatOpenAI } from "langchain/chat_models/openai";

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { VectorDBQAChain } from "langchain/chains";
import getConfig from 'next/config';
import { Calculator } from "langchain/tools/calculator";
import {
    GoogleCustomSearch, RequestsGetTool,
    RequestsPostTool,
    AIPluginTool, ChainTool
} from "langchain/tools";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { getTools } from "../../models/toolsModel"

const conf = getConfig();
const { serverRuntimeConfig } = conf;
const {
    OPENAI_API_KEY,
    GOOGLE_CUSTOM_SEARCH_SECRET,
    GOOGLE_CSE_ID,
    PINECONE_ENVIRONMENT,
    PINECONE_KEY,
} = serverRuntimeConfig;


function getTimeElapsed(startTime) {
    const endTime = new Date().getTime();
    const totalTime = endTime - startTime;
    const output = "Time elapsed: [" + totalTime + "ms] \r\n"
    console.log(output)
    return output
}


export default async function handler(req, res) {
    const startTime = new Date().getTime();
    console.log(getTimeElapsed(startTime))

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    const { bot, question, history, toolsSelect } = req.body;

    console.info("req.body", req.body)
    
    const toolsModel = await getTools();

    try {


        process.env.LANGCHAIN_HANDLER = "langchain";

        const model = new ChatOpenAI({
            openAIApiKey: OPENAI_API_KEY,
            temperature: 0.2,
            streaming: true,
        });

        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: OPENAI_API_KEY
        });

        //"Pinecone Store", "Calculator", "Google Search"
        const tools = [];
        if (toolsSelect.includes('Calculator')) {
            tools.push(new Calculator())
        }
        if (toolsSelect.includes('Google_Search')) {
            tools.push(new GoogleCustomSearch({ apiKey: GOOGLE_CUSTOM_SEARCH_SECRET, googleCSEId: GOOGLE_CSE_ID }))
        }
        if (toolsSelect.includes('Pinecone_Store')) {
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
            const vectorChain = VectorDBQAChain.fromLLM(model, vectorStore, { returnSourceDocuments: true });
            const pineconeStore = new ChainTool({
                name: "coding books and latest websites",
                description:
                    "Latest coding books and latest websites",
                chain: vectorChain,
            });
            tools.push(pineconeStore)
        }

        let hasPlugin = false;
        //loads ChatGPT plugins
        for (let i = 3; i < toolsModel.length; i++) {
            if (toolsSelect.includes(toolsModel[i].value)) {
                const t = new AIPluginTool({
                    name: toolsModel[i].label,
                    description: toolsModel[i].description,
                    apiSpec: toolsModel[i].url,
                    verbose: false,
                })
                tools.push(t);
                hasPlugin = true;
            }
        }
        if (hasPlugin) {
            tools.push(new RequestsGetTool());
            tools.push(new RequestsPostTool());
        } //these 2 tools are necessary for ChatGPT Plugins

        console.log(tools.length, " tools loaded")

        const executor = await initializeAgentExecutorWithOptions(
            tools, model, {
            agentType: "chat-conversational-react-description",
            returnIntermediateSteps: true,
            verbose: true,
            maxIterations: 3,
        });

        console.log("Loaded agent.");


        let i = 0;
        let finalCount = 0;

        let isLogged = false;

        console.log(getTimeElapsed(startTime))

        const handleResponse = async () => {

            const responseStream = await executor.call({
                input: bot + "\r\n" + question,
                chat_history: history,
                timeout: 60000,
                verbose: true,
            },

                [
                    {
                        // handleLLMStart(llm, prompts) {
                        //     console.log("LLMStart:", JSON.stringify(llm), JSON.stringify(prompts))
                        //     tokens = tokens + "\r\n\r\nLLMStart:\r\n" + JSON.stringify(llm) + "\r\n" + JSON.stringify(prompts);
                        //     res.write(tokens);
                        // },
                        // handleChatModelStart(llm, messages) {
                        //     console.log("ChatModelStart", JSON.stringify(llm), JSON.stringify(messages))
                        //     tokens = tokens + "\r\n\r\n>ChatModelStart\r\n" + JSON.stringify(llm) + "\r\n" + JSON.stringify(messages);
                        //     res.write(tokens);
                        // },
                        handleLLMNewToken(token) {
                            if (token==="undefined") token ="";
                            res.write(token);
                        },
                        handleLLMEnd(output) {
                            console.log(getTimeElapsed(startTime))
                            console.log("LLMEnd:", JSON.stringify(output))
                            const token = "\r\n\r\nLLMEnd:\r\n" + getTimeElapsed(startTime)+ JSON.stringify(output)
                            res.write(token)
                        },
                        handleLLMError(err) {
                            console.log("LLMError:", JSON.stringify(err))
                            let token = "\r\n\r\nLLMError:\r\n" + getTimeElapsed(startTime) + JSON.stringify(err)
                            res.write(token)
                            res.end()
                        },
                        // handleText(text) {
                        //     console.log("Text:", JSON.stringify(text))
                        //     tokens = tokens + "\r\n\r\nText:\r\n" + JSON.stringify(text)
                        //     res.write(tokens)
                        // },
                        // handleAgentAction(action) {
                        //     console.log("AgentAction", JSON.stringify(action))
                        //     tokens = tokens + "\r\n\r\nAgentAction\r\n" + JSON.stringify(action)
                        //     res.write(tokens)
                        // },
                        // handleAgentEnd(action) {
                        //     console.log("AgentEnd:", JSON.stringify(action))
                        //     tokens = tokens + "\r\n\r\nAgentEnd:\r\n" + JSON.stringify(action)
                        //     res.write(tokens)
                        // },
                        // handleChainStart(chain) {
                        //     console.log("ChainStart", JSON.stringify(chain))
                        //     tokens = tokens + "\r\n\r\nChainStart\r\n" + JSON.stringify(chain)
                        //     res.write(tokens)
                        // },
                        handleChainEnd(outputs) {
                            try {
                                console.log("ChainEnd:", JSON.stringify(outputs))
                                if (outputs?.text?.includes("Final Answer")) {

                                    finalCount++;
                                    setTimeout(async () => {

                                        if (!isLogged) {
                                            let token = "\r\n" + getTimeElapsed(startTime)
                                            //tokens = tokens + "\r\n" + createDetailsSummary("Detailed Logs:" + capturedLogs.map(x => x).join("\r\n"), false);
                                            res.write(token);
                                            res.write("End of response")
                                            res.end();
                                        }
                                    }, 2000);

                                } else if (outputs.output) {

                                    finalCount++;
                                    setTimeout(async () => {
                                        let token = "\r\n" + getTimeElapsed(startTime)
                                            //tokens = tokens + "\r\n" + createDetailsSummary("Detailed Logs:" + capturedLogs.map(x => x).join("\r\n"), false);
                                            res.write(token);
                                            res.write("End of response")
                                            res.end();
                                    }, 1000);
                                    isLogged = true;
                                }
                            } catch (error) {
                                // tokens = tokens + "\r\nCannot Format ToolEnd: \r\n" + JSON.stringify(outputs);
                                // await writer.ready;
                                // await writer.write(encoder.encode(`${tokens}`));
                            }

                        },
                        handleChainError(err) {
                            console.log("ChainError:", JSON.stringify(err))
                            let errorMessage;
                            if (err?.includes("429 error")) {
                                errorMessage = "\r\n\r\nI'm very sorry, exceeded free 100 calls per day to Google Custom Search, to increase quota it is $5/per 1000 calls" +
                                    "\r\nPlease try without web search or another type of free web search (in progress).\r\n\r\n" + err
                            } else {
                                errorMessage = "\r\n\r\n" + JSON.stringify(err)
                            }
                            let token = "\r\n" + getTimeElapsed(startTime)
                            token += "\r\n\r\nError: " + errorMessage + "\r\n\r\n";
                            res.write(token)
                            res.end()
                        },
                        // handleToolStart(tool, input) {
                        //     console.log("ToolStart:", JSON.stringify(tool), JSON.stringify(input))
                        //     tokens = tokens + "\r\n\r\nToolStart:\r\n" + JSON.stringify(tool) + "\r\n" + JSON.stringify(input)
                        //     res.write(tokens)
                        // },
                        handleToolEnd(output) {
                            try {
                                console.log("ToolEnd:", JSON.stringify(output))
                                let output2;
                                let observations;
                                if (!output.includes("{")) {
                                    observations = output
                                } else {
                                    output2 = JSON.parse(output)
                                    observations = output2.map((obs, index) => (
                                        "\r\n" + 1 * (index + 1) + ". " + obs.title + "<br/>[" + obs.link + "](" + obs.link + ")<br/>" + obs.snippet)).join("\r\n\r\n");
                                }
                                let token = "\r\n" + getTimeElapsed(startTime)
                                token += + "\r\n\r\nObservations: " + observations + "\r\n\r\n";
                                res.write(token);

                            } catch (error) {
                                let token = "\r\nCannot Format ToolEnd: \r\n" + output;
                                res.write(token);
                            }
                        },
                        handleToolError(err) {
                            console.log("ToolError:", JSON.stringify(err))
                            let token = "\r\n" + getTimeElapsed(startTime)
                            token += "\r\n\r\nToolError:\r\n" + JSON.stringify(err)
                            res.write(token)
                            res.end()
                        },
                    },
                ]
            )

        }

        await handleResponse();
        if (!res.finished) {
            res.write("\r\n\r\nEnd of response")
            res.end()
        };

    } catch (error) {

        console.error("Error during AgentChat:", error);
        // Handle the error appropriately
        res.status(500).json({ message: "Internal Server Error" });
    }

}