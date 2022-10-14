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
  }
})

module.exports = mongoose.model('Gift', GiftSchema)