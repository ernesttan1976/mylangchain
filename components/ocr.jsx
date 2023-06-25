"use client"
import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import debounce from 'lodash/debounce';
import styles from "../styles/OCR.module.css"
import CircularProgress from '@mui/material/CircularProgress';
import { CopyOutlined } from '@ant-design/icons';
import { Button, Divider, Select } from 'antd'


function OCR({ ocrResult, setOcrResult }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const streamRef = useRef(null);
    const [language, setLanguage] = useState('eng');
    const [brightness, setBrightness] = useState(1.2);
    const [contrast, setContrast] = useState(1.2);
    const [saturation, setSaturation] = useState(1.2);
    const [blur, setBlur] = useState(0.5);
    const [sharpenIndex, setSharpenIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const sharpenMatrix = [
        {
            size: 3,
            matrix: "0 -1 0 -1 5 -1 0 -1 0",
        },
        {
            size: 3,
            matrix: "-1 -1 -1 -1 9 -1 -1 -1 -1",
        },
        {
            size: 5,
            matrix: "-1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 25 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1",
        }

    ]

    const handleCapture = async () => {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play();
            videoRef.current.style.display = "flex";
            videoRef.current.style.maxWidth = "auto";
            videoRef.current.style.maxHeight = "auto";
            console.log(videoRef.current);


            videoRef.current.addEventListener('loadedmetadata', () => {
                console.log("loadedmetadata");
                canvasRef.current.style.maxWidth = "auto";
                canvasRef.current.style.maxHeight = "auto";
                canvasRef.current.style.display = "flex"
                console.log(canvasRef.current)

                const context = canvasRef.current.getContext('2d');
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const dataUrl = canvasRef.current.toDataURL('image/png');

                imageRef.current.style.display = "flex";
                imageRef.current.style.maxWidth = "auto";
                imageRef.current.style.maxHeight = "auto";
                console.log(imageRef.current)
                setImageSrc(dataUrl);
                sharpenImage();
            })
        }
    };

    const handleOCR = async () => {
        setLoading(true);
        const { data } = await Tesseract.recognize(canvasRef.current.toDataURL(), language)
        setOcrResult(data.text);
        setLoading(false);
    }

    const handleCloseVideo = async () => {
        videoRef.current.style.display = "none";
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());

    }

    const debouncedHandleCapture = debounce(handleCapture, 500);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setImageSrc(reader.result);
            canvasRef.current.style.display = "flex";
            imageRef.current.style.width = "auto";
            imageRef.current.style.height = "auto";
            sharpenImage();
        };
    }

    function sharpenImage() {
        const image = imageRef.current;
        canvasRef.current.style.display = "flex";

        // Create a canvas element to hold the image
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set the canvas dimensions to match the image
        canvas.width = imageRef.current.width;
        canvas.height = imageRef.current.height;

        // Draw the image onto the canvas
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Apply a sharpening filter to the canvas
        context.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px) url(#sharpen-filter)`;

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        console.log(context.filter)
        // Replace the original image with the sharpened image
        //image.src = canvas.toDataURL();

    }

    const handleCopyText = () => {
        navigator.clipboard.writeText(ocrResult);
    }


    return (
            <div className={styles.column2}>
                    <input
                        label="Upload image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <Divider />
                    <label htmlFor="language-select">Choose a language:</label>
                    <Select style={{width: 200}} 
                        id="language-select" 
                        value={language}
                        defaultValue="chi_sim"
                        onChange={(value) => {
                            setLanguage(value)}}
                        options={[
                            {
                                value: 'eng', label: 'English'
                            },
                            {
                                value: 'chi_sim', label: 'Simplified Chinese'
                            }
                        ]} />
                    
                    {imageSrc && <Button className={styles.ocrButton} onClick={handleOCR}>Recognize text
                    {loading && <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div>}
                    </Button>}
                    {ocrResult ? (<><p style={{ fontSize: "1rem", position: "relative" }}>{ocrResult}<Button className={styles.copyButton} onClick={handleCopyText}>
                        <CopyOutlined />text
                    </Button></p>
                    </>
                    ) : <p style={{ fontSize: "1rem", position: "relative" }}>No text detected</p>}
                    
                    <Divider />
                    <div className={styles.rowright}>
                        <label htmlFor="brightness">Brightness:</label>
                        <input
                            type="range"
                            id="brightness"
                            min="0"
                            max="5"
                            step="0.1"
                            value={brightness}
                            onChange={(e) => { setBrightness(e.target.value); sharpenImage() }}
                        />
                    </div>
                    <div className={styles.rowright}>
                        <label htmlFor="contrast">Contrast:</label>
                        <input
                            type="range"
                            id="contrast"
                            min="0"
                            max="1"
                            step="0.1"
                            value={contrast}
                            onChange={(e) => { setContrast(e.target.value); sharpenImage() }}
                        />
                    </div>
                    <div className={styles.rowright}>
                        <label htmlFor="saturation">Saturation:</label>
                        <input
                            type="range"
                            id="saturation"
                            min="0"
                            max="2"
                            step="0.1"
                            value={saturation}
                            onChange={(e) => { setSaturation(e.target.value); sharpenImage() }}
                        />
                    </div>
                    <div className={styles.rowright}>
                        <label htmlFor="blur">Blur:</label>
                        <input
                            type="range"
                            id="blur"
                            min="0"
                            max="5"
                            step="0.1"
                            value={blur}
                            onChange={(e) => { setBlur(e.target.value); sharpenImage() }}
                        />
                    </div>
                    <div className={styles.rowright}>
                        <label htmlFor="blur">Sharpen Matrix (0,1,2):</label>
                        <input
                            type="range"
                            id="sharpen"
                            min="0"
                            max="2"
                            value={sharpenIndex}
                            onChange={(e) => { setSharpenIndex(e.target.value); sharpenImage() }}
                        />
                    </div>
                    <span>Corrected Image</span>
                    <div style={{ overflow: "auto", width: "70vw", height: "50vw" }}>
                        <canvas
                            className={styles.canvas}
                            ref={canvasRef}
                            id="canvas"
                            style={{ display: "none" }}
                        />
                    </div>
                    <Divider />
                    <span>Original Image</span>
                    <div style={{ overflow: "auto", width: "70vw", height: "50vw" }}>
                        <img className={styles.image} ref={imageRef} src={imageSrc} style={{ display: imageSrc ? "flex" : "none" }} alt="No image" />
                    </div>
                    <svg>
                        <filter id="sharpen-filter">
                            <feConvolveMatrix order={sharpenMatrix[sharpenIndex].size} kernelMatrix={sharpenMatrix[sharpenIndex].matrix} preserveAlpha="true" />
                        </filter>
                    </svg>
            </div>
    );
}
export default OCR;