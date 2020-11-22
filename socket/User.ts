import socketio = require("socket.io");
import { Room } from "./Room";


export class User {
    socket: socketio.Socket;
    name: string;
    avatar: string;
    room: Room | undefined;

    constructor(socket: socketio.Socket, name: string = "", avatar: string = "") {
        this.socket = socket;
        this.name = name;
        this.avatar = avatar;
    }
}
