import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from "rehype-raw";

import { LoadingOutlined, SoundOutlined, PlaySquareOutlined, StopOutlined } from '@ant-design/icons';
import { Spin, Tooltip, Radio } from 'antd';
const antIcon = (
  <LoadingOutlined
    style={{
      fontSize: 24,
    }}
    spin
  />
);
import { useRouter } from 'next/router';

import { Select } from 'antd';


import { CopyOutlined } from '@ant-design/icons';
import { Button, Tabs, ConfigProvider, theme, Space, Tag } from 'antd'
import { AIChatMessage, ChatMessage, SystemChatMessage, HumanChatMessage } from "langchain/schema";
// import { Logger } from '../components/logger'

import { ApiChat } from '../lib/chat'
import SelectComponent from '../components/select'
import OCR from "../components/ocr"

import definePrompts from "../models/prompts"
import TabPage2 from './tabPage2'
import TabPage3 from './tabPage3'
import TabPage4 from "./tabPage4"

function convertLinksToAnchorTags(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (match, url) => {
    const trimmedUrl = url.slice(0, -1);
    return `[${trimmedUrl}](${trimmedUrl})`;
    // return `<a href="${trimmedUrl}" target="_blank">${trimmedUrl}</a>`;
  });
}

function mapMixedDataToPage(jsonData, parentElement) {
  console.log(jsonData)

  const detailsContainer = document.createElement('details');
  const summaryElement = document.createElement('summary');
  summaryElement.textContent = 'Details';

  detailsContainer.appendChild(summaryElement);

  for (const key in jsonData) {
    const value = jsonData[key];
    const propertyContainer = document.createElement('div');

    const keyElement = document.createElement('span');
    keyElement.textContent = key;
    keyElement.classList.add('property-key');
    propertyContainer.appendChild(keyElement);

    if (typeof value === "string") {
      const valueElement = document.createElement('span');
      valueElement.textContent = value;
      valueElement.classList.add('property-value');
      propertyContainer.appendChild(valueElement);
      continue;
    } else if (Array.isArray(value)) {
      const arrayContainer = document.createElement('div');
      arrayContainer.classList.add('array-container');
      propertyContainer.appendChild(arrayContainer);

      value.forEach((item) => {
        const itemContainer = document.createElement('div');
        itemContainer.classList.add('array-item');
        arrayContainer.appendChild(itemContainer);

        mapMixedDataToPage(item, itemContainer);
      });
    } else if (typeof value === 'object') {
      mapMixedDataToPage(value, propertyContainer);

    }

    detailsContainer.appendChild(propertyContainer);
  }

  if (parentElement) {
    parentElement.appendChild(detailsContainer);
  } else {
    document.body.appendChild(detailsContainer);
  }
}


function parseAndCombineJSONObjects(string, treeRef) {
  let startIndices = [];
  let jsonObjects = [];
  let level = 0;

  // Find the indices of top-level { and } characters
  for (let i = 0; i < string.length; i++) {
    if (string[i] === '{') {
      if (level === 0) startIndices.push(i);
      level++;
    } else if (string[i] === '}') {
      level--;
      if (level === 0) {
        let startIndex = startIndices.pop();
        let jsonObject = string.substring(startIndex, i + 1);
        jsonObjects.push(jsonObject);
      }
    }
  }

  // Parse and recombine the JSON objects
  for (let i = 0; i < jsonObjects.length; i++) {
    try {
      //'\"text\"=' + 
      let parsedObject = JSON.parse(jsonObjects[i]);
      let htmlObject = getHTMLObject(parsedObject);
      mapMixedDataToPage(parsedObject, treeRef)
      string = string.replace(jsonObjects[i], htmlObject);
      //      string = string.replace(jsonObjects[i], "```json \r\n" + JSON.stringify(parsedObject, null, 2) + "\r\n```");

    } catch (error) {
      string = jsonObjects[i]
      alert(error)
      alert(string)
    }
  }

  return string;
}

function getHTMLObject(obj) {
  const isActionInput = obj?.action && !obj?.action_input?.urls;
  const isActionInputUrl = obj?.action && obj?.action_input?.urls;
  const isGenerations = obj?.generations;

  if (isActionInput) {
    //.action
    //.action_input
    return "#### **" + obj.action + "** \n\n> " + obj.action_input + "\n\n\n"
  } else if (isActionInputUrl) {
    //.action
    //.action_input.urls.map =>
    let str = "#### **" + obj.action + "** \n\n";
    obj.action_input.urls.forEach((url, index) => {
      str += (index + 1) + `. [${url}](${url})\n\n`
    })
    return str;
  } else if (isGenerations) {
    //.generations[0].map=>.text
    //.generations[0].map=>.message.data.content
    let str = "#### **Responses**: \n\n";
    obj.generations[0].forEach((item, index) => {
      str += (index + 1) + ". Response: \n```\n" + item.text + "\n```\n\n"
    })
    return str
  } else {
    //default
    return "\n```\n" + JSON.stringify(parsedObject, null, 2) + "\n```\n\n"
  }

}


const Parrot = () => <Image src={"/parroticon.png"} width={30} height={30} alt="Parrot" />
const Macaw = () => <Image src={"/bluemacaw.png"} width={25} height={25} alt="Macaw" />

export default function Home() {
  const router = useRouter();
  const { page } = router.query;

  const [userInput, setUserInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [bot, setBot] = useState("")
  //const [bot, setBot] = useState("You are a search agent with access to sources in current affairs, calculator and Pinecone store.")
  
  const [botImage, setBotImage] = useState('/images/agent007.png');
  const [ocrResult, setOcrResult] = useState('');
  const [toolsSelect, setToolsSelect] = useState(['WebPilot', 'Calculator', 'Pinecone Store']);
  //['WebPilot', 'Calculator', 'Pinecone Store', 'Your AI Council']
  //Webpilot 2.8 s
  //Google 2 s
  //Link Reader (no good answer)
  //AI Council (no good answer)
  //Keymate AI (no good answer)
  //URL Reader (no good answer)
  const [log, setLog] = useState('');
  const [radio, setRadio] = useState(1);
  const [birdIcon, setBirdIcon] = useState(<Image src="/parroticon.png" alt="AI" width="30" height="30" className={styles.boticon} priority={true} />)
  const [toolsModel, setToolsModel] = useState([]);
  const [talking, setTalking] = useState(false);

  const messageListRef = useRef(null);
  const chatRef = useRef([]);
  const textAreaRef = useRef(null);
  const toolsRef = useRef(null);
  const pageRef = useRef(null);
  const treeRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;

    // const page = pageRef.current;
    // page.scrollTop = messageList.scrollHeight;
  }, [messages]);

  useEffect(() => {
    let birdEl;
    if (radio === 1) {
      birdEl = <Image src="/parroticon.png" alt="AI" width="30" height="30" className={styles.boticon} priority={true} />
    } else {
      birdEl = <Image src="/bluemacaw.png" alt="AI" width="30" height="30" className={styles.boticon} priority={true} />
    }
    setBirdIcon(birdEl)
  }, [radio])

  // Focus on text field on load
  useEffect(() => {
    // textAreaRef.current.focus();

    const getPrompts = async () => {
      const prompts = await definePrompts();
      setPrompts(prompts);
      setMessages([new SystemChatMessage(prompts[0].prompt)])
    };

    getPrompts();

    window.speechSynthesis.addEventListener('voiceschanged', updateButtonDisabled);

  }, []);

  function updateButtonDisabled() {
    setTalking(window.speechSynthesis.speaking)
  }

  useEffect(() => {
    // textAreaRef.current.focus();

    async function getData() {
      const response = await fetch('/api/tools');
      const data = await response.json();
      let tools = data.tools
      setToolsModel(tools);
    }
    getData();

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

  const handleAgentToolsChange = (value) => {
    setToolsSelect(value);
  };

  // Handle form submission
  const handleNormalChat = async () => {

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);

    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot: bot,
        question: userInput,
        history: history,
      }),
    });


    const response = await ApiChat(bot, userInput, history, setMessages);

    // Reset user input
    setUserInput("");
    const data = response;

    //console.log("response=>", response)

    if (!data?.result) {
      handleError();
      return;
    }

    setLoading(false);

  };



  // function extractObjects(input) {
  //   const regex = /(.*)``````json(.*)/; // matches any object in the input string
  //   const matches = input.match(regex); // finds all matches of the regex in the input string
  //   const question = JSON.parse(matches[0]); // parses the first match as a JSON object
  //   const finalanswer = JSON.parse(matches[1]); // parses the second match as a JSON object
  //   return [question, finalanswer];
  // }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (radio === 1) {
      handleNormalChat();
    } else {
      handleAgentChat();
    }
  }

  const handleAgentChat = async () => {

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, new HumanChatMessage(userInput)]);
    setMessages((prevMessages) => [...prevMessages, new AIChatMessage(">")]);

    const controller = new AbortController();

      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot: bot,
          question: userInput,
          toolsSelect: toolsSelect
        }),
      });

    try {
      const response = await fetch('/api/agentchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot: bot,
          question: userInput,
          history: history,
          toolsSelect: toolsSelect
        }),
        signal: controller.signal // optional, used to cancel the request
      });

      const reader = response.body.getReader()

      let tokens;

      while (true) {
        const { done, value } = await reader.read();

        const decoded = new TextDecoder().decode(value)
        tokens += decoded;

        setMessages((prevMessages) => [...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(tokens)]);


        if (done) {
          //console.log(tokens)
          const t2 = tokens.replace(/undefined/g, '').replace(/```json/g, "").replace(/```/g, "").replace(/NaN/g, "")
          //console.log(t2)
          const t3 = parseAndCombineJSONObjects(t2, treeRef.current)
          console.log(t3)
          setMessages((prevMessages) => [...prevMessages.slice(0, prevMessages.length - 1), new AIChatMessage(t3)]);
          break;
        }
      }

    } catch (err) {
      console.error(err)
    }
    setLoading(false);
    setUserInput("");

  };

  const handlePineconeChat = async () => {

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, new HumanChatMessage(userInput)]);

    const response = await fetch('/api/pineconechat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot: 'pinecone',
        question: userInput,
        history: history,
      }),
      signal: new AbortController().signal // optional, used to cancel the request
    });

    const reader = response.body.getReader();
    let chunks = '';

    setMessages((prevMessages) => [...prevMessages, new AIChatMessage("")]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const decoded = new TextDecoder().decode(value)
      //console.log("decoded",decoded)
      try {
        chunks = chunks + JSON.parse(decoded);
      } catch {
        chunks = chunks + decoded;
      }
      setMessages((prevMessages) => [...prevMessages.slice(0, -1), new AIChatMessage(chunks)]);
    }

    //const responseText = new TextDecoder().decode(chunks);
    //const responseData = JSON.parse(responseText);

    setLoading(false);
    setUserInput("");
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

  const handleTextToSpeech = async (index) => {
    if (!talking) {
      const chatLog = chatRef.current[index].textContent;
      if (!window.speechSynthesis) {
        alert("Speech Synthesis not supported")
        return
      }
      setTalking(true)
      const utterance = new SpeechSynthesisUtterance(chatLog)
      utterance.onend = function (event) {
        console.log('Speech synthesis completed');
        setTalking(false)
      };
      let voices = await window.speechSynthesis.getVoices();
      //console.log(voices)
      // const c = [0,1,2,4,5,6] all english
      const c = [2, 5] //women

      utterance.voice = voices[2]
      //0 to 2, default 1
      utterance.pitch = 1
      //0 to 10
      utterance.rate = 1.2
      window.speechSynthesis.speak(utterance)
      //setTalking(false)

    } else {
      window.speechSynthesis.cancel()
      setTalking(false)
    }
  }

  const onChangeTab = (key) => {
    router.push('/?page=' + key)
  };

  const handleRadioChange = (e) => {
    setRadio(e.target.value);
  }


  const tabPage1 = <>
    <div className={styles.cloud}>
      <div ref={messageListRef} className={styles.messagelist}>
        {messages.map((message, index) => {
          return (
            // The latest message sent by the user will be animated while waiting for a response
            <div key={index} className={message._getType() === "human" && loading && index === messages.length - 1 ? styles.usermessagewaiting : (message._getType() === "system" || message._getType() === "ai") ? styles.apimessage : styles.usermessage}>
              {/* Display the correct icon depending on the message type */}
              {(message._getType() === "ai" || message._getType() === "system") ? birdIcon : <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority={true} />}
              <div ref={el => (chatRef.current[index] = el)} className={styles.markdownanswer}>
                {/* Messages are being rendered in Markdown format */}
                <ReactMarkdown linkTarget={"_blank"} children={message.text} rehypePlugins={[rehypeRaw]}></ReactMarkdown>
                <div ref={treeRef} />
              </div>
              <div className={styles.verticalButtonGroup}>
                <Button className={styles.copyButton} onClick={() => handleCopyHTML(index)}>
                  <CopyOutlined />html
                </Button>
                <Button className={styles.copyButton} onClick={() => handleCopyText(index)}>
                  <CopyOutlined />text
                </Button>
                <Button className={styles.talkButton} onClick={() => handleTextToSpeech(index)}>
                  {!talking ? <PlaySquareOutlined /> : <StopOutlined />}{!talking ? 'speak' : 'stop'}{talking && <SoundOutlined className={styles.talk} />}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
    <div className={styles.center}>
      <form className={styles.form}>
        {/* className={`${styles.cloudform} ${styles.leftform}`} */}
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
        <Tooltip title={<p>Normal Bot / Agent Bot</p>} color="#64e331"
          placement="left"
          trigger="hover"
          destroyTooltipOnHide={true}
          arrow={false}
          zIndex={20}>
          <button
            type="submit"
            disabled={loading}
            className={styles.generatebutton}
            onClick={handleSubmit}
          >
            {loading ? <div className={styles.loadingwheel}><Spin indicator={antIcon} /></div> :
              // Send icon SVG in input field
              <><img className={styles.openaisvgicon} src="/openai-logo.svg" alt="OpenAI Logo" /><svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
              </svg></>}
          </button></Tooltip>
        <Tooltip title={<p>Only Chat With Your Own Documents in Pinecone</p>} color="#64e331"
          placement="left"
          trigger="hover"
          destroyTooltipOnHide={true}
          arrow={false}
          zIndex={20}>
          <button
            type="submit"
            disabled={loading}
            className={styles.pineconegeneratebutton}
            onClick={handlePineconeChat}
          >
            {loading ? <div className={styles.loadingwheel}><Spin indicator={antIcon} /></div> :
              // Send icon SVG in input field
              <><img className={styles.pineconesvgicon} src="/pinecone-logo.svg" alt="Pinecone Logo" /><svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
              </svg></>}
          </button></Tooltip>
      </form>
      {/* <details closed="true" style={{ margin: "8px auto 8px 0" }}>
        <summary className={styles.summary}>
          Agent Chat Logger
        </summary>
        <Logger log={log} setLog={setLog} />
      </details> */}

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
      label: `Pdf Loader`,
      children: <TabPage2 />,
    },
    {
      key: '3',
      label: `Web Loader`,
      children: <TabPage3 />,
    },
    {
      key: '4',
      label: `Plugins`,
      children: <TabPage4 toolsModel={toolsModel} setToolsModel={setToolsModel} setToolsSelect={setToolsSelect} />,
    },
  ];





  const tagRender = (props) => {

    const { label, value, closable, onClose } = props;
    const onPreventMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };


    return (
      <Tag
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{
          margin: 2,
          marginRight: 3,
          // fontSize: 14,
          padding: "2px 8px",
          backgroundColor: toolsModel ? (toolsModel[toolsModel?.findIndex(tool => (tool.value === value))]?.tagbgColor) : 'transparent',
          color: toolsModel ? (toolsModel[toolsModel?.findIndex(tool => (tool.value === value))]?.tagcolor) : 'white',
          borderRadius: 4,
        }}
        children={label}
      >

      </Tag>
    );
  };

  // options={toolsModel.map((tool) => ({
  //   ...tool,
  //   label: (
  //     <span style={{ backgroundColor: tool.color }}>
  //       <span>{tool.label}({tool.tag})</span>
  //     </span>
  //   ),
  // }))}

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

          <div className={styles.navlinkscolumn}>
            <div className={styles.navlinks}>
              <div className={styles.navlogo}>
                <a href="/">My LangChain</a>
              </div>
              <div className={styles.navlinks2}>
                <Space>
                  <a href="https://js.langchain.com/" target="_blank">Docs</a>
                  <a href="https://github.com/ernesttan1976/mylangchain" target="_blank">GitHub</a>
                </Space>
              </div>
            </div>
            <div className={styles.navlinksrow}>
            <Radio.Group value={radio} defaultValue={1} buttonStyle="solid" onChange={handleRadioChange}>
              <Tooltip title={<p>Plain vanilla ChatGPT which you know and love</p>} color="#64e331"
                placement="top"
                trigger="hover"
                destroyTooltipOnHide={true}
                arrow={{ pointAtCenter: true }}
                zIndex={1}>
                <Radio.Button value={1} styles={{ width: 120 }}><Parrot />Normal Bot</Radio.Button>
              </Tooltip>
              <Tooltip title={<div>Agent bot is ChatGPT on sterioids<br />
                1. Updated web information<br />
                2. Accurate calculations<br />
                3. Query your documents</div>} color="#108ee9"
                placement="top"
                trigger="hover"
                destroyTooltipOnHide={true}
                arrow={{ pointAtCenter: true }}
                zIndex={1}>
                <Radio.Button value={2} styles={{ width: 120 }}><Macaw />Agent Bot </Radio.Button>
              </Tooltip>
            </Radio.Group>
            </div>
            <div className={styles.navlinksrow2}>
              {prompts && <SelectComponent prompts={prompts} bot={bot} setBotImage={setBotImage} setBot={setBot} setRadio={setRadio} />}
              <Tooltip title={<p>hmm...I need better answers<br />Agent + Tools</p>} color="#108ee9"
                placement="top"
                trigger="hover"
                destroyTooltipOnHide={true}
                arrow={{ pointAtCenter: true }}
                zIndex={1}>
                <Select
                  mode="multiple"
                  allowClear
                  className={styles.select2}
                  placeholder="Agent Tools"
                  tagRender={tagRender}
                  onChange={handleAgentToolsChange}
                  options={toolsModel?.map((tool) => ({
                    ...tool,
                    label: <div style={{ display: "flex", flexDirection: "column" }} title={tool.description}>
                      <span style={{ display: "flex" }}>{tool.label}&nbsp;({tool.tagname})</span>
                    </div>,
                    title: tool.label + " (" + tool.tagname + ")\n" + tool.description
                  }))}
                  value={toolsSelect}
                  ref={toolsRef}
                /></Tooltip>
            </div>
          </div>
        </div>
        <main ref={pageRef} className={styles.main}>
          <Tabs className={styles.tab} centered defaultActiveKey="1" activeKey={page} size={{ sm: 'small', md: 'large' }} items={tabPages} onChange={onChangeTab} />
        </main >
        <div className={styles.footer}>
          <p>Powered by <a href="https://js.langchain.com/" target="_blank">LangChain</a>. Frontend chat forked from <a href="https://twitter.com/chillzaza_" target="_blank">Zahid</a>. Experimented and adapted by <a href="https://www.linkedin.com/in/ernest-tan-dev/">Ernest</a>.</p>
        </div>
      </ConfigProvider>
    </>
  )
}
