const mongoose = require("mongoose")

const NotesSchema = mongoose.Schema({
    title: String,
    value: String,
    userEmail: String,
    date: String,
    month: String,
    year: String
})

const NotesModel = mongoose.model("Notes", NotesSchema)
module.exports = NotesModel