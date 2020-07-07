const Room = require("./Room");

class Rooms {
    constructor() {
        this.rooms = {}
    }

    getRooms() {
        return this.rooms;
    }

    hasRoom(roomId) {
       return this.rooms.hasOwnProperty(roomId);
    }

    createNewRoom(room, player) {
        let newRoom = new Room(room, player);
        this.rooms[room] = newRoom;
        return newRoom;
    }
}

module.exports = Rooms;