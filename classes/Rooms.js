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
        return new Promise(function(resolve, reject) {
            return new Room(roomId, host, problemId)
            .then(function(results) {
                return resolve();
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }
}

module.exports = Rooms;