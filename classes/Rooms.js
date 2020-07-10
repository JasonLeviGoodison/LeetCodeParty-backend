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
        var newRoom = new Room(roomId, host, problemId)
        .then(function() {
            this.rooms[roomId] = newRoom;
            return newRoom;
        })
        .catch(function(err) {
            return err;
        });
    }
}

module.exports = Rooms;