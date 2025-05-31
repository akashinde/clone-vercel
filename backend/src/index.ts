import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';

require('dotenv').config({ path: '../.env' });

import { checkConnection, deleteAllObjects, getAllBuiltIds, uploadFile } from './aws';
import { getAllFiles } from './utils';

import { createClient } from "redis";
const publisher = createClient();
publisher.connect();

const app = express();
app.use(cors());
app.use(morgan('tiny'));
// explicitely telling express  to use json for request body
app.use(express.json());


app.get('/api', (req, res) => {
    const packageJson = require('../package.json');
    res.json(`Release Version ${packageJson.version}`);
});

app.get('/redis', async (req, res) => {
    try {
        await publisher.ping();
        res.json({ isConnected: true });
    } catch (error) {
        res.json({ isConnected: false });
    }
});

app.get('/s3', async (req, res) => {
    try {
        await checkConnection();
        res.json({ isConnected: true });
    } catch (error) {
        res.json({ isConnected: false });
    }
});

app.get('/s3/all', async (req, res) => {
    try {
        const resp = await getAllBuiltIds();
        res.json(resp);
    } catch (error) {
        res.json({ message: 'error getting ids', error: error });
    }
})

app.delete('/s3/all', async (req, res) => {
    try {
        await deleteAllObjects();
        res.json({ message: 'all objects deleted' });
    } catch (error) {
        res.json({ message: 'error deleting objects' });
    }
});

app.post('/clone-and-deploy', async (req, res) => {
    const {repoUrl, randomId} = req.body;
    // clone the repo
    console.log('cloning the repo');
    publisher.hSet('queue-status', randomId, 'cloning');
    await simpleGit().clone(repoUrl, path.join(__dirname, `clone_repo_dir/${randomId}`));
    // publisher.hSet('queue-status', randomId, 'cloned');
    console.log('cloned the repo');
    
    // get all files in the cloned repo
    const _files = getAllFiles(path.join(__dirname, `clone_repo_dir/${randomId}`));
    console.log('files to upload: ', _files.length);

    publisher.hSet('queue-status', randomId, 'uploading');
    for (const file of _files) {
        await uploadFile(file, path.join(__dirname, file));
    }

    // add to build queue
    publisher.lPush('build-queue', randomId);
    console.log(`added ${randomId} to build queue`);

    // delete the cloned repo from the server
    console.log('deleting the cloned repo');
    fs.rmSync(path.join(__dirname, `clone_repo_dir/${randomId}`), { recursive: true, force: true });

    res.json({ status: 'clone and upload success', id: randomId, filesCloned: _files.length });
});

app.get('/queue-status/:id', async (req, res) => {
    const id = req.params.id;
    let status = await publisher.hGet('queue-status', id);
    if (status === null) status = 'id not found';
    res.json({ id, status });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server running on PORT: ', PORT);
})
