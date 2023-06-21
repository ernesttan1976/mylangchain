import connect from "../../../config/database";
import Document from "../../../models/Documents";

export default async function handler(req, res) {

  if (req.method === 'GET') {
    connect();

    const documents = await Document.find({}, { vectors: { $slice: [1, 3] }, fileData: 1, savedInPinecone: 1, pageContentSummary: 1, embeddingSummary: 1 }).sort({ createdAt: 'desc' })

    res.status(200).json({ documents });
  } else if (req.method==='POST'){
    //upload single file
  }
}