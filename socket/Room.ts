import uuid = require("uuid");
import { Card, CardColor } from "./Card";
import { User } from "./User";

interface GameState{
    //TODO card count
    lastCard:Card;
    deck:Array<Card> | undefined;
    turn:string;
    direction:number;
}

interface Player{
    user:User;
    deck: Array<Card>;
}

export class Room {
    id: string;
    owner: User;
    players: Array<Player> = [];
    started: Boolean = false;
    pool: Array<Card> = [];
    lastCard: Card;
    direction: number = 1;
    turn: Player | undefined;
    drawn: boolean = false;
    finished: boolean = false;
    change: boolean = false;
    stack: number = 0;
    grave: Array<Card> = [];
    onGameState: (states: { [k: string]: GameState; }) => void;
    onGameEnd: (winner: User | undefined) => void;
    onColorPick: (user: User) => void;

    constructor(owner: User, id:string, onGameState: (states: { [k: string]: GameState; }) => void, onGameEnd: (winner: User | undefined) => void, onColorPick: (user: User) => void) {
        this.id = id;
        this.owner = owner;
        this.createPool();
        this.lastCard = this.pickCard(["+2", "+4", "direction", "skip", "joker"]);
        this.onGameState = onGameState;
        this.onGameEnd = onGameEnd;
        this.onColorPick = onColorPick;
    }

    createPool() {
        //construct card pool
        for (let i = 0; i < 20; i++) {
            this.pool.push(
                {
                    num: i % 10,
                    color: "blue",
                    name: "normal"
                },
                {
                    num: i % 10,
                    color: "red",
                    name: "normal"
                },
                {
                    num: i % 10,
                    color: "green",
                    name: "normal"
                },
                {
                    num: i % 10,
                    color: "yellow",
                    name: "normal"
                }
            );
        }
        const names = ["+2", "direction", "skip"];
        const colors: Array<CardColor> = ["blue", "green", "yellow", "red"];
        for (let color of colors) {
            for (let i = 0; i < 2; i++) {
                this.pool.push({
                    num: -1,
                    name: "+2",
                    color: color
                });
                this.pool.push({
                    num: -1,
                    name: "skip",
                    color: color
                });
                this.pool.push({
                    num: -1,
                    name: "direction",
                    color: color
                });
            }
        }
        for (let i = 0; i < 4; i++) {
            this.pool.push({
                num: -1,
                name: "joker",
                color: "black"
            });
            this.pool.push({
                num: -1,
                name: "+4",
                color: "black"
            });
        }
    }

    addPlayer(user: User, callback: (pList: Array<Player>) => void) {
        if (this.players.length < 4 && !this.started) {
            //add player to players
            this.players.push({
                user,
                deck: []
            });
            //notify players
            callback(this.players);
        }
    }

    removePlayer(user: User, callback: (plist: Array<Player>) => void) {
        const index = this.players.findIndex((val) => val.user === user);
        if (this.started && this.turn === this.players[index]) {
            this.nextTurn();
        }
        this.players.splice(index, 1);
        callback(this.players);
        this.processGameState();
        if (this.players.length <= 1) {
            this.onGameEnd(undefined);
        }
    }

    startGame(user: User, callback: () => void) {
        if (user === this.owner && this.players.length > 1) {
            this.started = true;
            this.turn = this.players[0];
            this.giveCards();
            callback();
            this.processGameState();
        }
    }

    pickCard(exclude: Array<string> = []) {
        if(this.pool.length <= 0){
            this.pool.concat(this.grave);
            this.grave = [];
        }
        let index: number;
        let card: Card;
        while (true) {
            index = Math.floor((Math.random() * this.pool.length) + 1);
            card = this.pool[index];
            if (!exclude.find((val) => val === card.name)) {
                break;
            }
        }
        this.pool.splice(index, 1);
        return card;
    }

    giveCards() {
        for (let player of this.players) {
            for (let i = 0; i < 7; i++) {
                const card = this.pickCard();
                if (card) {
                    player.deck?.push(card);
                }
            }
        }
    }

    compareCard(card1: Card, card2: Card): Boolean {
        if (card1.name === "+4")
            return true;
        if (card1.name === "joker")
            return true;
        if (card1.name === "+2" && card1.name === card2.name)
            return true;
        if (card1.name === "skip" && card1.name === card2.name)
            return true;
        if (card1.name === "direction" && card1.name === card2.name)
            return true;
        return card1.color === card2.color || (card1.num >= 0 && card1.num === card2.num);
    }

    nextTurn() {
        if (!this.turn)
            return this.turn = this.players[0];
        const next = this.players.indexOf(this.turn) + this.direction;
        this.drawn = false;
        this.change = false;
        if (next >= this.players.length) {
            this.turn = this.players[0];
        }
        else if (next < 0) {
            this.turn = this.players[this.players.length - 1];
        }
        else {
            this.turn = this.players[next];
        }
    }

    evaluateDeck(player: Player) {
        for (let card of player.deck) {
            if (this.compareCard(card, this.lastCard)) {
                return true;
            }
        }
        return false;
    }

    findInDeck(player: Player, names: Array<string>) {
        for (let card of player.deck) {
            for (let name of names) {
                if (card.name === name) {
                    return true;
                }
            }
        }
        return false;
    }

    playCard(user: User, cardIndex: number) {
        //check if game has ended
        if (this.finished)
            return;
        //check if the player exists
        const player = this.players.find((val) => val.user === user);
        if (!player)
            return;
        //check if it is players turn
        if (this.turn !== player)
            return;
        //check if the card exists
        const card = player.deck[cardIndex];
        if (!card)
            return;
        if (this.compareCard(card, this.lastCard)) {
            player.deck.splice(player.deck.indexOf(card), 1);
            if(this.lastCard) this.grave.push(this.lastCard);
            this.lastCard = card;
            if (card.name === "direction") {
                this.direction = -this.direction;
            }
            else if (card.color === "black") {
                this.change = true;
                this.onColorPick(player.user);
                return;
            }
            if ((card.name !== "+2" && card.name !== "+4") && this.stack > 0) {
                for (let i = 0; i < this.stack; i++) {
                    this.turn.deck.push(this.pickCard());
                }
                this.stack = 0;
            }
            this.nextTurn();
            if (card.name === "+2") {
                if (this.findInDeck(this.turn, ["+2", "+4"])) {
                    this.stack += 2;
                }
                else {
                    for (let i = 0; i < this.stack + 2; i++) {
                        this.turn.deck.push(this.pickCard());
                    }
                    this.stack = 0;
                }
            }
            if (card.name === "skip") {
                this.nextTurn();
            }

            this.processGameState();
            this.checkGame();
        }

    }

    changeColor(user: User, color: CardColor) {
        if (this.turn?.user !== user || !this.change)
            return;
        this.lastCard.color = color;
        this.nextTurn();
        if (this.lastCard.name === "+4") {
            if (this.findInDeck(this.turn, ["+4"])) {
                this.stack += 4;
            }
            else {
                for (let i = 0; i < this.stack + 4; i++) {
                    this.turn.deck.push(this.pickCard());
                }
                this.stack = 0;
            }
        }
        this.processGameState();
        this.checkGame();
    }

    drawCard(user: User) {
        //check if game has ended
        if (this.finished)
            return;
        //check if the player exists
        const player = this.players.find((val) => val.user === user);
        if (!player)
            return;
        //check if it is players turn
        if (this.turn !== player)
            return;
        //check if card is already drawn
        if (this.drawn)
            return;
        //give card to player
        this.drawn = true;
        player.deck.push(this.pickCard());
        if (!this.evaluateDeck(player)) {
            this.nextTurn();
        }
        this.processGameState();
    }

    checkGame() {
        for (let player of this.players) {
            if (player.deck.length <= 0) {
                this.finished = true;
                this.onGameEnd(player.user);
            }
        }
    }

    processGameState() {
        if (!this.turn)
            return;
        const states: { [k: string]: GameState; } = {};
        for (let player of this.players) {
            states[player.user.name] = {
                lastCard: this.lastCard,
                deck: player.deck,
                turn: this.turn.user.name,
                direction: this.direction
            };
        }
        this.onGameState(states);
    }
}
