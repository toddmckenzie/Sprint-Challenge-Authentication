const axios = require('axios');
const db = require('../database/dbConfig.js');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { authenticate } = require('../auth/authenticate');


module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 8);
  user.password = hash;

  db('users')
  .insert(user)
  .then(savedUser => {
    console.log(user.password)
    res.status(201).json(savedUser)
  })
  .catch(error => {
    console.error(error.response)
    res.status(500).json({ message: 'Internal server error.'})
  })

}

function login(req, res) {
  const { username, password } = req.body;
  
  db('users')
  .where({ username })
  .first()
  .then(user => {
    if (user && bcrypt.compareSync(password, user.password)){
      const token = generateToken(user)//token is generated/
      res.status(200).json({ message: `Welcome ${user.username}`, token})

    } else {
      res.status(401).json({ message: 'Invalid Credentials.'})
    }
  })
  .catch(error => {
    console.error(error)
    res.status(500).json({message: 'Internal server error.'})
  })
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}

function generateToken(user){
  const payload = {
      subject: user.id,
      username: user.username
  }
  const options = {
      expiresIn: '2h',
  }
  const jwtKey =
  process.env.JWT_SECRET ||
  'add a .env file to root of project with the JWT_SECRET variable';

  return jwt.sign(payload, jwtKey, options)
}
