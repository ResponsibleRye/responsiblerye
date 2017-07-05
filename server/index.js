require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var Models = require('./models');
var passport = require('./authentication/passport');
var morgan = require('morgan');
var session = require('express-session');
const randomBytes = Promise.promisify(require('crypto').randomBytes);
const createHash = require('crypto').createHash;

var port = process.env.PORT || 3000;
var app = express();

process.env.PWD = process.cwd();
app.use(express.static(process.env.PWD + '/react-client/'));
app.use(bodyParser.json());

app.use(morgan('combined'));
app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
//---PASSPORT----

app.use(passport.initialize());
app.use(passport.session());

const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.send('nope');
  }
};

app.get('/api', (req, res ) => {
  res.send({GOOGLE_API_KEY: process.env.GOOGLE_API_KEY});
});

app.get('/user/signedIn', isAuth, (req, res) => {
  res.send(req.user);
});

app.get('/user', (req, res) => {
  Models.users.get()
    .then((result)=>{
      res.end(JSON.stringify(result));
    })
    .catch((err)=>{
      console.log('Loggin the error', err);
      res.end();
    });
});

app.post('/map', (req, res) => {
  console.log('got to the post for map');
  var state = JSON.parse(req.body.state);
  state.currentCenter = `${state.currentCenter.lat}/${state.currentCenter.lng}`;
  console.log(state);
  var mapId = null;
  Models.maps.create(state)
    .then((result) => {
      mapId = result[0]['currval'];
      console.log('markers are:', state.markers);
      return Promise.map(state.markers, (marker)=>{
        var mark = {
          'lat': marker.position.lat,
          'lng': marker.position.lng,
          'mapId': parseInt(mapId),
          'info': marker.info,
          'iconPath': marker.icon.path,
          'fillColor': marker.icon.fillColor,
          'strokeColor': marker.icon.strokeColor
        };
        console.log('the mark is:', mark);
        return Models.markers.create(mark);
      })
        .then((result) => {
          console.log('results from marker create', result);
          console.log('mapId: ', mapId);
          res.end(mapId);
        });
    })
    .catch((err) => {
      console.log('There was an error:', err);
      res.end();
    });
});

app.get('/map/:mapId', (req, res) => {
  console.log('got to the post for map');
  console.log('Map Id should be:', req.params.mapId);
  Models.maps.get(req.params.mapId)
    .then((result) => {
      console.log('The state is,', result);
      res.send(result); //TODO figure out how to send back the hash with all the data.
    })
    .catch((err)=>{
      console.log('There was an error:', err);
      res.end();
    });
});

app.put('/map/:mapId', (req, res) => {
  console.log(req.body);
  Models.maps.update(req.params.mapId)
    .then((result)=>{
      res.end();
    })
    .catch((err)=>{
      res.end();
    });
});


//---Github Authentication--
app.get('/auth/google', function(req, res, next) {
  console.log(req.headers);
  next();
});

app.get('/auth/google', passport.authenticate('google', { scope: [ 'profile', 'email' ] }) );

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    console.log(req.headers);
    res.redirect('/');
  });

//--Passport--

app.post('/login', passport.authenticate('local'),
  ((req, res) => {
    res.send(req.body.username);
  })
);

const registerUser = (req, res, next) => {
  console.log(req.body);
  let username = req.body.username;
  let password = req.body.password;
  let salt;
  randomBytes(256)
    .then(buf => {
      salt = buf.toString('hex');
      console.log(salt);
      return Promise.resolve(createHash('sha256').update(password + salt));
    })
    .then(hashObj => {
      return Models.users.saveUser(username, hashObj.digest('hex'), salt);
    })
    .then(success => {
      console.log('in in in');
      next();
    })
    .catch(err => console.log('err in registering:', err));
};

app.post('/signup', registerUser, (req, res) => {
  res.send('saved');
});


app.listen(port, function() {
  console.log(`listening on port ${port}!`);
});
