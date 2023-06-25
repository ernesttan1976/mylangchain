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
import {connect, disconnect} from "../../config/database";
import {Tool} from "../../models/toolsModel"

const conf = getConfig();
const { serverRuntimeConfig } = conf;
const {
    OPENAI_API_KEY,
    GOOGLE_CUSTOM_SEARCH_SECRET,
    GOOGLE_CSE_ID,
    PINECONE_ENVIRONMENT,
    PINECONE_KEY,
} = serverRuntimeConfig;



function getObjectChainEnd(input) {

    return obj;
}

function checkStartPattern(string) {
    const startPatterns = [
        /\[chain\/start]/,
        /\[chain\/end]/,
        /\[llm\/start]/,
        /\[llm\/end]/,
        /\[agent\/action]/,
        /\[tool\/start]/,
        /\[tool\/end]/
    ];

    for (const pattern of startPatterns) {
        if (pattern.test(string)) {
            return true;
        }
    }

    return false;
}

function createDetailsSummary(string, open) {
    const maxLength = 50;
    const hasBracket = string.includes("{");
    const hasDoubleQuote = string.includes('"');
    const isDetailedLogs = string.includes("Detailed Logs:");
    let truncatedString;
    let restString;
    let index;
    if (isDetailedLogs) {
        truncatedString = string.slice(0, 14);
        restString = string.slice(14);
    } else if (hasBracket) {
        index = string.indexOf("<pre><code>{")
        if (index === -1) throw error
        truncatedString = string.slice(0, index);
        restString = string.slice(index);
    } else if (hasDoubleQuote) {
        index = string.indexOf('"')
        if (index === -1) throw error
        truncatedString = string.slice(0, index);
        restString = string.slice(index);
    } else {
        truncatedString = string.slice(0, maxLength);
        restString = string.slice(maxLength);
    }

    if (!open) {
        return `<details closed><summary>${truncatedString}</summary>${restString}</details>`
    } else {
        return `<details open><summary>${truncatedString}</summary>${restString}</details>`
    }
}

function formatJSONObjects(text) {
    // Find JSON objects within the text using regular expression
    const jsonRegex = /{[^{}]+}/g;
    const jsonObjects = text.match(jsonRegex);

    // Replace each JSON object with formatted version
    if (jsonObjects) {
        jsonObjects.forEach(jsonObject => {
            let parsedObject;
            try {
                const regex = /\/\/.*(?:\r\n|\r|\n)|\/\*(?:[\s\S]*?)\*\//g;
                const cleanedString = jsonObject.replace(regex, '');
                //console.log("text:", cleanedString)
                parsedObject = JSON.parse(cleanedString);
                //console.log("parsed:",parsedObject)
                const formattedObject = mapNestedObject(parsedObject);
                text = text.replace(jsonObject, formattedObject);
            } catch (error) {
                console.error('Error parsing JSON object:', error);
                return text;
                // return;
            }

            //const formattedObject = formatNestedJSON(parsedObject);
            const formattedObject = mapNestedObject(parsedObject);
            text = text.replace(jsonObject, formattedObject);
        });
    }

    return text;
}


function formatNestedJSON(obj) {
    let formattedObject = '';

    for (const [key, value] of Object.entries(obj)) {
        formattedObject += `<h4>${key}</h4>`;

        if (typeof value === 'object') {
            formattedObject += formatNestedJSON(value);
        } else {
            formattedObject += `<p>${value}</p>`;
        }
    }

    return formattedObject;
}

function mapNestedObject(nestedObject) {
    let index = 0;
    const observations = [];

    function mapObservation(obj, prefix = '') {
        index++;

        for (let key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                mapObservation(obj[key], prefix + key.toUpperCase() + '.');
            } else {
                const value = obj[key];
                const formattedObservation = `${prefix}(${index})${key.toUpperCase()}: ${value}`;
                observations.push(formattedObservation);
            }
            index++
        }
    }

    mapObservation(nestedObject);

    return observations.join('\n');
}

//ChainEnd: {"text":"```json\n{\n    \"action\": \"Web Pilot\",\n    \"action_input\": \"https://en.wikipedia.org/wiki/Tharman_Shanmugaratnam\"\n}\n```"}
//ChainEnd: "https://webreader.webpilotai.com/.well-known/ai-plugin.json"
//ChainEnd: {"text":"```json\n{\n    \"action\": \"Final Answer\",\n    \"action_input\": \"Tharman Shanmugaratnam is a Singaporean politician who has held several key positions in the Singaporean government, including Deputy Prime Minister and Minister for Finance. He has also served as the Chairman of the Monetary Authority of Singapore and the Group of Thirty. Shanmugaratnam has been credited with playing a key role in Singapore's economic success and has received numerous awards and accolades for his contributions. As of June 2021, he is still serving as Senior Minister and Coordinating Minister for Social Policies in the Singaporean government.\"\n}\n```"}
//ChainEnd: {"output":"Tharman Shanmugaratnam is a Singaporean politician who has held several key positions in the Singaporean government, including Deputy Prime Minister and Minister for Finance. He has also served as the Chairman of the Monetary Authority of Singapore and the Group of Thirty. Shanmugaratnam has been credited with playing a key role in Singapore's economic success and has received numerous awards and accolades for his contributions. As of June 2021, he is still serving as Senior Minister and Coordinating Minister for Social Policies in the Singaporean government.","intermediateSteps":[{"action":{"tool":"Web Pilot","toolInput":"https://en.wikipedia.org/wiki/Tharman_Shanmugaratnam","log":"```json\n{\n    \"action\": \"Web Pilot\",\n    \"action_input\": \"https://en.wikipedia.org/wiki/Tharman_Shanmugaratnam\"\n}\n```"},"observation":"https://webreader.webpilotai.com/.well-known/ai-plugin.json"}]}
//ChainEnd: {"text":"```json\n{\n    \"action\": \"Your AI Council\",\n    \"action_input\": {\n        \"query\": \"What are the latest events related to US Dollar de-dollarization in 2023 and what are the latest news and how it impacts Singapore and the world? And what does BRICS have to do with it?\",\n        \"agents\": [\"news\", \"finance\", \"politics\"]\n    }\n}\n```"}
//ToolEnd: "https://my-plugin.arnasltlt.repl.co/.well-known/ai-plugin.json"
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    const { bot, question, history, toolsSelect } = req.body;

    console.info("req.body", req.body)

    connect();
    const toolsModel = await Tool.find({})

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

        //"Pinecone Store", "Calculator", "Google Search"
        const tools = [];
        if (toolsSelect.includes('Calculator')) {
            tools.push(new Calculator())
        }
        if (toolsSelect.includes('Google_Search')) {
            tools.push(new GoogleCustomSearch({ apiKey: GOOGLE_CUSTOM_SEARCH_SECRET, googleCSEId: GOOGLE_CSE_ID }))
        }
        if (toolsSelect.includes('Pinecone_Store')) {
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
                    verbose: true,
                })
                // let t = await AIPluginTool.fromPluginUrl(toolsModel[i].url);
                // t.name = toolsModel[i].label;
                // t.description = toolsModel[i].description;
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
            maxIterations: 5,
        });

        console.log("Loaded agent.");


        let i = 0;
        let tokens = "";
        let finalCount = 0;

        let isLogged = false;
        let capturedLogs = [];


        {
            const log = console.log.bind(console)
            console.log = (...args) => {
                const arg0=args[0];
                const cleanMessage = (typeof arg0 === 'string') ? arg0.replace(/\u001b\[\d+m/g, '').replace(/({)/, '<pre><code>$1').replace(/(})[^}]*$/, '$1</pre></code>').replace(/\\\\/g, "\\").replace(/\"/g, '"') : arg0;
                                //.replace(/```json/,"\n```");
                log(...args)
                if (checkStartPattern(cleanMessage)) {
                    const newLog = createDetailsSummary(cleanMessage, false);
                    capturedLogs.push(newLog);
                }
                
            }
        }

        //const result = await executor.call({input: question})
        const responseStream = await executor.call({
            input: bot + "\n" + question,
            chat_history: history,
            timeout: 20000,
            verbose: true,
        },

            [
                {
                    handleLLMStart(llm, prompts){
                        console.log(">>LLMStart:", JSON.stringify(llm), JSON.stringify(prompts))
                        tokens = tokens + "\n\n>>LLMStart:\n" + JSON.stringify(llm) + "\n" + JSON.stringify(prompts);
                        res.write(tokens);
                    },
                    handleChatModelStart(llm, messages){
                        console.log(">>ChatModelStart", JSON.stringify(llm), JSON.stringify(messages))
                        tokens = tokens + "\n\n>>>ChatModelStart\n" + JSON.stringify(llm) + "\n" + JSON.stringify(messages);
                        res.write(tokens);
                    },
                    handleLLMNewToken(token) {
                        tokens = tokens + token;
                        res.write(tokens);
                    },
                    handleLLMEnd(output){
                        console.log(">>LLMEnd:", JSON.stringify(output))
                        tokens = tokens + "\n\n>>LLMEnd:\n" + JSON.stringify(output)
                        res.write(tokens)
                    },
                    handleLLMError(err){
                        console.log(">>LLMError:", JSON.stringify(err))
                        tokens = tokens + "\n\n>>LLMError:\n" + JSON.stringify(err)
                        res.write(tokens)
                    },
                    handleText(text){
                        console.log(">>Text:",JSON.stringify(text))
                        tokens = tokens + "\n\n>>Text:\n" + JSON.stringify(text)
                        res.write(tokens)
                    },
                    handleAgentAction(action){
                        console.log(">>AgentAction",JSON.stringify(action))
                        tokens = tokens + "\n\n>>AgentAction\n" + JSON.stringify(action)
                        res.write(tokens)
                    },
                    handleAgentEnd(action){
                        console.log(">>AgentEnd:",JSON.stringify(action))
                        tokens = tokens + "\n\n>>AgentEnd:\n" + JSON.stringify(action)
                        res.write(tokens)
                    },
                    handleChainStart(chain){
                        console.log(">>ChainStart",JSON.stringify(chain))
                        tokens = tokens + "\n\n>>ChainStart\n" + JSON.stringify(chain)
                        res.write(tokens)
                    },
                    handleChainEnd(outputs) {
                        console.log(">>ChainEnd:",JSON.stringify(outputs))
                        if (outputs?.text?.includes("Final Answer")) {

                            finalCount++;
                            setTimeout(() => {

                                if (!isLogged) {
                                    //tokens = formatJSONObjects(tokens);
                                    tokens = tokens + "\n" + createDetailsSummary("Detailed Logs:" + capturedLogs.map(x => x).join("\n"), false);
                                    res.write(tokens);
                                    res.end();
                                    console.log = originalConsoleLog;
                                }
                            }, 2000);

                        } else if (outputs.output) {

                            finalCount++;
                            setTimeout(() => {
                                //tokens = formatJSONObjects(tokens);
                                tokens = tokens + "\n" + createDetailsSummary("Detailed Logs:" + capturedLogs.map(x => x).join("\n"), false);
                                res.write(tokens);
                                
                                console.log = originalConsoleLog;
                            }, 1000);
                            isLogged = true;
                        }

                    },
                    handleChainError(err) {
                        console.log(">>ChainError:",JSON.stringify(err))
                        let errorMessage;
                        if (err?.includes("429 error")) {
                            errorMessage = "\n\nI'm very sorry, exceeded free 100 calls per day to Google Custom Search, to increase quota it is $5/per 1000 calls" +
                                "\nPlease try without web search or another type of free web search (in progress).\n\n" + err
                        } else {
                            errorMessage = "\n\n" + JSON.stringify(err)
                        }
                        tokens = tokens + "\n\nError: " + errorMessage + "\n\n";
                        res.write(tokens);
                    },
                    handleToolStart(tool, input){
                        console.log(">>ToolStart:", JSON.stringify(tool), JSON.stringify(input))
                        tokens = tokens + "\n\n>>ToolStart:\n" + JSON.stringify(tool) + "\n" + JSON.stringify(input)
                        res.write(tokens)
                    },
                    handleToolEnd(output) {
                        console.log(">>ToolEnd:",JSON.stringify(output))
                        let output2;
                        let observations;
                        if (!output.includes("{")) {
                            observations = output
                        } else {
                            output2 = JSON.parse(output)
                            observations = output2.map((obs, index) => (
                                "\n" + 1 * (index + 1) + ". " + obs.title + "<br/>[" + obs.link + "](" + obs.link + ")<br/>" + obs.snippet)).join("\n\n");
                        }
                        tokens = tokens + "\n\nObservations: " + observations + "\n\n";
                        res.write(tokens);
                    },
                    handleToolError(err){
                        console.log(">>ToolError:",JSON.stringify(err))
                        tokens = tokens + "\n\n>>ToolError:\n" + JSON.stringify(err)
                        res.write(tokens)
                    },
                },
            ]
        )

        const originalConsoleLog = console.log;

        

    } catch (error) {

        console.error("Error during AgentChat:", error);
        // Handle the error appropriately
        res.status(500).json({ message: "Internal Server Error" });
    }

}