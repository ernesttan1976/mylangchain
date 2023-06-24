
export const toolsModel = [
    {
        label: "Pinecone Store",
        value: "Pinecone_Store",
        url: "",
        description: "All pdf and web documents that you uploaded are saved as vectors in Pinecone Store",
        tag: "Vector Store",
    },
    {
        label: "Calculator",
        value: "Calculator",
        url: "",
        description: "For simple mathematical calculations",
        tag: "Calculators",
    },
    {
        label: "Google Search",
        value: "Google_Search",
        url: "",
        description: "Google Custom Search Engine (max 100 free requests per day)",
        tag: "Browsing",
    },
    {
        label: "Web Pilot",
        value: "Web Pilot",
        url: "https://webreader.webpilotai.com/.well-known/ai-plugin.json",
        description: "Browse & QA Webpage/PDF/Data. Generate articles, from one or more URLs.",
        tag: "Browsing",
    },
    {
        label: "KeyMate.AI",
        value: "KeyMate.AI",
        url: "https://searchweb.keymate.ai/.well-known/ai-plugin.json",
        description: "Search the web by using a Custom Search Engine with KeyMate.AI Search, your AI-powered web search engine.",
        tag: "Browsing",
    },
    {
        label: "Link Reader",
        value: "Link_Reader",
        url: "https://gochitchat.ai/.well-known/ai-plugin.json",
        description: "Reads the content of all kinds of links, like webpage, PDF, PPT, image, Word & other docs.",
        tag: "Browsing",
    },
    {
        label: "ChatWithWebsite",
        value: "ChatWithWebsite",
        url: "https://chatwithwebsite.sdan.io/.well-known/ai-plugin.json",
        description: "A plugin that allows users to load and query websites using ChatGPT. ",
        tag: "Browsing",
    },
]
    // {
    //     label: "Jini",
    //     value: "Jini",
    //     url: "https://api.pannous.com/",
    //     description: "Get factual, knowledge-base and real-time information. Search news, images, videos, music, apps, pages and facts.",
    //     tag: "Browsing",
    // },
    // {
    //     label: "TotalQuery Search",
    //     value: "TotalQuery Search",
    //     url: "https://plugin.totalquery.co/.well-known/pluginlab/openapi.json",
    //     description: "Go beyond google search: harness the combined power of 70+ search engines for ultimate web discovery.",
    //     tag: "Browsing",
    // },
    // {
    //     label: "Klarna",
    //     value: "Klarna",
    //     url: "https://www.klarna.com/.well-known/ai-plugin.json",//https://www.klarna.com/us/shopping
    //     description: "Search and compare prices from thousands of online shops. Only available in the US.",
    //     tag: "Shopping",
    // },

    export const tags = {
        Browsing: {
            bgColor: "gold",
            color: "darkred",
        },
        "Vector Store": {
            bgColor: "blue",
            color: "white",
        },
        Calculators: {
            bgColor: "purple",
            color: "white",    
        },
    }