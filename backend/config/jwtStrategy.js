const jwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const {getUserById} = require('../model/userQueries');
require('dotenv').config();

const opts ={};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRETKEY;


module.exports = new jwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await getUserById(jwt_payload.id);
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    } catch (error) {
        console.error("Error in JWT strategy:", error);
        return done(error, false);
    }
});