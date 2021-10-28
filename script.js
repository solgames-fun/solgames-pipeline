const fs = require('fs').promises;
require('dotenv').config()
const {
    parse,
    stringify
} = require('envfile');
const simpleGit = require('simple-git');
const path = require('path');

const pathToenvFile = '.env';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const REPO_URL = 'https://github.com/blocksan/portfolio.git'

const repoNames = REPO_URL.split('/')

const repoName = repoNames[repoNames.length-1]

const FOLDER_NAME = repoName.split('.')[0]

const APP_PORT = 3001
const setEnv = async(key, value) => {
    let data = await fs.readFile(pathToenvFile, 'utf8')
    
       let result = parse(data);
        result[key] = value;
    return await fs.writeFile(pathToenvFile, stringify(result))
    
}

const setEnvVar = async () => {
        await setEnv('FOLDER_NAME',FOLDER_NAME)
        await setEnv('REPO_URL',REPO_URL)
        await setEnv('APP_PORT',APP_PORT)
}
setEnvVar()

async function runDocker() {
    const { stdout, stderr } = await exec('docker-compose build');
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
    const git = simpleGit('./', { binary: 'git' });

    await git.add('./*')
    await git.commit(`added game ${FOLDER_NAME} updated`)
    await git.push('origin', 'main');
  }
runDocker();