const Room = require("./Room");

class Rooms {
    constructor() {
        this.rooms = {}
    }

    getRooms() {
        return this.rooms;
    }

    getRoom(roomId) {
        return new Promise(function(resolve, reject) {
           return global.knex('rooms')
               .where({
                   uuid: roomId
               })
               .select("*")
               .limit(1)
               .then(function(result) {
                   if (result.length < 1) {
                       return resolve(null);
                   }

                   console.log("Found Room: ", result[0]);
                   return resolve(result[0]);
               })
               .catch(function(err) {
                    return reject(err);
               });
        });
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