const { body, validationResult } = require('express-validator');
const { genPassword } = require('../utils/passwordUtil');
const { createUser, getUserById } = require('../model/userQueries');

const validateUser = [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('phone').notEmpty().withMessage('Phone number is required')
]


const createUserController = [validateUser, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), data: req.body });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;
    const { salt, hash } = genPassword(password);

    try {
        const user = await createUser({ email, salt, hash, firstName, lastName, phone, role });
        return res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}];

const getUserByIdController = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


module.exports = { createUserController, getUserByIdController}