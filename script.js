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

const FOLDER_NAME = repoName.split('.')[0]

const GAME_NAME = FOLDER_NAME.trim()+"2"; //TODO: accept it from the customer

const SOLGAMES_DIRECTORY = FOLDER_NAME+'-'+GAME_NAME

const APP_PORT = 3001 //TODO: get the input from customer
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

    await exec('docker login --username dockerghosh --password Docker@123');
    await exec(`docker push dockerghosh/${FOLDER_NAME}:latest`)

    // console.log('stdout:', stdout);
    // console.log('stderr:', stderr);
    const git = simpleGit('./', { binary: 'git' });

    const deploymentTemplate = `
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: ${GAME_NAME}
  name: ${GAME_NAME}
  namespace: ${SOLGAMES_DIRECTORY}
spec:
  selector:
    matchLabels:
      app: ${GAME_NAME}
  replicas: 1
  template:
    metadata:
      labels:
        app: ${GAME_NAME}
    spec:
      containers:
      - name: ${GAME_NAME}
        image: dockerghosh/${FOLDER_NAME}:latest
        ports:
        - containerPort: ${APP_PORT}
          name: http-web
    `

//     apiVersion: apps/v1
// kind: Deployment
// metadata:
//   name: game1
//   namespace: game1
//   labels:
//     app: game1
//     environment: demo
// spec:
//   replicas: 2
//   selector:
//     matchLabels:
//       app: game1
//   template:
//     metadata:
//       labels:
//         app: game1
//         environment: demo
//     spec:
//       containers:
//       - name: game1
//         image: dockerghosh/githubsearchfrontend:latest
//         imagePullPolicy: Always
//         ports:
//         - containerPort: 3000
//           name: http-web

    const dir = `./games-repo/${SOLGAMES_DIRECTORY}`;
    // if (!fs.existsSync(dir)) {
        await fs.mkdir(dir);
    // }
    await fs.writeFile(`./games-repo/${SOLGAMES_DIRECTORY}/deployment.yaml`, deploymentTemplate)

    const serviceTemplate = `
apiVersion: v1
kind: Service
metadata:
  labels:
    app: ${GAME_NAME}
  name: ${GAME_NAME}
  namespace: ${SOLGAMES_DIRECTORY}
spec:
  selector:
    app: ${GAME_NAME}
  ports:
    - port: 80
      protocol: TCP
      targetPort: http-web
      name: ${GAME_NAME}
    `

    await fs.writeFile(`./games-repo/${SOLGAMES_DIRECTORY}/service.yaml`, serviceTemplate)
    // await exec('helm upgrade --namespace game-dev2 --create-namespace --wait --install game-dev2 game2/')
    // await exec('kubectl port-forward svc/game2-svc 8082:80 -n game-dev2')
    await exec(`kubectl get namespace | grep -q "^$${SOLGAMES_DIRECTORY}" || kubectl create namespace ${SOLGAMES_DIRECTORY}`)
    // helm upgrade --namespace game-dev2 --create-namespace --wait --install game-dev game2/
    // kubectl port-forward svc/game1-svc 8081:80 -n game-dev
    // kubectl port-forward svc/game1-svc 8082:80 -n game-dev

    await git.add('./*')
    await git.commit(`added game with folder name => ${SOLGAMES_DIRECTORY}`)
    await git.push('origin', 'main');
  }
runDocker();