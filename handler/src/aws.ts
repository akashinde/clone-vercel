import { S3 } from 'aws-sdk';

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

export async function fetchObject (id: string, filePath: string) {
    try {
        const content = await s3.getObject({
            Bucket: 'clone-vercel',
            Key: `build/${id}${filePath}`,
        }).promise();
        return content;
    } catch (error) {
        console.log(error);
        return { Body: 'File not found' };
    }
}
