const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {validPassword} = require('../utils/passwordUtil');






const createUser = async (userData) => {
    const { email, salt, hash, role, firstName, lastName, phone } = userData;
    try {
        const user = await prisma.user.create({
            data: {
                email,
                salt,
                hash,
                role,
                firstName,
                lastName,
                phone
            }, select: {
                id: true,
                email: true,
                salt: true,
                hash: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true
            }
        });
        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

const getUserLogin = async (email, password) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            },
            select: {
                id: true,
                email: true,
                salt: true,
                hash: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true
            }
        });
        if (!user) {
            return {message: "User not found"};
        }

        const isValid = validPassword(password, user.salt, user.hash);

        if (isValid) {
            return user;
        } else {
            return {message: "Invalid password"};
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
}

const getUserById = async (id) => {

    if (!id) {
        throw new Error("User ID is required");
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: id
            },
        });
        return user;
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
}

module.exports = {
    createUser,
    getUserLogin,
    getUserById
}