require('dotenv').config({ path: '../.env' });
import { commandOptions, createClient } from 'redis';
import { downloadRepo, uploadBuildFiles } from './aws';
import { buildCloneRepo } from './utils';
import fs from 'fs';
import path from 'path';

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

const CLOUDFLARE_CLONE_DIR_ROOT = 'clone_repo_dir';

// main function
(async () => {
    console.log('Deploy service running');
    while (true) {
        // BRPOP returns last from right and blocks until complete
        const resp = await subscriber.brPop(
            commandOptions({ isolated: true }),
            'build-queue',
            0
        );
        // resp.element -> repoId
        if (resp?.element) {
            publisher.hSet('queue-status', resp.element, 'building');
            console.log(`building repo: ${resp.element}`);

            await downloadRepo(`${CLOUDFLARE_CLONE_DIR_ROOT}/${resp.element}`);
            console.log('repo download complete');
            await buildCloneRepo(`${CLOUDFLARE_CLONE_DIR_ROOT}/${resp.element}`);
            console.log(`build complete: ${resp.element}`);
            await uploadBuildFiles(resp.element);
            console.log('build files uploaded');

            // delete the cloned repo from the server
            console.log('deleting the cloned repo');
            // console.log(path.join(__dirname, `clone_repo_dir/${resp.element}`));
            fs.rmSync(path.join(__dirname, `clone_repo_dir/${resp.element}`), { recursive: true, force: true });

            publisher.hSet('queue-status', resp.element, 'complete');
            console.log('Watching for next build...');
        }
    }
})()