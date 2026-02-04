const {createUserController, getUserByIdController, changePasswordController, getProfileController} = require('../controller/userController');
const { Router } = require('express');
const userRouter = Router();
const passport = require('passport');

userRouter.post('/register', createUserController);
userRouter.get('/profile', passport.authenticate('jwt', {session: false}), getProfileController);
userRouter.get('/:id', passport.authenticate('jwt', {session: false}), getUserByIdController);
userRouter.put('/change-password', passport.authenticate('jwt', {session: false}), changePasswordController);

module.exports = userRouter;