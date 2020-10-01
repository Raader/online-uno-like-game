//imports
import express = require("express");
import http = require("http");
import {createSocket} from "../socket/socket";

//init app, server and socket
const app = express();
const server = http.createServer(app);
createSocket(server);

//listen to port
const port = process.env.PORT || 5000
server.listen(port,() =>{
  console.log(`server running at port ${port}`);
});