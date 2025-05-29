const { body, validationResult } = require('express-validator');
const { genPassword } = require('../utils/passwordUtil');
const { createUser, getUserById } = require('../model/userQueries');

const validateUser = [
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('First name must only contain letters and spaces'),
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('Last name must only contain letters and spaces'),
    body('phone')
        .matches(/^09\d{9}$/)
        .withMessage('Phone number must be exactly 11 digits starting with 09')
]


const createUserController = [validateUser, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: "Validation failed", 
            errors: errors.array(),
            data: req.body 
        });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;
    const { salt, hash } = genPassword(password);

    try {
        const user = await createUser({ email, salt, hash, firstName, lastName, phone, role });
        return res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        
        // Handle specific database errors
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Email already exists" });
        }
        
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