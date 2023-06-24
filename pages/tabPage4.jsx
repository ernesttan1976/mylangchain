// import { useEffect, useState } from "react";
import { Button, message } from "antd";
import styles from "../styles/Home.module.css"

export default function TabPage4(props) {


    const {toolsModel, setToolsModel} = props;

    // useEffect(() => {
    //     async function getData() {
    //         const response = await fetch('/api/tools');
    //         const data = await response.json();
    //         let arr = data.tools
    //         setTools(arr);
    //     }
    //     getData();

    // }, [])

    function handleChange(ev, index) {
        const key = ev.target.name;
        const editedTool = {
            ...toolsModel[index],
            [key]: ev.target.value,
        }
        setToolsModel((prev) => ([...prev.slice(0, index), editedTool, ...prev.slice(index + 1)]));
    }

    async function handleSave(id, index) {
        const response = await fetch('/api/tools/' + id, {
            method: "PUT",
            body: JSON.stringify({
                label: toolsModel[index].label,
                value: toolsModel[index].value,
                url: toolsModel[index].url,
                description: toolsModel[index].description,
                tagname: toolsModel[index].tagname,
                tagbgColor: toolsModel[index].tagbgColor,
                tagcolor: toolsModel[index].tagcolor,
            }),
            headers: {
                "Content-Type": "application/json",
                //'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        if (response.ok) {
            const data = await response.json();
            console.log(response, data)
            message.success(data.message)
        } else {
            message.error(response.statusText)
        }
    }

    async function handleDelete(id, index) {
        const response = await fetch('/api/tools/' + id, {
            method: "DELETE"
        });
        if (response.ok) {
            const data = await response.json();
            message.success(data.message)
            setToolsModel(prev => (
                [...prev.splice(index, 1)]
            ))
        } else {
            message.error(response.statusText)
        }

    }

    let localURL;
    if (process.env.NODE_ENV === 'development') {
        localURL = "http:/localhost:3000/"
    } else {
        localURL = "https://mylangchain.vercel.app/";

    }

    return (
        <div className={styles.center}>
            <Button className={styles.installpluginbutton}><a href={`https://getit.ai/gpt-plugins/?install_url=${localURL}api/installplugin/?install_plugin={manifestUrl}`} target="_blank">Install Plugins from GetIt.Ai</a></Button>
            <form className={styles.table2}>
                <table><thead><tr><th>Label</th><th>Value</th><th>Url</th><th>Description</th><th>Tag</th><th>Bg Color</th><th>Color</th><th>Actions</th></tr></thead>
                    <tbody>
                        {toolsModel && toolsModel.map((tool, index) => (
                            <tr key={index + 1000}>

                                <td><textarea rows={2} cols={30} type="text" name="label" value={tool.label} onChange={(ev) => handleChange(ev, index)} /></td>
                                <td><textarea rows={2} cols={30} type="text" name="value" value={tool.value} onChange={(ev) => handleChange(ev, index)} /></td>
                                <td><textarea rows={2} cols={30} type="text" name="url" value={tool.url} onChange={(ev) => handleChange(ev, index)} /></td>
                                <td><textarea rows={2} cols={30} type="text" name="description" value={tool.description} onChange={(ev) => handleChange(ev, index)} /></td>
                                <td><textarea rows={2} cols={30} type="text" name="tagname" value={tool.tagname} onChange={(ev) => handleChange(ev, index)} /></td>
                                <td><textarea rows={2} cols={30} type="text" name="tagbgColor" value={tool.tagbgColor} onChange={(ev) => handleChange(ev, index)} /></td>
                                <td><textarea rows={2} cols={30} type="text" name="tagcolor" value={tool.tagcolor} onChange={(ev) => handleChange(ev, index)} /></td>
                                <td><Button type="submit" className={styles.savebutton} onClick={() => handleSave(tool._id, index)}>Save</Button><Button className={styles.savebutton} type="submit" onClick={() => handleDelete(tool._id)}>Delete</Button></td>
                            </tr>
                        ))}
                    </tbody></table>
            </form>
        </div>
    )
}