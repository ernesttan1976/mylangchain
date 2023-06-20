## My LangChain

## Getting started 🚀

1. Clone this repo!
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Create .env file with OPENAI_API_KEY='Your key here'

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Experiment

This app is my experiment to try out LangchainJS and to create embedding for GPT/LLM for a specific knowledge area and application.

## Embedding Function Using PineCone / HNSWLib
<ol>
<li>Write NextJS code for uploading a pdf file</li>
<li>Langchain.JS will use the RecursiveCharacterTextSplitter to process the file into chunks.</li>
<li>The processed chunks and the pdf to be saved in local storage "/folder"</li>
<li>User has option to save in Pinecone data store or HNSWLib local storage</li>
<li>write NextJS code to query the Pinecone data store or HNSWLib store AND also OpenAI</li>
</ol>

<ol>
<li>Here's an example Next.js code for uploading a PDF file:</li>
</ol>
<pre><code class="language-jsx">import { useState } from "react";

function UploadPDF() {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) =&gt; {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) =&gt; {
    event.preventDefault();
    const formData = new FormData();
    formData.append("pdf", file);
    const response = await fetch("/api/upload-pdf", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    console.log(data);
  };

  return (
    &lt;form onSubmit={handleSubmit}&gt;
      &lt;input type="file" accept=".pdf" onChange={handleFileChange} /&gt;
      &lt;button type="submit"&gt;Upload PDF&lt;/button&gt;
    &lt;/form&gt;
  );
}

export default UploadPDF;
</code></pre>
<ol start="2">
<li>Here's an example code using Langchain.js to process the PDF file into chunks using RecursiveCharacterTextSplitter:</li>
</ol>
<pre><code class="language-javascript">const Langchain = require("langchain");
const fs = require("fs");

const pdf = fs.readFileSync("path/to/pdf");
const text = Langchain.PDF.extractText(pdf);
const splitter = new Langchain.RecursiveCharacterTextSplitter();
const chunks = splitter.split(text);
console.log(chunks);
</code></pre>
<ol start="3">
<li>To save the processed chunks and the PDF file in local storage, you can use the <code>fs</code> module in Node.js:</li>
</ol>
<pre><code class="language-javascript">const fs = require("fs");

fs.writeFileSync("path/to/local/folder/pdf.pdf", pdf);
fs.writeFileSync("path/to/local/folder/chunks.json", JSON.stringify(chunks));
</code></pre>
<ol start="4">
<li>To save the data in Pinecone data store or HNSWLib local storage, you can use their respective APIs. Here's an example code for Pinecone:</li>
</ol>
<pre><code class="language-javascript">const Pinecone = require("@openai/pinecone");

const pinecone = new Pinecone();
await pinecone.init();
const index = await pinecone.create_index("my-index");
await index.upsert(chunks);
</code></pre>
<p>And here's an example code for HNSWLib:</p>
<pre><code class="language-javascript">const hnswlib = require("hnswlib");

const index = new hnswlib.Index({
  dim: chunks[0].length,
  efConstruction: 200,
  indexFileName: "path/to/local/folder/index.bin",
  storeFileName: "path/to/local/folder/index.store",
});
index.addDataPointBatch(chunks);
index.saveIndex("path/to/local/folder/index.bin");
index.saveIndex("path/to/local/folder/index.store");
</code></pre>
<ol start="5">
<li>To query the Pinecone data store or HNSWLib local storage, you can use their respective APIs. Here's an example code for Pinecone:</li>
</ol>
<pre><code class="language-javascript">const Pinecone = require("@openai/pinecone");

const pinecone = new Pinecone();
await pinecone.init();
const index = await pinecone.get_index("my-index");
const results = await index.query(chunks[0], { k: 10 });
console.log(results);
</code></pre>
<p>And here's an example code for HNSWLib:</p>
<pre><code class="language-javascript">const hnswlib = require("hnswlib");

const index = new hnswlib.Index({
  dim: chunks[0].length,
  efConstruction: 200,
  indexFileName: "path/to/local/folder/index.bin",
  storeFileName: "path/to/local/folder/index.store",
});
index.loadIndex("path/to/local/folder/index.bin");
index.loadIndex("path/to/local/folder/index.store");
const results = index.knnQuery(chunks[0], 10);
console.log(results);
</code></pre>
<p>To query OpenAI, you can use their API. Here's an example code:</p>
<pre><code class="language-javascript">const openai = require("openai");

openai.apiKey = "YOUR_API_KEY";

const prompt = "What is the meaning of life?";
const completions = await openai.completions.create({
  engine: "davinci",
  prompt,
  maxTokens: 10,
  n: 1,
  stop: "\n",
});
console.log(completions.choices[0].text);
</code></pre>

Flow 
1. Chat Mode: Normal chat with the bot. Able to select the bot type with initial prompt. This is the default mode. Free and easy.
2. Web Loader Mode: Load your reference web page. There is a text field to enter a web url.  When submitting a prompt with web url filled in, it means this web page will be referred to as an embedding -> get embedding from OpenAI -> immediately get a response from OpenAI -> Show a button whether to save this embedding in Pinecone. It does not save by default.
3. Pdf Loader Mode: Same as Web Loader, except loading a pdf is more memory intensive and takes longer time to get the embeddings. Because it is costly, the pdf embedding is saved by default in Pinecone.
4. Agent Mode: Pick and Choose the tools for the agent. Tools: [Pinecone Store, Calculator, Browser]