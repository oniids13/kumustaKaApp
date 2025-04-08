const {Router} = require('express');
const { loginController } = require('../controller/loginController');
const loginRouter = Router();


loginRouter.post('/login', loginController);
loginRouter.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
});

module.exports = loginRouter;