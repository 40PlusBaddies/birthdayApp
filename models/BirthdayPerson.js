const mongoose = require('mongoose')

const BirthdayPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
  relation: {
    type: String,
    required: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  gifts: [String]*/
})

module.exports = mongoose.model('BirthdayPerson', BirthdayPersonSchema)