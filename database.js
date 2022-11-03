const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({path: './config.env'})

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
)
mongoose.connect(DB)
  .then(() => console.log("database connection successful"))
// class Database {
//   constructor () {
//     this.connect()
//   }
//   connect () {
//     mongoose.connect(DB)
//     .then(() => console.log('database connection successful'))
//     .catch((err) =>'database connection error' + err )
//   }
// }
