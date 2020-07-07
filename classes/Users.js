class Users {
    constructor() {
        this.users = {}
    }

    getUsers() {
        return this.users;
    }

    hasUser(userId) {
        return this.users.hasOwnProperty(userId);
    }
    
    getUser(userId) {
        return this.users[userId];
    }

    addUser(player) {
        this.users[player.id] = player;
        return player;
    }
}

module.exports = Users;