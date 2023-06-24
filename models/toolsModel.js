import mongoose from "mongoose";
const { Schema } = mongoose;


const toolSchema = new Schema({
    label: String,
    value: String,
    url: String,
    description: String,
    tagname: String,
    tagbgColor: String,
    tagcolor: String,
});

let Tool;
if (mongoose.models.Tool) {
    Tool = mongoose.models.Tool;
} else {
    Tool = mongoose.model('Tool', toolSchema);
}


// Seed data
const toolsSeedData = [
    {
        label: 'Pinecone Store',
        value: 'Pinecone_Store',
        url: '',
        description: 'All pdf and web documents that you uploaded are saved as vectors in Pinecone Store',
        tagname: 'Vector Store',
        tagbgColor: 'blue',
        tagcolor: 'white',
    },
    {
        label: 'Calculator',
        value: 'Calculator',
        url: '',
        description: 'For simple mathematical calculations',
        tagname: 'Calculators',
        tagbgColor: 'purple',
        tagcolor: 'white',
    },
    {
        label: 'Google Search',
        value: 'Google_Search',
        url: '',
        description: 'Google Custom Search Engine (max 100 free requests per day)',
        tagname: 'Browsing',
        tagbgColor: 'gold',
        tagcolor: 'darkred',
    },
    {
        label: 'Web Pilot',
        value: 'Web Pilot',
        url: 'https://webreader.webpilotai.com/.well-known/ai-plugin.json',
        description: 'Browse & QA Webpage/PDF/Data. Generate articles, from one or more URLs.',
        tagname: 'Browsing',
        tagbgColor: 'gold',
        tagcolor: 'darkred',
    },
    {
        label: 'KeyMate.AI',
        value: 'KeyMate.AI',
        url: 'https://searchweb.keymate.ai/.well-known/ai-plugin.json',
        description: 'Search the web by using a Custom Search Engine with KeyMate.AI Search, your AI-powered web search engine.',
        tagname: 'Browsing',
        tagbgColor: 'gold',
        tagcolor: 'darkred',
    },
    {
        label: 'Link Reader',
        value: 'Link_Reader',
        url: 'https://gochitchat.ai/.well-known/ai-plugin.json',
        description: 'Reads the content of all kinds of links, like webpage, PDF, PPT, image, Word & other docs.',
        tagname: 'Browsing',
        tagbgColor: 'gold',
        tagcolor: 'darkred',
    },
    {
        label: 'ChatWithWebsite',
        value: 'ChatWithWebsite',
        url: 'https://chatwithwebsite.sdan.io/.well-known/ai-plugin.json',
        description: 'A plugin that allows users to load and query websites using ChatGPT. ',
        tagname: 'Browsing',
        tagbgColor: 'gold',
        tagcolor: 'darkred',
    },
];



export {
    Tool,
    toolsSeedData,
};