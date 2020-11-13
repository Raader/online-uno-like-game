import socketio = require("socket.io");
import http = require("http");
import { Room } from "./Room";
import { User } from "./User";
import { CardColor } from "./Card";

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
            const room = new Room(user,(states) =>{
                const keys = Object.keys(states);
                for(let key of keys){
                    const user = users.find((val) => val.name === key);
                    if(user){
                        user.socket.emit("gameState",states[key]);
                    }
                }
            },
            (winner) =>{
                for(let player of room.players){
                    player.user.room = undefined;
                    rooms.splice(rooms.indexOf(room),1);
                }
                io.to(room.id).emit("finishGame",winner? winner.name : "");
            },
            (u) =>{
                u.socket.emit("pickColor");
            });
            rooms.push(room);
            //notify users about the room
            socket.emit("createRoom",room.id);
            console.log("new room" + room.id);
        });

        socket.on("joinRoom",(id:string,name:string,avatar:string) =>{
            //check if user is already in a room
            if(user.room) return;
            const room = rooms.find((val) => val.id === id);
            //check if the room exists
            if(!room) return;
            //join user to the room
            user.name = name;
            user.room = room;
            user.avatar = avatar;
            user.socket.join(room.id);
            room.addPlayer(user,(players) => {
                io.to(room.id).emit("playerList",players.map((val) => {return {name:val.user.name,avatar:val.user.avatar}}));
                console.log(`${user.name} joined the room: ${room.id}`);
            });
        });

        socket.on("leaveRoom",() =>{
            //remove user from the room if he joined any
            const room = user.room;
            if(room){
                room.removePlayer(user,(players) =>{
                    user.room = undefined;
                    io.to(room.id).emit("playerList",players.map((val) => {return {name:val.user.name,avatar:val.user.avatar}}));
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

        socket.on("playCard",(cardIndex:number) => {
            const room = user.room;
            //check if user is in a room
            if(!room) return;
            //play the card
            room.playCard(user,cardIndex);
        })

        socket.on("drawCard",() =>{
            const room = user.room;
            //check if user is in a room
            if(!room) return;
            //drawCard
            room.drawCard(user);
        })

        socket.on("pickColor",(color:CardColor) =>{
            const room = user.room;
            //check if user is in a room
            if(!room) return;
            if(!["blue","red","yellow","green"].find((val) => val === color)) return;
            room.changeColor(user,color);
        })

        socket.on("disconnecting",() =>{
            //remove user from the room if he joined any
            const room = user.room;
            if(room){
                room.removePlayer(user,(players) =>{
                    user.room = undefined;
                    io.to(room.id).emit("playerList",players.map((val) => {return {name:val.user.name,avatar:val.user.avatar}}));
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
