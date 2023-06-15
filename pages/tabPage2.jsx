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
    const [embeddingComplete, setEmbeddingComplete]=useState(false);

    //saving the file data after step 1
    const [objects, setObjects] = useState([]);

    const embeddingsRef = useRef(null);
    const namespaceRef = useRef(null);

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


    // // Prevent blank submissions and allow for multiline input
    // const handleEnter = (e) => {
    //     if (e.key === "Enter" && userInput) {
    //         if (!e.shiftKey && userInput) {
    //             handleSubmit(e);
    //         }
    //     } else if (e.key === "Enter") {
    //         e.preventDefault();
    //     }
    // };

    // const handleSubmit = async (event) => {
    //     event.preventDefault();
    //     const formData = new FormData();
    //     formData.append("file", file);
    //     formData.append("namespace", namespaceRef.current.value);
    //     console.log(namespaceRef.current.value)

    //     const response = await fetch("/api/upload-pdf", {
    //         method: "POST",
    //         body: formData,
    //     });
    //     const data = await response.json();
    //     if (data.message) {
    //         message.success(data.message);
    //         //message.success(JSON.stringify(data.docs));
    //         setObjects((prev) => {
    //             const newObject = {
    //                 file: file,
    //                 path: data.path,
    //                 docs: data.docs,
    //                 fileData: data.fileData,
    //                 id: data.id,
    //             };
    //             //console.log(file)
    //             return ([...prev, newObject])
    //         });
    //         console.log(objects)
    //     } else {
    //         message.error(data.error);
    //     }
    // };

    const uploadChunks = async () => {
        setLoading(true);
        
        for (let i = 0; i < fileChunks.length; i++) {
          const formData = new FormData();
          formData.append("namespace", namespaceRef.current.value);
          formData.append("file", fileChunks[i]);
          formData.append("index", i);
          formData.append("count", fileChunks.length);
          formData.append("fileParams", JSON.stringify({
            originalname: file.name.replace(/\s+/g, ''),
            mimetype: file.type,
            size: file.size,
            }));


          //alert(`uploading ${i+1}`)
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
          } else {
            message.error(data.error);
          }
          formData.delete("file");
        }
        //end

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

                const chunk = new TextDecoder().decode(value);

                embeddingReceived.push(chunk);

                //set the embedding values

                setObjects((prev) => {
                    const newObject = {
                        ...objects[index],
                        embedding: embeddingReceived
                    };
                    const newArray = prev.splice(index, 1, newObject);
                    return newArray
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
                <form className={styles.form} onSubmit={uploadChunks}>
                    <label className={styles.label}>Step 1: Upload Pdf</label>
                    <div className={styles.filebox}>

                        <input className={styles.fileinput} type="file" accept=".pdf" onChange={handleFileChange} />
                        <label >Namespace  <input ref={namespaceRef} className={styles.textinput} type="text" name="namespace" default="coding" placeholder="coding" title="Use keywords for searching this document" /></label>
                        <Button className={styles.filebutton} type="submit" onClick={uploadChunks} disabled={file ? false : true}>Upload PDF</Button>
                    </div>
                </form>
            </div>
            {objects.length > 0 && objects.map((object, index) => (
                <><div key={index} className={styles.cloud}>
                    <form className={styles.form}>
                        <h3><a href={object.path} download>{`${index + 1}.   ${object.file.name}   size: ${humanizeFileSize(object.file.size)}`}</a></h3>
                        {/* <div className={styles.textbox}> */}
                        <div className={styles.markdownanswer}>
                            {/* Messages are being rendered in Markdown format */}
                            <ReactMarkdown linkTarget={"_blank"}>{'\n```json\n' + JSON.stringify(object.docs.map((doc, index) => {
                                return ('\n\PAGE ' + index + 1 + '\n\n\n' + doc.pageContent)
                            }).join('')) + '\n```json\n'}</ReactMarkdown>
                        </div>
                        <Button className={styles.filebutton} type="submit" onClick={() => handleSubmit2(object.id, index)} >Get Embeddings</Button>
                    </form>
                </div>
                    {object.embedding && <div key={`${index}A`} className={styles.cloud}>
                        <form className={styles.form}>
                            <h3>Embeddings from OpenAI : {embeddingComplete && 'Complete! Ready to Save to Pinecone'}</h3>
                            <div ref={embeddingsRef} className={styles.markdownanswer}>
                                {/* Messages are being rendered in Markdown format */}
                                <ReactMarkdown linkTarget={"_blank"}>{JSON.stringify(object.embedding)}</ReactMarkdown>
                            </div>
                            <Button className={styles.filebutton} type="submit" disabled={embeddingComplete ? false : true} onClick={() => handleSubmit3(object.id, index)} >Save to PineCone</Button>
                        </form>
                    </div>}
                </>
            ))}
        </>
    )
}


