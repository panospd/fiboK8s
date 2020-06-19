const keys = require('./keys');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const {
  Pool
} = require('pg');

const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on('error', () => console.log('Lost pg connection'));

pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .then(() => console.log('Table created!!!!!'))
  .catch((err) => console.log('ERROR CREATING TABLE: ', err));

const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

const redisPublisher = redisClient.duplicate();

app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');
  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  console.log('I am here!!!');
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  const success = redisClient.hset('values', index, 'Nothing yet!');

  console.log('REDIS SAVE', success);

  console.log(keys.pgUser);
  console.log(keys.pgHost);
  console.log(keys.pgDatabase);
  console.log(keys.pgPassword);
  console.log(keys.pgPort);

  redisPublisher.publish('insert', index);

  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({
    working: true,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  console.log(`App listening on port ${PORT}!`);
});