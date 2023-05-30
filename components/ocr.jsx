"use client"
import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import debounce from 'lodash/debounce';
import "../styles/OCR.module.css"

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
            videoRef.current.style.display = "block";

            videoRef.current.addEventListener('loadedmetadata', () => {
                canvasRef.current.width = videoRef.current.width;
                canvasRef.current.height = videoRef.current.height;

                const context = canvasRef.current.getContext('2d');
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const dataUrl = canvasRef.current.toDataURL('image/png');

                imageRef.current.style.display = "block";
                setImageSrc(dataUrl);
                sharpenImage();
            })
        }
    };

    const handleOCR = async () => {
        const { data } = await Tesseract.recognize(canvasRef.current.toDataURL(), language)
        setOcrResult(data.text);
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
            sharpenImage();
        };
    }

    function sharpenImage() {
        const image = imageRef.current;
        canvasRef.current.style.display = "block";

        // Create a canvas element to hold the image
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set the canvas dimensions to match the image
        canvas.width = 240;
        canvas.height = 320;

        // Draw the image onto the canvas
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Apply a sharpening filter to the canvas
        context.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px) url(#sharpen-filter)`;

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        console.log(context.filter)
        // Replace the original image with the sharpened image
        //image.src = canvas.toDataURL();

    }




    return (
        <div className={OCR.column}>
            <div className={OCR.column}>
                <div className={OCR.row}>
                    <input
                        label="Upload image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                </div>
                <div className={OCR.row}>
                    {imageSrc && <button onClick={handleOCR}>Recognize text</button>}
                    <div className={OCR.row}>
                        <label htmlFor="language-select">Choose a language:</label>
                        <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="eng">English</option>
                            <option value="chi_sim">Simplified Chinese</option>
                        </select>
                    </div>
                    {ocrResult ? <p>{ocrResult}</p> : "No text detected"}
                </div>
                <div className={OCR.column}>
                    <div className={OCR.row}>
                        <div className={OCR.column}>
                            <div className={OCR.row}>
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
                            <div className={OCR.row}>
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
                            <div className={OCR.row}>
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
                            <div className={OCR.row}>
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
                            <div className={OCR.row}>
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
                        </div>
                        <div className={OCR.column}>
                            <h4>Corrected Image</h4>
                            <canvas
                                className={OCR.canvas}
                                ref={canvasRef}
                                id="canvas"
                                style={{ display: "none" }}
                            />
                        </div>
                    </div>
                    <h4>Original Image</h4>
                    {/* <img ref={imageRef} src={imageSrc} alt="No image" styles={{ display: imageSrc ? "block" : "none" }} /> */}

                    <img className={OCR.image} ref={imageRef} src={imageSrc} style={{ display: imageSrc ? "block" : "none" }} alt="No image" />
                    <svg>
                        <filter id="sharpen-filter">
                            <feConvolveMatrix order={sharpenMatrix[sharpenIndex].size} kernelMatrix={sharpenMatrix[sharpenIndex].matrix} preserveAlpha="true" />
                        </filter>
                    </svg>
                </div>
            </div>
            <div className={OCR.column}>
                <button onClick={debouncedHandleCapture}>Take Photo</button>
                {videoRef.current?.style.display === "block" && <button onClick={handleCloseVideo}>Close Camera</button>}
            </div>
            <div className={OCR.row}>

                <video className={OCR.video} ref={videoRef} autoPlay styles={{ display: "none" }} />
            </div>

        </div>
    );
}
export default OCR;