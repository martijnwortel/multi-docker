const express = require('express');
// const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('redis');
const { Pool } = require('pg');

const keys = require('./keys');

const app = express();
app.use(cors());
//bodyParser deprecated
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


//pg
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    port: keys.pgPort,
    database: keys.pgDatabase,
    password: keys.pgPassword
});


pgClient.on("connect", (client) => {
    client
        .query('CREATE TABLE IF NOT EXISTS values (number INT)')
        .catch((err) => console.error(err));
})
// pgClient.on('connect', (client) => console.log('lost PG connection'))
// pgClient
//     .query('CREATE TABLE IF NOT EXISTS values (number INT)')
//     .catch(err => console.log(err));


//Redis client setup

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
})

const redisPublisher = redisClient.duplicate();

//express routes

app.get('/', (req, res) => {
    res.send('HI');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows);
});

// async dont think so?
app.get('/values/current', async (req, res) => {
    // const values = pgClient.query('SELECT * FROM values');
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }
    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({ working: true });
});

app.listen(5000, err => {
    console.log('Listening')
})