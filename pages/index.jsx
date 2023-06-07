import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
//import {Progress} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { Button, Tabs, ConfigProvider, theme, Space } from 'antd'
import { AIChatMessage, ChatMessage, SystemChatMessage, HumanChatMessage } from "langchain/schema";

import { ApiChat, PostEmbedding, ApiChatPinecone } from '../lib/chat'
import SelectComponent from '../components/select'
import OCR from "../components/ocr"

import definePrompts from "../models/prompts"
import TabPage2 from './tabPage2'

export default function Home() {

  const [userInput, setUserInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [bot, setBot] = useState('');
  const [ocrResult, setOcrResult] = useState('');


  const messageListRef = useRef(null);
  const chatRef = useRef([]);
  const textAreaRef = useRef(null);

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

  // Handle form submission
  const handleSubmitPinecone = async (e) => {
    e.preventDefault();
  
    if (userInput.trim() === "") {
      return;
    }
  
    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, new HumanChatMessage(userInput)]);
    setMessages((prevMessages) => [...prevMessages, new HumanChatMessage(userInput)]);
  
    const url = "/api/pineconechat";
    const body = JSON.stringify({ bot, question: userInput, history });
  
    const response = await fetch(url, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      handleError();
      return;
    }
  
    const reader = response.body.getReader();
    let chunks = "";
    let isDone = false;
  
    while (!isDone) {
      const {value, done} = await reader.read();
      isDone = done;
      if (done) console.log("done")
      chunks=new TextDecoder("utf-8").decode(value)
      setMessages((prevMessages) => ([...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(chunks)]));
    }

    console.log("done1")

    const result = JSON.parse(new TextDecoder("utf-8").decode(chunks));
  
    setMessages((prevMessages) => [...prevMessages, { "message": result, "type": "apiMessage" }]);
    setLoading(false);
    setUserInput("");

    console.log("done2")

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

  const onChangeTab = (key) => {
    //console.log(key);
  };

  const tabPage1 = <>
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
      <form className={`${styles.cloudform} ${styles.leftform}`}>
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
          onClick={handleSubmit}
        >
          {loading ? <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div> :
            // Send icon SVG in input field
            <><img className={styles.openaisvgicon} src="/openai-logo.svg" alt="OpenAI Logo" /><svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
              <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
            </svg></>}
        </button>
        <button
          type="submit"
          onClick={handleSubmitPinecone}
          disabled={loading}
          className={styles.pineconegeneratebutton}
        >
          {loading ? <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div> :
            // Send icon SVG in input field
            <><img className={styles.pineconesvgicon} src="/pinecone-logo.svg" alt="Pinecone Logo" />
            <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
              <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
            </svg></>
            }
        </button>
      </form>
      <div className={styles.column2} style={{ margin: "8px auto 8px 0" }}>
          <details closed="true" style={{ margin: "8px auto 8px 0" }}>
            <summary className={styles.summary}>
              Image Capture (OCR)
            </summary>
            <OCR ocrResult={ocrResult} setOcrResult={setOcrResult} />
          </details>
      </div>
    </div>
  </>

  const tabPages = [
    {
      key: '1',
      label: `Chat Bots`,
      children: tabPage1,
    },
    {
      key: '2',
      label: `Embedding`,
      children: <TabPage2 />,
    },
  ];

  return (
    <>
      <Head>
        <title>MyLangChain</title>
        <meta name="description" content="Custom ChatGPT with documents" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ConfigProvider theme={{
        "token": {
          "colorPrimary": "#722ED1",
          "borderRadius": 8,
        },
        "algorithm": theme.darkAlgorithm,
      }}>
        <div className={styles.topnav}>
          <div className={styles.navlogo}>
            <a href="/">LangChain</a>
          </div>
          <div className={styles.navlinks}>
            {prompts && <SelectComponent prompts={prompts} setBot={setBot} />}
            <div className={styles.navlinks2}>
              <Space>
                <a href="https://js.langchain.com/" target="_blank">Docs</a>
                <a href="https://github.com/ernesttan1976/mylangchain" target="_blank">GitHub</a>
              </Space>
            </div>
          </div>
        </div>
        <main className={styles.main}>
          <Tabs className={styles.tab} defaultActiveKey="1" items={tabPages} onChange={onChangeTab} />
        </main >
        <div className={styles.footer}>
          <p>Powered by <a href="https://js.langchain.com/" target="_blank">LangChain</a>. Frontend chat forked from <a href="https://twitter.com/chillzaza_" target="_blank">Zahid</a>. Experimented and adapted by <a href="https://www.linkedin.com/in/ernest-tan-dev/">Ernest</a>.</p>
        </div>
      </ConfigProvider>
    </>
  )
}
