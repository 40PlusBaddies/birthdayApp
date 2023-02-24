const mongoose = require("mongoose");
require("dotenv").config({ path: "./config/.env" });

const connectDB = async () => {
    try {
        // stop deprication warning
        mongoose.set("strictQuery", true);
        const conn = await mongoose
            .connect(process.env.DB_STRING, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                dbName: "birthdayApp",
            })
            .then();

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = connectDB;
