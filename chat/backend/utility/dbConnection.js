import mongoose from "mongoose";

export const connectToDatabase = () => {
  mongoose
    .connect(`${process.env.DB_CONNECTION_STRING}/chatapp`)
    .then(() => {
      console.log("Database connection sucessfull");
    })
    .catch((err) => {
      console.log({ DBERROR: err });
      console.log("Database connection unsucessfull");
    });
};
