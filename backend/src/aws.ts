import { S3 } from 'aws-sdk';
import fs from 'fs';
import { convertPath2Posix } from './utils';

const s3 = new S3({
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    endpoint: process.env.CLOUDFLARE_ENDPOINT
})

export async function checkConnection() {
    try {
        const response = await s3.listBuckets().promise();
        // console.log(response);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function uploadFile (fileName: string, localFilePath: string) {
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: 'clone-vercel',
        Key: convertPath2Posix(fileName)
    }).promise()
    // console.log(response);
}

export async function getAllBuiltIds () {
    try {
        const content = await s3.listObjectsV2({
            Bucket: 'clone-vercel',
            Prefix: 'build/',
            Delimiter: '/',
        }).promise();
        const ids = content.CommonPrefixes?.map(element => {
            return element.Prefix?.split('build/')[1].replace('/', '')
        });
        return ids;
    } catch (error) {
        console.error(error);
    }
}

export async function fetchObject (id: string, filePath: string) {
    try {
        const content = await s3.getObject({
            Bucket: 'clone-vercel',
            Key: `build/${id}${filePath}`
        }).promise();
        return content;
    } catch (error) {
        return { Body: 'File not found' };
    }
}

export async function deleteAllObjects() {
    const response = await s3.listObjectsV2({
        Bucket: 'clone-vercel'
    }).promise();
    for (const file of response.Contents || []) {
        await s3.deleteObject({
            Bucket: 'clone-vercel',
            Key: file.Key || ''
        }).promise();
    }
}