import express from 'express';
import cors from 'cors';
// import morgan from 'morgan';
require('dotenv').config({ path: '../.env' });

import { checkConnection, fetchObject } from './aws';

const app = express();
app.use(cors())

app.get('/api', (req, res) => {
    const packageJson = require('../package.json');
    res.send(`Release Version ${packageJson.version}`);
});

app.get('/s3', async (req, res) => {
    try {
        await checkConnection();
        res.json({ isConnected: true });
    } catch (error) {
        res.json({ isConnected: false });
    }
});

app.get('/*', async (req, res) => {
    // const filePath = path.join(__dirname, 'clone_repo_dir', req.path);
    const host = req.hostname;
    const id = host.split('.')[0];
    const filePath = req.path;

    // console.log(host, id, filePath);

    const content = await fetchObject(id, filePath);    
    // console.log(content);

    const type = filePath.endsWith('.html') ? 'text/html' : filePath.endsWith('.css') ? 'text/css' : 'application/javascript';
    res.set('Content-Type', type);
    res.send(content.Body);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
