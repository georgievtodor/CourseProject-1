/* globals module require */
"use strict"

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

module.exports = function(config) {
    mongoose.connect(config.connectionString);
    let Competition = require("../models/competition-model");

    let models = { Competition };

    fs.readdirSync("./data")
        .filter(x => x.includes("-data"))
        .forEach(file => {
            let dataModule = require(path.join(__dirname), file)({ models });

            Object.keys(dataModule)
                .forEach(key => {
                    data[key] = dataModule[key];
                });
        });

    let data = {};
}