const { createGuid } = require("../utils/utils");

class Room {
    constructor(roomName, host, problemId) {
        this.id = roomName;
        this.host = host;
        this.players = [ host ];
        this.createdDate = new Date();
        this.problemId = problemId;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    isReady() {
        let playersLen = this.players.length;
        if (playersLen == 1) {
            return false;
        }
        let ready = true;
        for (let i = 0; i < playersLen; i++) {
            ready = ready && this.players[i].state === 'ready';
        }
        return ready;
    }
}

module.exports = Room;


