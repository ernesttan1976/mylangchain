"use client"
import { useState } from 'react';

const StreamingPage = () => {
    const [data, setData] = useState('Press Run to Start');

    async function handleClick(){
        try {
            const response = await fetch('/api/timer',{
                timeout: 5000,
            });
            const reader = response.body.getReader();

            while (true) {

                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                const chunk = new TextDecoder('utf-8').decode(value);
                setData(prevData => prevData + "\n" + chunk);
            }

        } catch (error) {
            console.error(error);
        }

    }

    return (
        <div>
            <h1>{data}</h1>
            <button onClick={handleClick}>Run !!!!!!!</button>
        </div>
    );
};

export default StreamingPage;
