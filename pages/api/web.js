import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import connect from '../../config/database'
import Document from "../../models/Documents"
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import getConfig from 'next/config';
const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
    PINECONE_ENVIRONMENT,
    PINECONE_KEY,
    OPENAI_API_KEY,
} = publicRuntimeConfig;

function removeJSCode(html) {
    // remove style tags and their contents
    const regex = /<(?:Image|Link|Script).*?>|default\.js|error\.js|layout\.js|loading\.js|not-found\.(?:js|jsp)|page\.js|route\.js|template\.js|favicon|icon|apple-icon|opengraph-image|twitter-image|robots\.txt|sitemap\.xml>/g;
    const newhtml = html.replace(regex, '');

    return newhtml;
}

export default async function handler(req, res) {

    await connect();

    const weburl = req.body.weburl;

    if (weburl === "") {
        res.status(404).json({ error: "empty url" })
        return;
    }
    //READ FROM WEBPAGE AND GET TEXT
    const loader = new CheerioWebBaseLoader(weburl, {
        scriptingEnabled: false,
        timeout: 20000,
        selector: "h1,h2,h3,h4,h5,h6,p,section,td,th:not(script):not(img):not(Script):not(image):not(link):not(head):not(menu)"
      });
    let docs = await loader.load();
    //console.log("Before=>", docs[0].pageContent);
    docs[0].pageContent = removeJSCode(docs[0].pageContent);
    //console.log("After=>", docs[0].pageContent);

    const fileData = {
        name: weburl,
        url: weburl,
        size: 0,
        key: weburl,
    }
    console.info("webData=>", fileData);
    const newDocument = {
        fileData: fileData,
        vectors: docs,
        namespace: 'pdf',
    }
    const savedDocument = await Document.create(newDocument);
    console.info("Mongoose create: success")
    console.log(savedDocument)

    //GET OPENAI EMBEDDINGS
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: OPENAI_API_KEY,
        timeout: 30000, // set timeout to 30 seconds
    });
    const newEmbedding = await embeddings.embedQuery(savedDocument.vectors[0].pageContent);
    console.log(newEmbedding)
    savedDocument.vectors[0].values = newEmbedding;
    savedDocument.save();

    //SAVE IN PINECONE DATABASE
    const pinecone = new PineconeClient();
    await pinecone.init({
        environment: PINECONE_ENVIRONMENT,
        apiKey: PINECONE_KEY,
    });
    const indexesList = await pinecone.listIndexes();
    let pineconeIndex;
    pineconeIndex = pinecone.Index("index01");
    console.log("Pinecone Index", pineconeIndex);
    const vectorStore = await PineconeStore.fromDocuments(savedDocument.vectors, embeddings,
        { pineconeIndex, textKey: "pageContent", namespace: savedDocument.namespace }
    );

    res.status(200).json({
        message: `Successfully loaded ${fileData.url} -> ${docs.length} docs(pages), saved into Pinecone`,
        docs: docs,
        embedding: newEmbedding,
        path: fileData.url,
        fileData: fileData,
        id: savedDocument._id,
    });

}