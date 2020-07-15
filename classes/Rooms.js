const Room = require("./Room");

class Rooms {
    constructor(knex) {
        this.knex = knex;
    }

    getRoom(roomId) {
        let self = this;
        return new Promise(function(resolve, reject) {
           return self.knex('rooms')
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
}

module.exports = Rooms;