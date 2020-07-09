class Player{
    constructor(id, socket) {
        this.id = id;
        this.state = 'waiting';
        this.code = '';
        this.socket = socket;
        this.roomId = '';
    }

    // On submit
    setCode(code) {
        this.code = ''
    }

    getCode(code) {
        return this.code
    }

    setState(state) {
        this.state = state;
    }

    setRoomId(id) {
        this.roomId = id;
    }

    setSocket(socket) {
        this.socket = socket;
    }
    
    getSocket() {
        return this.socket;
    }
}

module.exports = Player
