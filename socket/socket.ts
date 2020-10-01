import socketio = require("socket.io");
import http = require("http");

export function createSocket(server:http.Server){
    const io = socketio(server);
    io.on("connection",(socket) =>{
        console.log("a client has connected");
    })
}
