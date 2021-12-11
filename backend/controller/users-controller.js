// const {uuid} = require("uuidv4")
const {validationResult} = require('express-validator');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const HttpError = require("../models/http-error");
const User = require("../models/user")


// let DUMMY_USERS = [
//     {
//         id: 'u1',
//         name: 'name',
//         email: 'test@gmial.com',
//         password: '123456'
//
//     }
// ];

const getAllUser = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, "-passport");
    } catch (err) {
        const error = new HttpError(
            "Fetching users failed, please try again later", 500
        );
        return next(error);
    }
    res.json({users: users.map(user => user.toObject({getters: true}))});
    // res.json({users: DUMMY_USERS});
};


const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

        return next(
            new HttpError("Invalid inputs passed, please check your data.", 422)
        );
    }
    const {name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({email: email})
    } catch (err) {
        const error = new HttpError(
            "Signing up failed, please try again later.", 500
        )
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError(
            "User exists already, please login instead.", 422
        )
        return next(error);
    }
    // const hasUser = DUMMY_USERS.find(u => u.email === email);
    // if (hasUser) {
    //     throw new HttpError('Could not create user, email already exists.', 422);
    // }

    let hashedPassword;
    try{
        hashedPassword = await bcrypt.hash(password, 12);
    }catch (err){
        const error = new HttpError("Could not create user, please try again.", 500);
        return next(error);
    }




    const createdUser = new User({
        name,
        email,
        image: req.file.path,

        password: hashedPassword,
        places: []
    })
    // const createdUser = {
    //     id: uuid(),
    //     name,
    //     email,
    //     password
    // };
    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError(
            "Signing Up failed, please try again.", 500
        );
        return next(error)
    }
    // DUMMY_USERS.push(createdUser); //unshifted(createdPlace)

    let token;
    try{
        token = jwt.sign({
                userId: createdUser.id,
                email: createdUser.email
            }, process.env.JWT_KEY,
            { expiresIn: '1h' }
        );
    } catch (err){
        const error = new HttpError(
            "Signing Up failed, please try again.", 500
        );
        return next(error)
    }


    res.status(201).json({userId: createdUser.id, email: createdUser.email, token: token}) ;
}

const login = async (req, res, next) => {
    const {email, password} = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({email: email})
    } catch (err) {
        const error = new HttpError(
            "Logging in failed, please try again later.", 500
        );
        return next(error);
    }




    // const identifiedUser = DUMMY_USERS.find(u =>  u.email === email);

    if (!existingUser) {
        const error = new HttpError(
            "Could not identify user, credentials seems to be wrong.", 403
        );
        return next(error);

    }

    let isValidPassword = false;
    try{
        isValidPassword = await bcrypt.compare(password, existingUser.password);

    }catch (err){
        const error = new HttpError("Could not identify user, credentials seems to be wrong. Please check out your email and password and try again.", 500);
        return next(error);
    }

    if(!isValidPassword){
        const error = new HttpError(
            "Invalid credentials, could not log you in.",
            403
        );
        return next(error);
    }
    let token;
    try{
        token = jwt.sign({
                userId: existingUser.id,
                email: existingUser.email,
            }, process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    }catch (err){
        const error = new HttpError(
            "Logging in failed, please try again.", 500
        );
        return next(error)
    }


    // if(!identifiedUser || identifiedUser.password !== password){
    //     throw new HttpError("Could not identify user, credentials seems to be wrong.", 401);
    // }
    res.json({
        userId : existingUser.id,
        email: existingUser.email,
        token: token
    });
}
exports.getAllUser = getAllUser;
exports.signup = signup;
exports.login = login;


