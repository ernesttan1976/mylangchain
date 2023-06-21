"use server"
import { ChatOpenAI } from "langchain/chat_models/openai";

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { VectorDBQAChain } from "langchain/chains";
import getConfig from 'next/config';
import { Calculator } from "langchain/tools/calculator";
import { WebBrowser } from "langchain/tools/webbrowser";
import { GoogleCustomSearch } from "langchain/tools";
import { ChainTool } from "langchain/tools";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { HumanChatMessage, SystemChatMessage, AIChatMessage } from "langchain/schema";

const conf = getConfig();
const { serverRuntimeConfig } = conf;
const {
  PINECONE_ENVIRONMENT,
  PINECONE_KEY,
  OPENAI_API_KEY,
  GOOGLE_CUSTOM_SEARCH_SECRET,
  GOOGLE_CSE_ID,
} = serverRuntimeConfig;

function getObjectChainEnd(input){

  return obj;
}

export async function AgentChat(bot, question, history, toolsSelect, setMessages) {

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

    const vectorChain = VectorDBQAChain.fromLLM(model, vectorStore, {returnSourceDocuments: true});
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
    if (toolsSelect.includes('Web_Search')) {
      tools.push(new WebBrowser({ model, embeddings }))
    }
    if (toolsSelect.includes('Pinecone_Store')) {
      tools.push(pineconeStore)
    }
    //console.log(tools)

    const executor = await initializeAgentExecutorWithOptions(
      tools, model, {
        agentType: "chat-conversational-react-description",
        returnIntermediateSteps: true,
        // verbose: true,
        maxIterations: 5,
      });

    console.log("Loaded agent.");
    //const result = await executor.call({input: question})

    let i = 0;
    let tokens = "";

    const handleResponse = async () => {
      try {

          const response = executor.call({
            input: question,
            chat_history: history,
            timeout: 20000,
          }
          ,
          [
            {
              handleLLMNewToken(token) {
                tokens = tokens + token;
                setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
              },
              // handleChainStart(chain, inputs, runId){
              //   newRunId = runId;
              // },
              // handleChainEnd(outputs, newRunId){
              //   const result = outputs.text;
              //   const agentStep = getCleanJson(result)
              //   console.log(">>outputs.text",outputs.text);
              //   console.log(">>agentStep", agentStep)
              //   alert(outputs.text)
              //   alert(JSON.stringify(agentStep))
              //   //agentStep.action
              //   //agentStep.action_input
              //   const token = agentStep.action + "\n\n" + agentStep.action_input; 
              //   tokens = tokens + token;
              //   setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));

              // },
              // handleLLMEnd(output){
              //   const generations = output.generations[0][0].text;
              //   tokens = tokens + generations;
              //   setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
              //   // console.log(">>LLM End",output);
              //   // alert(JSON.stringify(output))
              // },
              handleToolEnd(output){
                //alert(JSON.stringify(output))
                // const output2 = getCleanJson(JSON.stringify(output))
                const output2 = JSON.parse(output)
                //console.log("Tool End=>",output2)
                const observations = output2.map((obs, index) => (
                  "\n" + 1 * (index + 1) + ". " + obs.title + "<br/>[" + obs.link + "]("+obs.link+")<br/>" + obs.snippet)).join("\n\n");
                //alert(observations)
                //console.log("Observations",observations)
                tokens = tokens + "\n\nObservations: " + observations + "\n\n";
                setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
                
              },
              // handleChainEnd(output){
                //alert(JSON.stringify(output))
                // const output2 = JSON.parse(output.text.replace(/json|```/gm,''))
                // console.log(output2)
                // const observations = "\n"+ output2.action + "\n" + output2.action_input +"\n"
                // alert(observations)
                // console.log("Chain End",observations)
                // tokens = tokens + "\n\nTool: " + observations + "\n\n";
                // setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]));
                
              // },
            },
          ]);

          return ({ result: tokens});
      } catch (error) {
          throw error
      }
    };

      //do not return until all the tokens are received
   const response = await handleResponse();

   return response;

  } catch (error) {
    console.error("Error during AgentChat:", error);
    // Handle the error appropriately
}

}

