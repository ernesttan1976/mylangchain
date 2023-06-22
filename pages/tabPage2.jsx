"use client"
import { useState, useRef, useEffect } from "react";
import { message, Button } from 'antd';
import styles from "../styles/TabPage2.module.css"
import ReactMarkdown from 'react-markdown'
import { humanizeFileSize } from '../lib/utils.js'
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useRouter } from 'next/navigation';

const antIcon = (
  <LoadingOutlined
    style={{
      fontSize: 24,
    }}
    spin
  />
);
export default function TabPage2() {
  const [file, setFile] = useState();
  const [fileChunks, setFileChunks] = useState([]);

  const [userInputEmbedding, setUserInputEmbedding] = useState("");
  const [loading, setLoading] = useState(false);
  const [embeddingComplete, setEmbeddingComplete] = useState(false);
  const [chunkMessage, setChunkMessage] = useState("");
  const [chunkIndex, setChunkIndex] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveIndex, setSaveIndex] = useState(null)

  //saving the file data after step 1
  const [objects, setObjects] = useState([]);

  const [documents, setDocuments] = useState([]);

  const router = useRouter();

  const embeddingsRef = useRef(null);
  const namespaceRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/documents');
      const docs = await response.json();
      setDocuments(docs.documents);
    }
    setLoading(true);
    fetchData();
    setLoading(false);
  }, [])

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFile(file);
    const chunkSize = 4 * 1024 * 1024; // 4 MB
    const chunks = [];
    let start = 0;
    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      chunks.push(chunk);
      start += chunkSize;
    }
    setFileChunks(chunks);
  };


  const uploadChunks = async () => {
    setLoading(true);

    //deletes the file objects from previous uploads
    const response = await fetch("/api/clearfile", {
      method: "GET",
    });
    const data = await response.json();
    if (data.message) {
      message.success(data.message);
    }

    const promises = fileChunks.map(async (chunk, index) => {
      const formData = new FormData();
      formData.append("namespace", "pdf");
      formData.append("file", chunk);
      formData.append("index", index);
      formData.append("count", fileChunks.length);
      formData.append(
        "fileParams",
        JSON.stringify({
          originalname: file.name.replace(/\s+/g, ""),
          mimetype: file.type,
          size: file.size,
        })
      );

      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.message) {
        message.success(data.message);

        //only the last chunk then set the objects
        if (data.docs) {
          setObjects((prev) => {
            const newObject = {
              file: file,
              path: data.path,
              docs: data.docs,
              fileData: data.fileData,
              id: data.id,
            };
            return [...prev, newObject];
          });
        }
      } else if (data.skip) {
        //just ignore
      } else {
        message.error(data.error);
      }
      formData.delete("file");
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    setLoading(false);
  };

  const handleSubmit2 = async (id, index) => {

    try {
      event.preventDefault();
      const formData = new FormData();
      const response = await fetch(`/api/embedding/${id}`, {
        method: "POST",
        body: formData,//empty
      });

      const reader = response.body.getReader();
      let embeddingReceived = [];


      while (true) {
        const { done, value } = await reader.read();

        const decoded = new TextDecoder().decode(value)
        //console.log("decoded",decoded)
        const regex = /\/\/.*(?:\r\n|\r|\n)|\/\*(?:[\s\S]*?)\*\//g;
        const cleanedString = decoded.replace(regex, '');
        //console.log(cleanedString)
        let chunk;
        try{
          chunk = JSON.parse(cleanedString);
          
        } catch (e){
          chunk = cleanedString;
        }

        setChunkIndex(index);
        setChunkMessage(chunk.message);
        embeddingReceived.push(chunk);


        //set the embedding values
        setObjects((prev) => {
          const newObject = {
            ...objects[0],
            embedding: embeddingReceived
          };
          // console.log("index:",index,"->newObject.embedding", newObject.embedding[newObject.embedding.length-1])
          //console.log("embeddingReceived:", chunk);
          prev.splice(0, 1, newObject);
          return prev;
        });

        console.log(chunk.message)

        const messageList = embeddingsRef.current;
        if (messageList) messageList.scrollTop = messageList.scrollHeight;

        if (done) {
          message.success('All embeddings received');
          console.log('All embeddings received');
          setEmbeddingComplete(true);
          break;
        }
      }
    } catch (error) {
      console.log(error)
    }
  };


  const handleSubmit3 = async (id, index) => {
    event.preventDefault();
    try {
      const response = await fetch(`/api/pinecone/${id}`);

      const data = await response.json();
      if (data.message) {
        message.success(`Saved in Pinecone vectorstore`);
        setSaveIndex(index);
        setSaveMessage('Saved in Pinecone vectorstore')
      } else {
        message.error(data.error);
      }
    } catch (error) {
      message.error(error);
    }
  };

  const handleDelete = async (id, index) => {
    try {
      const response = await fetch(`/api/documents/${id}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();
      if (data.message) {
        message.success(data.message);
        setDocuments(prev => ([...prev.slice(0, index), ...prev.slice(index + 1)]));
      } else {
        message.error(data.error);
      }
    } catch (error) {
      message.error(error);
    }
  }


  return (
    <>
      <details open>
        <summary>
          Manage Documents
        </summary>
        <div className={styles.cloud}>
          {loading && <div className={styles.loadingwheel}><Spin indicator={antIcon} /></div>}
          <table className={styles.table}>
            <thead><tr><th>Id</th><th>File Data</th><th>Page Content</th><th>Embedding</th><th>Saved in Pinecone</th></tr></thead>
            <tbody>
              {documents.length > 0 && documents.map((document, index) => (
                <tr key={index}>
                  <td>{index + 1}.</td>
                  <td><a href={document.fileData?.url}><u>{document.fileData?.name}</u><br />({humanizeFileSize(document.fileData?.size)})</a>
                    <Button className={styles.filebuttonsmall} onClick={() => window.open(`/api/documents/${document._id}`)}>Show JSON</Button>
                    <Button className={styles.filebuttonsmall} type="submit" onClick={() => handleDelete(document._id, 0)} >Delete</Button>
                  </td>
                  <td>
                    {document.pageContentSummary.length && document.pageContentSummary.map((summary, index) => (
                      <details key={index + 2000}>
                        <summary>
                          {summary.slice(0, 100)}
                        </summary>
                        {summary}
                      </details>))}
                  </td>
                  <td>
                    <Button className={styles.filebuttonsmall} type="submit" onClick={() => handleSubmit2(document._id, index)} >Get Embeddings</Button>
                    {(chunkMessage && index===chunkIndex)? <p styles={{backgroundColor: 'green'}}>{chunkMessage}</p> : document.embeddingSummary[0] !== '""' && document.embeddingSummary.map((summary, index) => (
                      <details key={index + 3000}>
                        <summary>
                          {`${summary.slice(0, 50)}...`}
                        </summary>
                        {`${summary.slice(0, 500)}...`}
                      </details>))}
                  </td>
                  <td><Button className={styles.filebuttonsmall} type="submit" disabled={document?.savedInPinecone ? true : false} onClick={() => handleSubmit3(document._id, 0)} >Save</Button>
                  {(saveMessage && index===saveIndex)? <p styles={{backgroundColor: 'green'}}>{saveMessage}</p> :
                    (document?.savedInPinecone ? "Yes" : "No")}
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </details>
      <div className={styles.cloud}>
        <form className={styles.form} onSubmit={uploadChunks}>
          <label className={styles.label}>New file: Upload Pdf</label>
          <div className={styles.filebox}>

            <input className={styles.fileinput} type="file" accept=".pdf" onChange={handleFileChange} />
            {/* <label >Namespace  <input ref={namespaceRef} className={styles.textinput} type="text" name="namespace" default="coding" placeholder="coding" title="Use keywords for searching this document" /></label> */}
            <Button className={styles.filebutton} type="submit" onClick={uploadChunks} disabled={file ? false : true}>Upload PDF</Button>
          </div>
        </form>
      </div>
      {objects.length>0 && <><div className={styles.cloud}>
        <form className={styles.form}>
          <h3 styles={{ width: '80%' }}><a href={objects[0].fileData?.url || '/'} download>{`${objects[0].fileData?.name || 'filename'}   size: ${humanizeFileSize(objects[0].fileData?.size || 0)}`}</a></h3>
          <div className={styles.markdownanswer}>
            <ReactMarkdown linkTarget={"_blank"}>{'\n```json\n' + JSON.stringify(objects[0].vectors?.map((vector, vectorIndex) => {
              return ('\n\PAGE ' + vectorIndex + 1 + '\n\n\n' + vector.pageContent)
            }).join('')) + '\n```json\n' || 'Page Content'}</ReactMarkdown>
          </div>
          <Button className={styles.filebutton} type="submit" onClick={() => handleSubmit2(objects[0].id, index)} >Get Embeddings</Button>
        </form>
      </div>
      <div className={styles.cloud}>
        <form className={styles.form}>
          <h3>Embeddings from OpenAI : {embeddingComplete && 'Complete! Ready to Save to Pinecone'}</h3>
          <div ref={embeddingsRef} className={styles.markdownanswer}>
            {/* Messages are being rendered in Markdown format */}
            <ReactMarkdown linkTarget={"_blank"}>{objects[0].embedding?.length && JSON.stringify(objects[0].embedding[objects[0].embedding.length - 1]) || 'Embedding'}</ReactMarkdown>
          </div>
          <Button className={styles.filebutton} type="submit" disabled={embeddingComplete ? false : true} onClick={() => handleSubmit3(objects[0].id, index)} >Save to PineCone</Button>
        </form>
      </div></>}
    </>
  )
}


