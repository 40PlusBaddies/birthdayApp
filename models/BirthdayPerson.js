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
  monthNotificationSent: {
    type: Boolean,
    default: false,
  },
  weekNotificationSent: {
    type: Boolean,
    default: false,
  },
  tomorrowNotificationSent: {
    type: Boolean,
    default: false,
  },
  //gifts: [String]
})

module.exports = mongoose.model('BirthdayPerson', BirthdayPersonSchema)