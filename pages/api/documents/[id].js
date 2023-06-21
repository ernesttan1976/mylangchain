import connect from "../../../config/database";
import Document from "../../../models/Documents";


export default async function handler(req, res) {
  const { id } = req.query;
  connect();
  if (req.method==='GET'){

    const document = await Document.findById(id)
    //.select("fileData savedInPinecone vectors.metadata")
  
    res.status(200).json({document});
  } else if (req.method==='UPDATE'){

  } else if (req.method==='DELETE'){
    await Document.findByIdAndDelete(id);
    res.status(200).json({message: "Document deleted"})
  }
}