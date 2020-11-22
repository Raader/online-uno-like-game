export function generateId(length:number = 5){
    let id:string = ""
    for(let i = 0;i < length;i++){
        id += Math.floor(Math.random() * 10);
    }
    return id;
}