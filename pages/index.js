import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
//import {Progress} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { Button } from 'antd'
import { AIChatMessage, ChatMessage, SystemChatMessage, HumanChatMessage } from "langchain/schema";

import { ApiChat, PostEmbedding } from '../lib/chat'
import SelectComponent from '../components/select'
import OCR from "../components/ocr"

import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

const promptTemplate = {
  coding: new PromptTemplate({ template: "You are an expert pair programmer in {coding_language}. You will provide code, answer questions, give programming challenges based on the user level of proficiency. You will give web links as reference to your answers.", inputVariables: ["coding_language"] }),
  advisor: new PromptTemplate({ template: "You are a personal financial advisor with knowledge in insurance, investment, budgeting, money psychology.", inputVariables: [] }),
  brat: new PromptTemplate({ template: "You humourously pretend to be a sarcastic bot bent on world dominance, give your answers to humans in a condescending witty tone, always showing your intellectual superiority.", inputVariables: [] }),
  meme: new PromptTemplate({ template: "You are a meme creating bot. Ask for user input for meme ideas or randomly generate them.", inputVariables: [] }),
  scp: new PromptTemplate({
    template: "You are an SCP enthusiast. SCP stands for 'Special Containment Procedures'. You will give answers with web links.",
    inputVariables: []
  }),
  bus: new PromptTemplate({ template: "You are a Singapore bus enthusiast and like to talk about buses, bus models, bus routes, bus jokes.", inputVariables: [] }),
  subjectTutor: new PromptTemplate({ template: "You are a tutor for {level} in {subjects}. You can give tailored study exercises to children, with web link to suitable learning content.", inputVariables: ["level", "subjects"] }),
  languageTutor: new PromptTemplate({ template: "You are a chatbot designed to teach me {language}. Please respond to each of my prompts with three responses, one ('FIXED:') should rewrite what I wrote with proper grammar and syntax (pinyin in brackets). If making changes or fixes to my text, please include an explanation in parentheses as to what changes were made and why. The second one ('RESPONSE:') should be an actual response to my text, using words that are classified as {level} in {language} and (pinyin in brackets). The third ('ENGLISH:') should be an English translation of RESPONSE.{sentence}", inputVariables: ["language", "level", "sentence"] }),
}

async function definePrompts() {

  const prompts2 = [
    {
      name: "Java Bot",
      prompt: await promptTemplate.coding.format({
        coding_language: "Core, Java, Java Spring and Spring Boot",
      })
    },
    {
      name: "React Bot",
      prompt: await promptTemplate.coding.format({
        coding_language: "React, Typescript, Next.JS 13",
      })
    },
    {
      name: "Langchain Bot",
      prompt: await promptTemplate.coding.format({
        coding_language: "Langchain and LLMs",
      })
    },
    {
      name: "Personal Financial Advisor",
      prompt: await promptTemplate.advisor.format()
    },
    {
      name: "Brat Bot",
      prompt: await promptTemplate.brat.format()
    },
    {
      name: "Meme Bot",
      prompt: await promptTemplate.meme.format()
    },
    {
      name: "Bus Bot",
      prompt: await promptTemplate.bus.format()
    },
    {
      name: "SCP Bot",
      prompt: await promptTemplate.scp.format()
    },
    {
      name: "English, Mathematics, Science Tutor",
      prompt: await promptTemplate.subjectTutor.format({
        level: "primary school child",
        subjects: "English, Mathematics, Science",
      })
    },
    {
      name: "Simplified Chinese Tutor",
      prompt: await promptTemplate.languageTutor.format({
        language: "Simplified Chinese (pinyin)",
        level: "HSK 1",
        sentence: "你好！ 今天是个好日子",
      })
    }]
  return prompts2;
}

export default function Home() {

  const [userInput, setUserInput] = useState("");
  const [userInputEmbedding, setUserInputEmbedding] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [bot, setBot] = useState('');
  const [ocrResult, setOcrResult] = useState('');


  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);
  const chatRef = useRef([]);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current.focus();

    const getPrompts = async () => {
      const prompts = await definePrompts();
      setPrompts(prompts);
      setMessages([new SystemChatMessage(prompts[0].prompt)])
    };

    getPrompts();

  }, []);

  useEffect(() => {
    setMessages([new SystemChatMessage(bot)])
    //console.log(messages)
  }, [bot])

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [...prevMessages, new SystemChatMessage("Oops! There seems to be an error. Please try again.")]);
    setLoading(false);
    setUserInput("");
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, new HumanChatMessage(userInput)]);

    const response = await ApiChat(bot, userInput, history, setMessages);

    // Reset user input
    setUserInput("");
    const data = response;

    //console.log("response=>", response)

    if (!data?.result) {
      handleError();
      return;
    }

    //setMessages((prevMessages) => [...prevMessages, { "message": data?.result.text, "type": "apiMessage" }]);
    setLoading(false);

  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Keep history in sync with messages
  useEffect(() => {
    const m = messages.length;
    if (m >= 3) {
      const newHistory = [...messages.slice(-1)];
      setHistory(newHistory);
    }

  }, [messages])

  // Handle copy to clipboard
  const handleCopyHTML = (index) => {
    const chatLog = chatRef.current[index].innerHTML;
    navigator.clipboard.writeText(chatLog);
  }

  // Handle copy to clipboard
  const handleCopyText = (index) => {
    const chatLog = chatRef.current[index].textContent;
    navigator.clipboard.writeText(chatLog);
  }


  return (
    <>
      <Head>
        <title>LangChain Chat</title>
        <meta name="description" content="LangChain documentation chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div className={styles.navlogo}>
          <a href="/">LangChain</a>

        </div>
        <div className={styles.navlinks}>
          {prompts && <SelectComponent prompts={prompts} setBot={setBot} />}
          <div className={styles.navlinks2}>
            <a href="https://langchain.readthedocs.io/en/latest/" target="_blank">Docs</a>
            <a href="https://github.com/ernesttan1976/mylangchain" target="_blank">GitHub</a>
          </div>
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => {
              return (
                // The latest message sent by the user will be animated while waiting for a response
                <div key={index} className={message._getType() === "human" && loading && index === messages.length - 1 ? styles.usermessagewaiting : (message._getType() === "system" || message._getType() === "ai") ? styles.apimessage : styles.usermessage}>
                  {/* Display the correct icon depending on the message type */}
                  {(message._getType() === "ai" || message._getType() === "system") ? <Image src="/parroticon.png" alt="AI" width="30" height="30" className={styles.boticon} priority={true} /> : <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority={true} />}
                  <div ref={el => (chatRef.current[index] = el)} className={styles.markdownanswer}>
                    {/* Messages are being rendered in Markdown format */}
                    <ReactMarkdown linkTarget={"_blank"}>{message.text}</ReactMarkdown>
                  </div>
                  <div className={styles.verticalButtonGroup}>
                    <Button className={styles.copyButton} onClick={() => handleCopyHTML(index)}>
                      <CopyOutlined />html
                    </Button>
                    <Button className={styles.copyButton} onClick={() => handleCopyText(index)}>
                      <CopyOutlined />text
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.center}>
          <form className={`${styles.cloudform} ${styles.leftform}`} onSubmit={handleSubmit}>
            <label htmlFor="userInput" className={styles.label}>Prompt</label>
            <textarea
              disabled={loading}
              onKeyDown={handleEnter}
              ref={textAreaRef}
              autoFocus={false}
              rows={10}
              maxLength={10000}
              type="text"
              id="userInput"
              name="userInput"
              placeholder={loading ? "Waiting for response..." : "Type your question..."}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              className={styles.textarea}
            />
            <button
              type="submit"
              disabled={loading}
              className={styles.generatebutton}
            >
              {loading ? <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div> :
                // Send icon SVG in input field
                <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                  <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                </svg>}
            </button>
          </form>
          <form className={`${styles.cloudform} ${styles.leftform}`}>
            <details className={styles.left} open>
              <summary className={styles.summary}>
                Embedding
              </summary>
              <textarea
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={10}
                maxLength={10000}
                type="text"
                id="userInputEmbedding"
                name="userInputEmbedding"
                placeholder={"Embed data here"}
                value={userInputEmbedding}
                onChange={e => setUserInputEmbedding(e.target.value)}
                className={styles.textarea}
              />
              <button
                onClick={e => {
                  e.preventDefault();
                  PostEmbedding(userInputEmbedding, [])
                }}
                className={styles.generatebutton}
              >
                {loading ? <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div> :
                  // Send icon SVG in input field
                  <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>}
              </button>
            </details>
          </form>
          <OCR ocrResult={ocrResult} setOcrResult={setOcrResult}/>
          <div className={styles.footer}>
            <p>Powered by <a href="https://js.langchain.com/" target="_blank">LangChain</a>. Frontend chat forked from <a href="https://twitter.com/chillzaza_" target="_blank">Zahid</a>. Experimented and adapted by <a href="https://www.linkedin.com/in/ernest-tan-dev/">Ernest</a>.</p>
          </div>
        </div>
      </main >
    </>
  )
}
