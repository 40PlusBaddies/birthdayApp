const mongoose = require('mongoose')

const GiftSchema = new mongoose.Schema({
  gift: {
    type: String,
    required: false,
  },    
  purchased: {
    type: Boolean,
    required: false,
  },
  userId: {
    type: String,
    required: true,
  },
//   how can we include the birthdayPerson's id?
})

module.exports = mongoose.model('Gift', GiftSchema)