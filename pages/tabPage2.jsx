"use client"
import { useState, useRef, useEffect } from "react";
import { message, Button } from 'antd';
import styles from "../styles/TabPage2.module.css"
import ReactMarkdown from 'react-markdown'
import { humanizeFileSize } from '../lib/utils.js'



export default function TabPage2() {
    const [file, setFile] = useState();
    const [userInputEmbedding, setUserInputEmbedding] = useState("");
    const [loading, setLoading] = useState(false);

    //saving the file data after step 1
    const [objects, setObjects] = useState([]);

    const embeddingsRef = useRef(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload-pdf", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        console.log(data);
        if (data.message) {
            message.success(data.message);
            //message.success(JSON.stringify(data.docs));
            setObjects((prev) => {
                const newObject = {
                    file: file,
                    path: data.path,
                    docs: data.docs,
                    fileData: data.fileData,
                    id: data.id,
                };
                //console.log(file)
                return ([...prev, newObject])
            });
            console.log(objects)
        } else {
            message.error(data.error);
        }
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
                    break;
                }
            }
        } catch (error) {
            console.log(error)
        }
    };


    const handleSubmit3 = async (id, index) => {
        event.preventDefault();
        // const formData = new FormData();
        // console.log(formData)
        // const response = await fetch(`/api/pinecone/${id}`, {
        //     method: "POST",
        //     body: formData,
        // });

    };


    return (
        <>
            <div className={styles.cloud}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label}>Step 1: Upload Pdf</label>
                    <div className={styles.filebox}>
                        <input className={styles.fileinput} type="file" accept=".pdf" onChange={handleFileChange} />
                        <Button className={styles.filebutton} type="submit" onClick={handleSubmit} disabled={file ? false : true}>Upload PDF</Button>
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
                            <h3>Embeddings from OpenAI</h3>
                            <div ref={embeddingsRef} className={styles.markdownanswer}>
                                {/* Messages are being rendered in Markdown format */}
                                <ReactMarkdown linkTarget={"_blank"}>{JSON.stringify(object.embedding)}</ReactMarkdown>
                            </div>
                            <Button className={styles.filebutton} type="submit" onClick={() => handleSubmit3(object.id)} >Save to PineCone</Button>
                        </form>
                    </div>}
                </>
            ))}
        </>
    )
}


