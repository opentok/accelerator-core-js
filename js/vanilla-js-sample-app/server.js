/* eslint-env es6 */

/*
 * Dependencies
 */
const express = require('express');
const bodyParser = require('body-parser');

/*
 * Config
 */
const app = express();
const port = process.env.PORT || 8080;
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());

/*
 * User Routes
 */

app.get('/', (req, res) => {
  res.sendfile('public/index.html');
});

/*
 * API Endpoints
 */
// app.post('/broadcast/start', (req, res) => {
//   const sessionId = R.path(['body', 'sessionId'], req);
//   broadcast.start(sessionId)
//     .then(data => res.send(data))
//     .catch(error => res.status(500).send(error));
// });

// app.post('/broadcast/end', (req, res) => {
//   broadcast.end()
//     .then(data => res.send(data))
//     .catch(error => res.status(500).send(error));
// });

/*
 * Listen
 */
app.listen(process.env.PORT || port);
console.log(`app listening on port ${port}`);
