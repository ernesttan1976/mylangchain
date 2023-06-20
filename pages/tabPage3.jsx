import { useState, useRef, useEffect } from "react";
import { message, Button } from 'antd';
import styles from "../styles/TabPage3.module.css"
import ReactMarkdown from 'react-markdown'

import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
const antIcon = (
  <LoadingOutlined
    style={{
      fontSize: 24,
    }}
    spin
  />
);

export default function TabPage3() {
  const [loading, setLoading] = useState(false);
  const [weburl, setWeburl] = useState("");
  const [docs, setDocs] = useState({});

  const textAreaRef2 = useRef(null);

  const handleSubmit = async () => {
    setLoading(true);

    const response = await fetch(`/api/web`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ weburl: weburl }),
    });

    const data = await response.json();
    const messageReceived = data.message;
    const docs = data.docs[0];
    console.log("message:",messageReceived)
    console.log("docs:", docs);
    setDocs(docs);

    message.success(messageReceived);
    setLoading(false);
  }

  return (
    <>
      <div className={styles.center}>
        <form className={`${styles.cloudform} ${styles.leftform}`} >
          <label htmlFor="userInput" className={styles.label}>Web Url</label>
          <textarea
            disabled={loading}
            ref={textAreaRef2}
            autoFocus={false}
            rows={1}
            maxLength={500}
            type="text"
            id="weburl"
            name="weburl"
            placeholder={loading ? "Waiting for response..." : "Web url to be loaded"}
            value={weburl}
            onChange={e => setWeburl(e.target.value)}
            className={styles.textarea}
          />
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
          </button>
        </form>
      </div>
      <div className={styles.cloud}>
        <form className={styles.form}>
          <div className={styles.markdownanswer}>
            {docs && <>
                <h4><a href={docs?.metadata?.source}>{docs?.metadata?.source}</a></h4>
                <ReactMarkdown linkTarget={"_blank"}>{docs?.pageContent}</ReactMarkdown>
              </>}
          </div>
        </form>
      </div>
    </>
  )
}


