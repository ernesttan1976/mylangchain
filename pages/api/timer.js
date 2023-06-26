import { Readable } from 'stream';

export default async function handler(req, res) {
    // Set the timeout value (in milliseconds)
    const timeout = 5000; // 5 seconds

    // Set the response headers
    res.setHeader('Content-Type', 'text/plain');

    // Create a readable stream
    const stream = new Readable();
    stream._read = () => { };


    // Start streaming data
    let counter = 0;
    const interval = setInterval(() => {
        console.log(`Data ${counter}\n`)
        stream.push(`Data ${counter}\n`);
        counter++;

        // Check if the response has been closed
        if (res.writableEnded) {
            clearInterval(interval);
            stream.push(null); // Signal the end of the stream
        }
    }, 100); // Emit data every second

    // Pipe the stream to the response
    stream.pipe(res);

    // Set the timeout
    const timeoutId = setTimeout(() => {
        clearInterval(interval);
        res.end('Timeout'); // Send a response when timeout occurs
    }, timeout);


    // Clear the timeout when the response is finished
    res.on('finish', () => {
        clearTimeout(timeoutId);
    });
}
