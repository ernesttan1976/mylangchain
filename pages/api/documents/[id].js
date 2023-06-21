import connect from "../../../config/database";
import Document from "../../../models/Documents";

export default async function handler(req, res) {
    connect();
    const id = req.body.id
    const document = await Document.findOne(id).select("fileData savedInPinecone vectors.metadata")
  
    res.status(200).json({document});
  }