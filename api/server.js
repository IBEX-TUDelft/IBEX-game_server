import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import randomId from 'random-id';
import Utils from './helpers/utils.js';
import moment from 'moment';
import GameController from './controllers/gameController.js';
import users from './repositories/userRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3080;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../my-app/dist')));

GameController.apply(app);



app.get('/api/users', (req, res) => {
  res.json();
});

app.get('/api/v1/auth/check', async (req, res) => {
  try {
    const verification = Utils.verifyJWT(req.query.token);

    return res.status(200).json({
      data: verification,
      status: true,
      message: 'Data found'
    });
  } catch(e) {
    return res.status(401).json({
      data: {},
      status: true,
      message: err
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {

  console.log(req.body);

  let user;
  
  try {
    user = await users.login(req.body);
  } catch(e) {
    return res.status(401).json({
      data: {},
      status: true,
      message: 'Login failed'
    });    
  }

  if (user == null) {
    return res.status(401).json({
      data: {},
      status: true,
      message: 'Login failed'
    });
  }

  const record = {
    "id": 1,
    "username": "admin",
    "role": 0
  };

  const token = Utils.generateJWT(record);

  console.log(token);

  const refreshExpiry = moment().utc().add(3, 'days').endOf('day')
    .format('X');

  const refreshtoken = Utils.generateJWT({ exp: parseInt(refreshExpiry), data: record.id })

  res.status(200).json({
    data: { user: record, token, refresh: refreshtoken },
    status: true,
    message: 'login successful'
  });
});

app.post('/api/user', (req, res) => {
  const user = req.body.user;
  user.id = randomId(10);
  console.log('Adding user:::::', user);
  users.push(user);
  res.json("user addedd");
});

app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname, '../my-app/build/index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});