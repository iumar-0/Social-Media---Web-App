import mongoose from "mongoose";

async function connectDB() {
    mongoose
        .connect(process.env.DATABASE_LOCAL)
        .then(() => console.log("Database connected to server..."))
        .catch((err) => console.log("Error in connecting MongoDb connection...", err));
}

process.on("SIGINT", () => {
    console.log(`\n` + "The termial interpeted :: ©️");
    process.exit(1);
});

process.on("unhandledRejection", (err) => {

    console.log(`\n` + "The reason to server shutdown", err);
    process.exit(1);
});


export { connectDB }