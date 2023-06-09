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
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";
import { toolsModel } from "../models/tools"

const conf = getConfig();
const { publicRuntimeConfig, serverRuntimeConfig } = conf;
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



// const logHandler = (message) => {
//   if (message.startsWith("[")) {
//     capturedLogs += message + "\n";
//   }
// };

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




export async function AgentChat(bot, question, history, toolsSelect, setMessages) {
  let capturedLogs = [];
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
        // const t = new AIPluginTool({
        //   name: toolsModel[i].label,
        //   description: toolsModel[i].description,
        //   apiSpec: toolsModel[i].url,
        //   verbose: true,
        // })
        let t = await AIPluginTool.fromPluginUrl(toolsModel[i].url);
        t.name = toolsModel[i].label;
        t.description = toolsModel[i].description;
        tools.push(t);
        hasPlugin = true;
      }
    }
    if (hasPlugin) {
      tools.push(new RequestsGetTool());
      tools.push(new RequestsPostTool());
    } //these 2 tools are necessary for ChatGPT Plugins

    console.log(tools)

    const executor = await initializeAgentExecutorWithOptions(
      tools, model, {
      agentType: "chat-conversational-react-description",
      returnIntermediateSteps: true,
      verbose: true,
      maxIterations: 5,
    });

    console.log("Loaded agent.");
    //const result = await executor.call({input: question})

    let i = 0;
    let tokens = "";
    let finalCount = 0;

    let isLogged = false;

    setMessages((prevMessages) => ([...prevMessages, new AIChatMessage("")]));

    const handleResponse = async () => {
      try {

        const response = executor.call({
          input: bot + "\n" + question,
          chat_history: history,
          timeout: 10000,
        }
          ,
          [
            {
              handleLLMNewToken(token) {
                tokens = tokens + token;
                //tokens = tokens.replace(/```json/g,"").replace(/}```/g,"").replace(/```/g,"").replace(/json/g,"")
                //.replace(/<pre>|<\/pre>/g, "").replace(/<code>|<\/code>/g, "");
                setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
              },
              handleChainEnd(outputs, newRunId) {
                if (outputs?.text?.includes("Final Answer")) {
                  //alert("Final Answer")
                  finalCount++;
                  setTimeout(() => {
                    //alert(finalCount)
                    if (!isLogged) {
                      tokens = formatJSONObjects(tokens);
                      tokens = tokens + "\n" + createDetailsSummary("Detailed Logs:" + capturedLogs.map(x => x).join("\n"), false);
                      //tokens = formatJSONObjects(tokens);
                      setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
                      console.log = originalConsoleLog;
                    }
                  }, 2000);
                  // console.log = originalConsoleLog;
                } else if (outputs.output) {
                  //alert("output")
                  finalCount++;
                  setTimeout(() => {
                    tokens = formatJSONObjects(tokens);
                    tokens = tokens + "\n" + createDetailsSummary("Detailed Logs:" + capturedLogs.map(x => x).join("\n"), false);
                    setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
                    console.log = originalConsoleLog;
                  }, 1000);
                  isLogged = true;
                }

              },
              handleChainError(err) {
                //[chain/error] [1:chain:o] [1.93s] Chain run errored with error: "Got 429 error from Google custom search: "
                let errorMessage;
                if (err.includes("429 error")) {
                  errorMessage = "\n\nI'm very sorry, exceeded free 100 calls per day to Google Custom Search, to increase quota it is $5/per 1000 calls" +
                    "\nPlease try without web search or another type of free web search (in progress).\n\n" + err
                } else {
                  errorMessage = "\n\n" + JSON, stringify(err)
                }
                tokens = tokens + "\n\nError: " + errorMessage + "\n\n";
                setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
                alert(errorMessage);
              },
              handleToolEnd(output) {
                let output2;
                let observations;
                if (!output.includes("{")) {
                  observations = output
                } else {
                  output2 = JSON.parse(output)
                  //console.log("Tool End=>",output2)
                  observations = output2.map((obs, index) => (
                    "\n" + 1 * (index + 1) + ". " + obs.title + "<br/>[" + obs.link + "](" + obs.link + ")<br/>" + obs.snippet)).join("\n\n");
                  //alert(observations)
                  //console.log("Observations",observations)
                }
                tokens = tokens + "\n\nObservations: " + observations + "\n\n";
                setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
              },
            },
          ]);
        return ({ result: tokens });
      } catch (error) {
        console.error(error);
        return (error)
      }
    };

    const originalConsoleLog = console.log;

    {
      const log = console.log.bind(console)
      console.log = (...args) => {

        const cleanMessage = args[0].replace(/\u001b\[\d+m/g, '').replace(/({)/, '<pre><code>$1').replace(/(})[^}]*$/, '$1</pre></code>').replace(/\\\\/g, "\\").replace(/\"/g, '"')
        //.replace(/```json/,"\n```");
        log(...args)
        if (checkStartPattern(cleanMessage)) {
          capturedLogs.push(createDetailsSummary(cleanMessage, false));
        }
      }
    }

    //do not return until all the tokens are received
    const response = await handleResponse();

    return response;

  } catch (error) {
    console.error("Error during AgentChat:", error);
    // Handle the error appropriately
  }

}

