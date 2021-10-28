const fs = require('fs').promises;
require('dotenv').config()
const {
    parse,
    stringify
} = require('envfile');
const simpleGit = require('simple-git');

const pathToenvFile = '.env';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const REPO_URL = 'https://github.com/blocksan/portfolio.git'

const repoNames = REPO_URL.split('/')

const repoName = repoNames[repoNames.length-1]

const FOLDER_NAME = repoName.split('.')[0]+'1'

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
    // const { stdout, stderr } = await exec('docker-compose build');

    // await exec('docker login --username dockerghosh --password Sandy@123 ');
    // await exec(`docker push dockerghosh/${FOLDER_NAME}:latest`)

    // console.log('stdout:', stdout);
    // console.log('stderr:', stderr);
    const git = simpleGit('./', { binary: 'git' });

    const fileContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  selector:
    matchLabels:
      app: myapp
  replicas: 1
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: dockerghosh/${FOLDER_NAME.trim()}
        ports:
        - containerPort: 3001
    `
    await fs.writeFile('./dev/deployment.yaml', fileContent)

    await git.add('./*')
    await git.commit(`added game ${FOLDER_NAME} updated`)
    await git.push('origin', 'main');
  }
runDocker();