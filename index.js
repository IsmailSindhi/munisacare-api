const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const helmet = require("helmet");
const morgan = require("morgan");
dotenv.config();


// importing models

const User = require('./models/User');



const port = process.env.PORT || 4000;
const url = process.env.MONGODB_URL;

const secret = 'secret110';


// DB Connetion

mongoose
  .connect(url, {
    useNewUrlParser: true,
  })
  .then(console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));



// strating express server
const app = express();

// MiddleWares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan("common"))
app.use(express.static('./public'));
app.use(bodyParser.json({extended:true}));


// api
app.get('/', (req, res) => {
  res.send('Care taker api');
});

app.get('/user', (req, res) => {
  const payload = jwt.verify(req.cookies.token, secret);
  User.findById(payload.id)
    .then(userInfo => {
      res.json({id:userInfo._id,email:userInfo.email});
    });

});

app.post('/register', async (req, res) => {
  const {email,password,name,phoneNumber} = req.body;
  console.log(req.body)
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = new User({email,name,phoneNumber,password:hashedPassword});
  await user.save().then(userInfo => {
    jwt.sign({id:userInfo._id,email:userInfo.email}, secret, (err,token) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.cookie('token', token).json({id:userInfo._id,email:userInfo.email});
      }
    });
  });
});

app.post('/login', (req, res) => {
  const {email,password} = req.body;
  User.findOne({email})
    .then(userInfo => {
      const passOk = bcrypt.compareSync(password, userInfo.password);
      if (passOk) {
        jwt.sign({id:userInfo._id,email},secret, (err,token) => {
          if (err) {
            console.log(err);
            res.sendStatus(500);
          } else {
            res.cookie('token', token).json({id:userInfo._id,email:userInfo.email});
          }
        });
      } else {
        res.sendStatus(401);
      }
    })
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').send();
});

app.listen(port, ()=>{console.log(`server is running at port ${port}`)});