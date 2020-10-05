import socketio = require("socket.io");
import http = require("http");
import uuid = require("uuid");

interface Player{
    user:User;
    deck: Array<Card>;
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
    started:Boolean = false;
    pool:Array<Card> = [];
    lastCard:Card;
    turn:number = 0;
    onGameState:(states:{[k: string]: GameState}) => void;
    constructor(owner:User,onGameState:(states:{[k: string]: GameState}) => void){
        this.id = uuid.v4();
        this.owner = owner;
        this.createPool();
        this.lastCard = this.pickCard();
        this.onGameState = onGameState;
    }

    createPool(){
        //construct card pool
        for(let i = 0; i < 20;i++){
            this.pool.push(
            {
                num:i % 10,
                color:"blue",
                name:"normal"
            },
            {
                num:i % 10,
                color:"red",
                name:"normal"
            },
            {
                num:i % 10,
                color:"green",
                name:"normal"
            },
            {
                num:i % 10,
                color:"yellow",
                name:"normal"
            },
            );
        }
        const names = ["+2","direction","skip"]
        const colors = ["blue","green","yellow","red"];
    }

    addPlayer(user:User,callback:(pList:Array<Player>) => void){
        if(this.players.length < 4 && !this.started){
            //add player to players
            this.players.push({
                user,
                deck:[]
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
            this.started = true;
            this.giveCards();
            callback();
            this.processGameState();
        }
    }

    pickCard(){
        const index = Math.floor((Math.random() * this.pool.length) + 1);
        const card = this.pool[index];
        this.pool.splice(index,1);
        return card;
    }

    giveCards(){
        for(let player of this.players){
            for(let i = 0; i < 7;i++){
                const card = this.pickCard();
                if(card){
                    player.deck?.push(card);
                }
            }
        }
    }

    compareCard(card1:Card,card2:Card): Boolean{
        return card1.color === card2.color || card1.num === card2.num;
    }   

    nextTurn(){
        const next = this.turn + 1;
        this.turn = next >= this.players.length ? 0 : next;
    }

    playCard(user:User,cardIndex:number){
        //check if the player exists
        const player = this.players.find((val) => val.user === user);
        if(!player) return;
        //check if the card exists
        const card = player.deck[cardIndex];
        if(!card) return;
        if(this.compareCard(card,this.lastCard)){
            player.deck.splice(player.deck.indexOf(card),1);
            this.lastCard = card
            this.nextTurn();
            this.processGameState();
        }

    }

    processGameState(){
        const states:{[k: string]: GameState} = {};
        for(let player of this.players){
            states[player.user.name] = {
                lastCard:this.lastCard,
                deck:player.deck,
                turn:this.players[this.turn].user.name
            }
        }
        this.onGameState(states);
    }
}

interface GameState{
    //TODO card count
    lastCard:Card;
    deck:Array<Card> | undefined;
    turn:string;
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
            const room = new Room(user,(states) =>{
                const keys = Object.keys(states);
                for(let key of keys){
                    const user = users.find((val) => val.name === key);
                    if(user){
                        user.socket.emit("gameState",states[key]);
                    }
                }
            });
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

        socket.on("playCard",(cardIndex:number) => {
            const room = user.room;
            //check if user is in a room
            if(!room) return;
            //play the card
            room.playCard(user,cardIndex);
        })

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
