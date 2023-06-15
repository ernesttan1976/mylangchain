import multer from "multer";
import AWS from "aws-sdk";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import stream from "stream";
import getConfig from 'next/config';
import connect from "../../config/database";
import Document from "../../models/Documents";
import File from "../../models/Files";
import { EventEmitter } from 'node:events';
global.emitter = new EventEmitter();
global.emitter.setMaxListeners(16);

const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_SECRET_ACCESS_KEY,
  AWS_BUCKET_REGION,
  S3_BUCKET_NAME,
} = publicRuntimeConfig;

const AWS_CONFIG = {
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_BUCKET_SECRET_ACCESS_KEY,
  region: AWS_BUCKET_REGION,
  apiVersion: '2010-12-01',
}

const s3 = new AWS.S3(AWS_CONFIG);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  // allow only one file to be uploaded
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 4.5, // 4.5 MB Next.js file upload limit is 4.5 mb
    files: 1 // allow only one file to be uploaded
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {

  let finalFile = "";


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

      const index = Number.parseInt(req.body.index);
      const count = Number.parseInt(req.body.count);
      console.info(`Received ${index+1} of ${count}`);

      if (index===0) {
        await File.deleteMany({});
      }

      await File.create({
        file: req.file.buffer,
        index: index,
        count: count,
      })

      if (index < count-1) {
        res.status(200).json({message: `Chunk ${index+1} uploaded`});
        // await disconnect();
        return;
      }
 
            
      try {

      //join the chunks
      const fileChunks = await File.find({});
      const buffers = fileChunks.map((chunk) => Buffer.from(chunk.file));
      const finalFile = Buffer.concat(buffers);
      console.info(finalFile);
      console.info(typeof finalFile)

      await File.deleteMany({});

        const file = finalFile;
        const namespace = req.body.namespace;
        console.info("namespace", namespace)

        // create a buffer stream that is readable multiple times, by PDFLoader and S3
        const bufferStream = () => {
          const readable = new stream.Readable();
          readable._read = () => { };
//          readable.push(file.buffer);
          readable.push(file);
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

        

        console.info("before PDF loader")
        const loader = new PDFLoader(bufferStream());
        console.info("Before loader.load")
        const docs = await loader.load();

        console.info(docs.length);
        console.info(docs[0], docs[docs.length - 1]);

        // retrieve the buffer data from bufferStream() before passing it to S3 upload function
        const bufferData = Buffer.from(await bufferStream().arrayBuffer());

        const fileParams = JSON.parse(req.body.fileParams);
        console.info(fileParams)
        const s3Params = {
          Bucket: S3_BUCKET_NAME,
          Key: fileParams.originalname,
          Body: bufferData,
          ContentType: fileParams.mimetype // set the content type of the file
        };
        console.info(s3Params)

        // create a readable stream from the buffer data
        const readable = new stream.Readable();
        readable._read = () => { };
        readable.push(bufferData);
        readable.push(null);

        // upload the file in chunks to S3
        const s3UploadParams = {
          Bucket: S3_BUCKET_NAME,
          Key: fileParams.originalname,
          Body: readable,
          ContentType: fileParams.mimetype,
        };
        const s3Upload = s3.upload(s3UploadParams);

        s3Upload.on("httpUploadProgress", (progress) => {
          console.info(`Uploaded ${progress.loaded} bytes`);
        });

        const data = await s3Upload.promise();
        const fileData = {
          name: fileParams.originalname,
          url: data.Location,
          size: fileParams.size,
          key: data.Key,
        }
        console.info("fileData=>", fileData);

        const newDocument = {
          fileData: fileData,
          vectors: docs,
          namespace: `${namespace || 'pdf'}`
        }
        const savedDocument = await Document.create(newDocument);

        console.info("Mongoose create: success")

        res.status(200).json({
          message: `Chunk ${index+1} uploaded. \nFile uploaded successfully and converted into ${docs.length} docs(pages): ${fileData.url}`,
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