import { useState, useRef } from "react";
import { message, Row, Col, Button } from 'antd';
import styles from "../styles/TabPage2.module.css"
import ReactMarkdown from 'react-markdown'
import {humanizeFileSize} from '../lib/utils.js'

export default function TabPage2() {
    const [file, setFile] = useState();
    const [userInputEmbedding, setUserInputEmbedding] = useState("");
    const [loading, setLoading] = useState(false);

    //saving the file data after step 1
    const [objects, setObjects] = useState([]);

    const textAreaRef = useRef(null);

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
        console.log(formData)
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
                };
                //console.log(file)
                return ([...prev, newObject])
            });
            console.log(objects)
        } else {
            message.error(data.error);
        }
    };

    // const handleSubmit2 = async (event) => {
    //     event.preventDefault();
    //     // const formData = new FormData();
    //     // formData.append("file", file);
    //     // console.log(formData)
    //     // const response = await fetch("/api/upload-pdf", {
    //     //     method: "POST",
    //     //     body: formData,
    //     // });
    //     // const data = await response.json();
    //     // console.log(data);
    //     // if (data.message) {
    //     //     message.success(data.message);
    //     //     message.success(JSON.stringify(data.docs));
    //     //     setDocs((prev) => {
    //     //         const newDocs = [];
    //     //         newDocs.push(prev);
    //     //         newDocs.push(data.docs);
    //     //         return (newDocs);
    //     //     })
    //     // } else {
    //     //     message.error(data.error);
    //     // }
    // };

    return (
        <>
            <div className={styles.cloud}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label}>Step 1: Upload Pdf</label>
                    <div className={styles.filebox}>
                        <input className={styles.fileinput} type="file" accept=".pdf" onChange={handleFileChange} />
                        <Button className={styles.filebutton} type="submit" onClick={handleSubmit} disabled={file ? false : true }>Upload PDF</Button>
                    </div>
                </form>
            </div>
            {objects.length>0 && objects.map((object, index)=>(
                            <><div key={index} className={styles.cloud}>
                            <form className={styles.form}>
                                <h3><a href={object.path} download>{`${index+1}.   ${object.file.name}   size: ${humanizeFileSize(object.file.size)}`}</a></h3>
                                {/* <div className={styles.textbox}> */}
                                    <div className={styles.markdownanswer}>
                {/* Messages are being rendered in Markdown format */}
                                    <ReactMarkdown linkTarget={"_blank"}>{'\n```json\n'+JSON.stringify(object.docs.map((doc,index)=>{
                                        return('\n\PAGE '+index+1+'\n\n\n'+doc.pageContent)
                                        }).join(''))+'\n```json\n'}</ReactMarkdown>
                                    </div>
                                    <Button className={styles.filebutton} type="submit" onClick={handleSubmit} >Save to PineCone</Button>
                            </form>
                        </div>
                        </>            
            ))}

            {/* <div className={styles.center}>
                <form>
                    <label htmlFor="userInput" className={styles.label}>Upload Embedding</label>
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
                </form>
            </div> */}
        </>
    )
}


