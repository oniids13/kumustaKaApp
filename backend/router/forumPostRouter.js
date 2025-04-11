const { createForumPostController} = require('../controller/forumController');
const { Router } = require('express');
const forumPostRouter = Router();
const passport = require('passport');


forumPostRouter.post('/newPost' , passport.authenticate('jwt', {session: false}), createForumPostController)



module.exports = forumPostRouter;