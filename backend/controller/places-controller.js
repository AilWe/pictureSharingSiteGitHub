// const {uuid} = require("uuidv4")

const fs = require('fs');
const {validationResult} = require('express-validator')
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const getCoordsForAddress = require('../util/location');
const Place = require("../models/place");
const User = require("../models/user")

// let DUMMY_PLACES = [
//     {
//         id: 'p1',
//         title: 'Empire State Building',
//         description: 'One of the most famous sky scrapers in the world!',
//         location: {
//             lat: 40.7484474,
//             lng: -73.9871516
//         },
//         address: '20 W 34th St, New York, NY 10001',
//         creator: 'u1'
//     }
// ];

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid; //{pid: 'p1'}
    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not find a place.', 500
        );
        return next(error);
    }

    // const place = DUMMY_PLACES.find((p)=>{ //find return the 1st, filter return al array
    //     return p.id === placeId
    // });

    if (!place) {
        const error = new HttpError('Could not find a place for the place id', 404);
        //asynchronized      throw for synchronized
        return next(error);
    }
    res.json({place: place.toObject({getters: true})});
};

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let places;
    try {
        places = await Place.find({ creator: userId });
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not find a place.', 500
        );
        return next(error);
    }
    // const places = DUMMY_PLACES.filter((p) => {
    //     return p.creator === userId;
    // });
    if (!places || places.length === 0) {
        const error = new HttpError('Could not find a place for the user id', 404);
        return next(error);
    }
    res.json({places: places.map(place => place.toObject({getters: true}))});
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs passsed, please check your data.", 422));
    }

    const {title, description, address} = req.body;
    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);

    }
    // console.log("Suceesshere");

    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image:
            req.file.path,
        creator: req.userData.userId
    });

    let user;

    try {
        // console.log(creator);
        user = await User.findById(req.userData.userId);
    }catch (err){
        const error = new HttpError(
            "Creating place failed, please try again.", 500
        );
        return next(error);
    }

    if(!user){
        const error = new HttpError("Could not find user for provided id", 404);
        return next(error);
    }
     // console.log(user);
    // const createdPlace = {
    //     id: uuid(),
    //     title,
    //     description,
    //     location: coordinates,
    //     address,
    //     creator
    //

    try {
        const sess = await mongoose.startSession();

        sess.startTransaction();
        await createdPlace.save({ session: sess });
        // console.log(createdPlace);
        user.places.push(createdPlace);
        // console.log(user);
        await user.save({session: sess});
        // console.log("ok5");
        await sess.commitTransaction();
        // console.log("ok6");
        sess.endSession();
        // await createdPlace.save();
    } catch (err) {
        const error = new HttpError(
            "Creating place failed, please try again.", 500
        );
        return next(error)
    }

    // DUMMY_PLACES.push(createdPlace); //unshifted(createdPlace)

    res.status(201).json({place: createdPlace});
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next( new HttpError("Invalid inputs passsed, please check your data.", 422));
    }
    const {title, description} = req.body;
    const placeId = req.params.pid;

    let place;
    try{
        place = await Place.findById(placeId);
    }catch (err){
        const error = new HttpError(
            "Something went wrong, could not update place", 500
        )
        return next(error);
    }

    if(place.creator.toString() !== req.userData.userId){

        const error = new HttpError(
            "You are not allowed to edit this place", 403
        )
        return next(error);

    }
    // const updatedPlate = {...DUMMY_PLACES.find(p => p.id === placeId)};
    // const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
    // updatedPlate.title = title;
    // updatedPlate.description = description;
    place.title = title;
    place.description = description;

    try{
        await place.save();
    }catch (err){
        const error = new HttpError(
            "Something went wrong, could not update place", 500
        );
        return next(error);
    }

    // DUMMY_PLACES[placeIndex] = updatedPlate;

    res.status(200).json({place: place.toObject({getters: true})});
};

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId).populate("creator");
    }catch (err){
        const error = new HttpError(
            "Something went wrong, could not delete place.", 500
        )
        return next(error)
    }
    // if (!DUMMY_PLACES.find(p => p.id === placeId)) {
    //     throw new HttpError("could not find a place for that id", 404)
    // }

    if(!place){
        const error = new HttpError("Could not find place for this Id", 404);
        return next(error);
    }

    if(place.creator.id !== req.userData.userId){
        const error = new HttpError(
            "You are not allowed to delete this place", 403
        )
        return next(error);
    }
    const imagePath = place.image;
    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        place.remove({session: sess});
        place.creator.places.pull(place);
        await place.creator.save({session: sess});
        await sess.commitTransaction();
        // await place.remove();
    }catch (err){
        const error = new HttpError(
            "Something went wrong, could not delete place.", 500
        )
        return next(error)
    }
    fs.unlink(imagePath, err => {
        console.log(err);

        }
    )
    // DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
    res.status(200).json({message: 'Deleted place.'});
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;

// AIzaSyDBeMcrCJ_eeYeNYVCpn8YSqoOzVdV864s
