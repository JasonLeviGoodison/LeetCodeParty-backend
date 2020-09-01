const Room = require("./Room");
const Logger = require('../observability/logging/logger');

class Rooms {
    constructor(knex) {
        this.knex = knex;
        this.logger = new Logger("rooms");
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
                       self.logger.error("Couldn't find room", roomId);
                       return resolve(null);
                   }

                   self.logger.info("Found Room", result[0]);
                   return resolve(result[0]);
               })
               .catch(function(err) {
                    return reject(err);
               });
        });
    }
}

module.exports = Rooms;