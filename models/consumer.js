const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://127.0.0.1/");


// Define User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const collection = new mongoose.model('consumer', userSchema);
module.exports = collection;