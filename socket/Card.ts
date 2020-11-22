export type CardColor = "blue" | "green" | "yellow" | "red" | "black";

export interface Card{
    num:Number;
    name:"normal" | "+2" | "+4" | "direction" | "skip" | "joker";
    color: CardColor;
}