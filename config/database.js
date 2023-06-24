import mongoose, { ConnectOptions } from "mongoose";
import getConfig from 'next/config';

const conf = getConfig();
const { serverRuntimeConfig } = conf;
const {
  DATABASE_URL,
} = serverRuntimeConfig;

let connectionTimeout;


const connect = () => {
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
    connectionTimeout = setTimeout(() => {
      disconnect();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
  });

  mongoose.connection.on("disconnected", () =>
    console.log("mongo disconnected")
  );
};

const disconnect = () => {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = undefined; // Reset the connectionTimeout variable
  }
  mongoose.connection.close()
    .then(() => {
      console.log("Mongoose connection closed.");
    })
    .catch((err) => {
      console.log("Error closing Mongoose connection:", err);
    });
};

export {
  connect, disconnect
}