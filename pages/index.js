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

import definePrompts from "../models/prompts"

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
            <details className={styles.left} closed="true">
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
          <details className={styles.left} closed="true">
            <summary className={styles.summary}>
              Image Capture
            </summary>
            <OCR ocrResult={ocrResult} setOcrResult={setOcrResult}/>
          </details>
          <div className={styles.footer}>
            <p>Powered by <a href="https://js.langchain.com/" target="_blank">LangChain</a>. Frontend chat forked from <a href="https://twitter.com/chillzaza_" target="_blank">Zahid</a>. Experimented and adapted by <a href="https://www.linkedin.com/in/ernest-tan-dev/">Ernest</a>.</p>
          </div>
        </div>
      </main >
    </>
  )
}
