const {createUserController, getUserByIdController} = require('../controller/userController');
const { Router } = require('express');
const userRouter = Router();
const passport = require('passport');

userRouter.post('/register', createUserController);
userRouter.get('/:id',  passport.authenticate('jwt', {session: false}), getUserByIdController);

module.exports = userRouter;