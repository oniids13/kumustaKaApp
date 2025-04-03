const express = require('express');
const passport = require('passport');
const cors = require('cors');
const jwtStrategy = require('./config/jwtStrategy');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend URL
    credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
passport.use(jwtStrategy);

app.get('/', (req, res) => {
    res.send('Hello, world!');
}
);


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
}
);