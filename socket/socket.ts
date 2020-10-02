import socketio = require("socket.io");
import http = require("http");
import uuid = require("uuid");

interface Player{
    user:User;
}

class Room{
    id:string;
    players: Array<Player> = [];

    constructor(){
        this.id = uuid.v4();
    }

    addPlayer(user:User){
        if(this.players.length < 4){
            this.players.push({
                user
            });
        }
    }
}

class User{
    socket:socketio.Socket;
    name:string;
    room:Room | undefined;

    constructor(socket:socketio.Socket,name:string = ""){
        this.socket = socket;
        this.name = name;
    }
}

export function createSocket(server:http.Server){
    const io = socketio(server);
    const users:Array<User> = [];
    const rooms:Array<Room> = [];

    io.on("connection",(socket) =>{
        console.log("a client has connected");
        const user = new User(socket);
        users.push(user);
        
        socket.on("createRoom",() =>{
            const room = new Room();
            rooms.push(room);
            socket.emit("createRoom",room.id);
            console.log("new room" + room.id);
        });

        socket.on("joinRoom",(id:string,name:string) =>{
            //check if user is already in a room
            if(user.room) return;
            const room = rooms.find((val) => val.id === id);
            //check if the room exists
            if(!room) return;
            //join user to the room
            user.name = name;
            room.addPlayer(user);
            user.room = room
            console.log(`${name} joined room: ${room.id}`);
        })
    })
}
