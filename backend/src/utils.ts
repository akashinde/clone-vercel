import fs from 'fs';
import path from 'path'

// return all files for selected directory
export function getAllFiles (folderPath: string): string[] {
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullPath = path.join(folderPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            response = response.concat(getAllFiles(fullPath));
        } else {
            response.push(path.relative(__dirname, fullPath));
        }
    });    

    return response;
}

// convert path to posix
export function convertPath2Posix (windowsPath: string): string {
    return windowsPath.replace(/^\\\\\?\\/,"").replace(/\\/g,'\/').replace(/\/\/+/g,'\/');
} 