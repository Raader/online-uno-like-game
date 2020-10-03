import socketio = require("socket.io");
import http = require("http");
import uuid = require("uuid");

interface Player{
    user:User;
    deck: Array<Card> | undefined;
}

interface Card{
    num:Number;
    name:"normal" | "+2" | "+4" | "direction" | "skip";
    color: "blue" | "green" | "yellow" | "red" | "black";
}

class Room{
    id:string;
    owner:User;
    players: Array<Player> = [];

    constructor(owner:User){
        this.id = uuid.v4();
        this.owner = owner;
    }

    addPlayer(user:User,callback:(pList:Array<Player>) => void){
        if(this.players.length < 4){
            //add player to players
            this.players.push({
                user,
                deck:undefined
            });
            //notify players
            callback(this.players);       
        }
    }
    
    removePlayer(user:User,calback:(plist:Array<Player>) => void){
        const index = this.players.findIndex((val) => val.user === user);
        this.players.splice(index,1);
        calback(this.players);
    }

    startGame(user:User,callback:() => void){
        if(user === this.owner && this.players.length > 1){
            callback();
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
            //check if user is already in a room
            if(user.room) return;
            //create room
            const room = new Room(user);
            rooms.push(room);
            //notify users about the room
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
            user.room = room;
            user.socket.join(room.id);
            room.addPlayer(user,(players) => {
                io.to(room.id).emit("playerList",players.map((val) => val.user.name));
                console.log(`${user.name} joined the room: ${room.id}`);
            });
        });

        socket.on("leaveRoom",() =>{
            //remove user from the room if he joined any
            const room = user.room;
            if(room){
                room.removePlayer(user,(players) =>{
                    user.room = undefined;
                    io.to(room.id).emit("playerList",players.map((val) => val.user.name));
                    console.log(`${user.name} left the room: ${room.id}`);
                }); 
            }
        });

        socket.on("startGame",() =>{
            const room = user.room;
            //check if user is in a room
            if(!room) return;
            
            //start the game
            room.startGame(user,() => {
                io.to(room.id).emit("startGame");
            }); 
        });

        socket.on("disconnecting",() =>{
            //remove user from the room if he joined any
            const room = user.room;
            if(room){
                room.removePlayer(user,(players) =>{
                    user.room = undefined;
                    io.to(room.id).emit("playerList",players.map((val) => val.user.name));
                    console.log(`${user.name} left the room: ${room.id}`);
                }); 
            }
        });

        socket.on("disconnect",() =>{
            users.splice(users.indexOf(user),1);
            console.log(`${user.name} disconnected`);
        });
    })
}
