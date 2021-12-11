const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");


const placesRoute = require('./routes/places-route');
const usersRoute = require('./routes/user-routes')
const HttpError = require("./models/http-error");
const app = express();

const fs = require('fs');
const path = require('path');


app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join('uploads', 'images')));
app.use( express.static(path.join("public")));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE")
    next();
});

app.use('/api/places', placesRoute); // => /api/places/...
app.use('/api/users', usersRoute);

app.use((req, res, next) => {
    res.sendFile(path.resolve(__dirname, "public", "index.html"))
})


// app.use((req, res, next)=>{
//     const error = new HttpError('Could not find this route.', 404);
//     throw error;
// });

//4 parameter as error function
app.use((error,req, res, next)=>{
    if(req.file){
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        });
    }
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || "An unknown error occurred!"});
})

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.sk1ge.mongodb.net/${process.env.DB_NAME}`, { useNewUrlParser: true })
    .then(()=>{
        app.listen(process.env.PORT || 5000, ()=>{
            console.log("listen 5000")
        })
    })
    .catch(err =>{
        console.log(err);
    });


