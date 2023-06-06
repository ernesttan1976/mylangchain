import multer from "multer";
import AWS from "aws-sdk";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import stream from "stream";
import getConfig from 'next/config';
import connect from "../../config/database";
import Document from "../../models/Documents";

const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_SECRET_ACCESS_KEY,
  AWS_BUCKET_REGION,
  S3_BUCKET_NAME,
} = publicRuntimeConfig;

const storage = multer.memoryStorage();

const AWS_CONFIG = {
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_BUCKET_SECRET_ACCESS_KEY,
  region: AWS_BUCKET_REGION,
  apiVersion: '2010-12-01',
}

console.log(AWS_CONFIG)

const s3 = new AWS.S3(AWS_CONFIG);

const upload = multer({
  storage,
  // allow only one file to be uploaded
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 100, // 100 MB
    files: 1 // allow only one file to be uploaded
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {

  await connect();

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
  } else {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to upload file" });
        return;
      }


      try {


        const { file } = req;

        //create a bufferstream that is readable multiple times, by PDFLoader and S3
        const bufferStream = () => {
          const readable = new stream.Readable();
          readable._read = () => { };
          readable.push(file.buffer);
          readable.push(null);
          return {
            arrayBuffer: async () => {
              const chunks = [];
              for await (const chunk of readable) {
                chunks.push(chunk);
              }
              return new Uint8Array(Buffer.concat(chunks)).buffer;
            }
          };
        };



        console.log("before PDF loader")
        const loader = new PDFLoader(bufferStream());
        console.log("Before loader.load")
        const docs = await loader.load();

        console.log(docs.length);
        console.log(docs[0], docs[docs.length - 1]);

        // retrieve the buffer data from bufferStream() before passing it to S3 upload function
        const bufferData = Buffer.from(await bufferStream().arrayBuffer());

        const s3Params = {
          Bucket: S3_BUCKET_NAME,
          Key: file.originalname,
          Body: bufferData,
          ContentType: file.mimetype // set the content type of the file
        };
        const data = await s3.upload(s3Params).promise();
        const fileData = {
          name: file.originalname,
          url: data.Location,
          size: file.size,
          key: data.Key,
        }
        console.log("fileData=>", fileData);
        //        const url = s3.getSignedUrl('getObject', { Bucket: S3_BUCKET_NAME, Key: file.originalname }); // generate a signed URL for the uploaded file


        const newDocument = {
          fileData: fileData,
          docs: docs,
        }
        const savedDocument = await Document.create(newDocument);
        
        console.log("Mongoose create: success")

        res.status(200).json({
          message: `File uploaded successfully and converted into ${docs.length} docs(pages): ${fileData.url}`,
          docs: docs,
          path: fileData.url,
          fileData: fileData,
          id: savedDocument._id,
        });

      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "There was an error: " + err });
      }
    })
  }
}