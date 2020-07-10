const Room = require("./Room");

class Rooms {
    constructor() {
        this.rooms = {}
    }

    getRooms() {
        return this.rooms;
    }

    getRoom(roomId) {
        return this.rooms[roomId];
    }

    hasRoom(roomId) {
       return this.rooms.hasOwnProperty(roomId);
    }

    createNewRoom(roomId, host, problemId) {
        let newRoom = new Room(roomId, host, problemId);
        this.rooms[roomId] = newRoom;
        return newRoom;
    }
}

module.exports = Rooms;