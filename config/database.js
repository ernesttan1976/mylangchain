import mongoose, { ConnectOptions } from "mongoose";
import getConfig from 'next/config';

const conf = getConfig();
const { serverRuntimeConfig } = conf;
const {
  DATABASE_URL,
} = serverRuntimeConfig;

export const connect = () => {
  mongoose.connect(DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // maxPoolSize: 20, // Maintain up to 20 socket connections
    // other mongoose options
  });

  mongoose.connection.on("error", (err) =>
    console.log(err.message + " is Mongod not running?")
  );

  mongoose.connection.once("open", () => {
    console.log("Connected to mongoose...");
  });

  mongoose.connection.on("disconnected", () =>
    console.log("mongo disconnected")
  );
};

export default connect;
