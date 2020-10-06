//imports
import express = require("express");
import http = require("http");
import {createSocket} from "../socket/socket";
import path = require("path");

//init app, server and socket
const app = express();
const server = http.createServer(app);
createSocket(server);

//serve client
if(process.env.NODE_ENV === "production"){
    
  //set static folder
  app.use(express.static("client/build"));

  app.get("*", (req,res) =>{
      res.sendFile(path.resolve(__dirname,"client","build","index.html"));
  })
}

//listen to port
const port = process.env.PORT || 5000
server.listen(port,() =>{
  console.log(`server running at port ${port}`);
});