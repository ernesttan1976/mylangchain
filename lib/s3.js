import https from "https";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import { HttpRequest } from "@aws-sdk/protocol-http";
import {
    getSignedUrl,
    S3RequestPresigner,
} from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";
import { Hash } from "@aws-sdk/hash-node";

import getConfig from 'next/config';
// import connect from "../config/database"
// import S3setting from "../models/S3settings";

let counter = 0;

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


const createPresignedUrlWithoutClientUpload = async ({ region, bucket, key }) => {


    const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
    const presigner = new S3RequestPresigner({
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_BUCKET_SECRET_ACCESS_KEY,
        },
        region,
        sha256: Hash.bind(null, "sha256"),
    });

    const signedUrlObject = await presigner.presign(
        new HttpRequest({ ...url, method: "PUT" })
    );

    return formatUrl(signedUrlObject);
};

const createPresignedUrlWithClientUpload = ({ region, bucket, key }) => {
    const client = new S3Client({ region });
    const command = new PutObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn: 3600 });
};


const createPresignedUrlWithoutClientDownload = async ({ region, bucket, key }) => {
    const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
    const presigner = new S3RequestPresigner({
        credentials: fromIni(),
        region,
        sha256: Hash.bind(null, "sha256"),
    });

    const signedUrlObject = await presigner.presign(new HttpRequest(url));
    return formatUrl(signedUrlObject);
};

const createPresignedUrlWithClientDownload = ({ region, bucket, key }) => {
    const client = new S3Client({ region });
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn: 3600 }); //3600 = 1 hr
};

function put(url, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(
            url,
            { method: "PUT", 
              headers: {
                "Content-Length": new Blob([data]).size,
              }
         },
            (res) => {
                let responseBody = "";
                res.on("data", (chunk) => {
                    responseBody += chunk;
                });
                res.on("end", () => {
                    resolve(responseBody);
                });
            }
        );
        req.on("error", (err) => {
            reject(err);
        });
        req.write(data);
        req.end();
    });
}

export const UploadWithPresignedUrls = async (filename, file) => {

    if (counter > 0){
        return ""
    } else {
        counter++;
    }

    const REGION = AWS_BUCKET_REGION;
    const BUCKET = S3_BUCKET_NAME;
    const KEY = filename;

    // There are two ways to generate a presigned URL.
    // 1. Use createPresignedUrl without the S3 client.
    // 2. Use getSignedUrl in conjunction with the S3 client and GetObjectCommand.
    try {
        const noClientUrlUpload = await createPresignedUrlWithoutClientUpload({
            region: REGION,
            bucket: BUCKET,
            key: KEY,
        });
        console.log("noClientUrlUpload: ok")

        // const clientUrlUpload = await createPresignedUrlWithClientUpload({
        //     region: REGION,
        //     bucket: BUCKET,
        //     key: KEY,
        // });

        const noClientUrlDownload = await createPresignedUrlWithoutClientDownload({
            region: REGION,
            bucket: BUCKET,
            key: KEY,
        });
        console.log("noClientUrlDownload: ok")
        // const clientUrlDownload = await createPresignedUrlWithClientDownload({
        //     region: REGION,
        //     bucket: BUCKET,
        //     key: KEY,
        // });

        // After you get the presigned URL, you can provide your own file
        // data. Refer to put() above.
        console.log("Calling PUT using presigned URL without client (upload)");
        await put(noClientUrlUpload, file);

        //console.log("Calling PUT using presigned URL with client (upload)");
        //await put(clientUrlUpload, file);

        console.log("Presigned URL without client (download)");
        console.log(noClientUrlDownload);
        console.log("\n");

        // console.log("Presigned URL with client (download)");
        // console.log(clientUrlDownload);

        return { noClientUrlUpload, clientUrlUpload:"", noClientUrlDownload, clientUrlDownload:"" }
    } catch (err) {
        console.error(err);
    }
};


