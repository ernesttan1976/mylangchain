import mongoose, { ConnectOptions } from "mongoose";
import getConfig from 'next/config';

const conf = getConfig();
const { publicRuntimeConfig } = conf;
const {
  DATABASE_URL,
} = publicRuntimeConfig;


const connect = () => {
  mongoose.connect(DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
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
