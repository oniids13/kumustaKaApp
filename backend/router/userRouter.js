const {createUserController} = require('../controller/userController');
const { Router } = require('express');
const userRouter = Router();

userRouter.post('/register', createUserController);


module.exports = userRouter;