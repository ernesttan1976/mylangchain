"use client"
import { useState, useRef, useEffect } from "react";
import { message, Button } from 'antd';
import styles from "../styles/TabPage2.module.css"
import ReactMarkdown from 'react-markdown'
import { humanizeFileSize } from '../lib/utils.js'

export default function TabPage2() {
  const [file, setFile] = useState();
  const [fileChunks, setFileChunks] = useState([]);

  const [userInputEmbedding, setUserInputEmbedding] = useState("");
  const [loading, setLoading] = useState(false);
  const [embeddingComplete, setEmbeddingComplete] = useState(false);

  //saving the file data after step 1
  const [objects, setObjects] = useState([]);

  const [documents, setDocuments] = useState([]);

  const embeddingsRef = useRef(null);
  const namespaceRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/documents');
      const docs = await response.json();
      console.log(docs)
      setDocuments(docs.documents);
    }
    fetchData();
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
        body: formData,
      });

      const reader = response.body.getReader();
      let embeddingReceived = [];

      while (true) {
        const { done, value } = await reader.read();

        const chunk = JSON.parse(new TextDecoder().decode(value));

        embeddingReceived.push(chunk);


        //set the embedding values
        setObjects((prev) => {
          const newObject = {
            ...objects[index],
            embedding: embeddingReceived
          };
          // console.log("index:",index,"->newObject.embedding", newObject.embedding[newObject.embedding.length-1])
          console.log("embeddingReceived:", chunk);
          prev.splice(index, 1, newObject);
          return prev;
        });

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
        message.success(`${data.message} save ${data.vectorStore} items in Pinecone vectorstore`);
      } else {
        message.error(data.error);
      }
    } catch (error) {
      message.error(error);
    }
  };


  return (
    <>
      <div className={styles.cloud}>
        <table className={styles.table}>
          <thead><tr><th>Id</th><th>File Data</th><th>Page Content</th><th>Embedding</th><th>Pinecone</th></tr></thead>
          <tbody>
          {documents.length > 0 && documents.map((document, index) => (
            <tr>
              <td><a href={`/api/documents/${document._id}`}>{index+1}.</a></td>
              <td><a href={document.fileData?.url}><u>{document.fileData?.name}</u><br/>({humanizeFileSize(document.fileData?.size)})</a></td>
              <td>
                {document.pageContentSummary.length && document.pageContentSummary.map((summary,index)=>(
                <details key={index+2000}>
                <summary>
                {summary.slice(0,100)}
                </summary>
                {summary}
                </details>))}
              </td>
              <td>{document.embeddingSummary[0]!=='""' && document.embeddingSummary.map((summary,index)=>(
                <details key={index+3000}>
                <summary>
                {`${summary.slice(0,50)}...`}
                </summary>
                {`${summary.slice(0,500)}...`}
                </details>))}</td>
              <td>{document?.savedInPinecone ? "Yes":"No"}</td>
            </tr>))}
          </tbody>
        </table>
      {false && objects.length > 0 && objects.map((object, index) => (
        <>
          <div key={index} className={styles.cloud}>
            <form className={styles.form}>
              <h3 styles={{ width: '80%' }}><a href={object.fileData.url} download>{`${index + 1}.   ${object.fileData.name}   size: ${humanizeFileSize(object.fileData.size)}`}</a></h3>
              <div className={styles.markdownanswer}>
                <ReactMarkdown linkTarget={"_blank"}>{'\n```json\n' + JSON.stringify(object.vectors.map((vector, vectorIndex) => {
                  return ('\n\PAGE ' + vectorIndex + 1 + '\n\n\n' + vector.pageContent)
                }).join('')) + '\n```json\n'}</ReactMarkdown>
              </div>
              <Button className={styles.filebutton} type="submit" onClick={() => handleSubmit2(document._id, index)} >Get Embeddings</Button>
            </form>
          </div>
          {true &&
            <div key={index + 1000} className={styles.cloud}>
              <form className={styles.form}>
                <h3>Embeddings from OpenAI : {embeddingComplete && 'Complete! Ready to Save to Pinecone'}</h3>
                <div ref={embeddingsRef} className={styles.markdownanswer}>
                  {/* Messages are being rendered in Markdown format */}
                  <ReactMarkdown linkTarget={"_blank"}>{object.embedding?.length && JSON.stringify(object.embedding[object.embedding.length - 1])}</ReactMarkdown>
                </div>
                <Button className={styles.filebutton} type="submit" disabled={embeddingComplete ? false : true} onClick={() => handleSubmit3(object.id, index)} >Save to PineCone</Button>
              </form>
            </div>}
        </>
      ))}
      </div>
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
    </>
  )
}


