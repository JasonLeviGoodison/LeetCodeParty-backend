const Room = require("./classes/Room")
const Player = require("./classes/Player")
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Rooms = require("./classes/Rooms");
const Users = require("./classes/Users");
const { createGuid } = require("./utils/utils");
const config = require('./config/base');
const models = require('./models/database');
const Promise = require('bluebird')


const port = process.env.PORT || 4001;
const index = require("./routes/index");


// Create the db connection info
var dbConnection = {
	host: config.PG_CONNECTION_HOST,
	database: config.PG_CONNECTION_DB_NAME
};

// Create the database connection
var dbConfig = {
	client: 'pg',
	connection: dbConnection,
	searchPath: ['knex', 'public']
};

var knex = require('knex')(dbConfig);

knex.raw('select 1+1 as result')
.then(function() {
	return models.initialize(knex);
}).then(function() {
	console.log("Connected + Setup PSQL Database Successfully.");
	global.knex = knex;
}).catch(function(err) {
	console.log("Error during process: ", err);
	process.exit();
});

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server); // < Interesting!

var numUsers = 0;
let readyUps = 0;
let playerId = 0;
let players = []

// In memory sessions and users
let rooms = new Rooms();
let users = new Users();
let player = new Player();

function getNewProblem() {
  return "This is a new problem, start!"
}

console.log("Rooms", rooms.getRooms());
console.log("Users", users.getUsers());

//Create Room
function createRoom(host, problemId, callback) {
	const roomId = createGuid();

	return player.hasRoomAlready(host)
	.then(function(rooms) {
		if (rooms.length > 0) {
			console.log("Host had previous rooms, cleaning them up: ", rooms);
			return player.deleteAllHostedRooms(rooms);
		}

		return Promise.resolve();
	})
	.then(function() {
		return rooms.createNewRoom(roomId, host, problemId)
	})
	.then(function() {
		return player.setRoomId(host, roomId);
	})
	.then(function() {
		callback({
			roomId,
			problemId
		});
		//sendMessage('created the session', true);
		console.log('User ' + host + ' created room ' + roomId + ' with problem ' + problemId);
	})
	.catch(function(err) {
		console.log("Failed to create room: ", err);
	});
}


function newUser(socket, userId = '') {
	if (userId == '') {
		userId = createGuid();
	}
	const player = new Player(userId, socket);
	
	return users.addUser(player)
	.then(function() {
		socket.emit("userId", userId);
		console.log('New User! ' + userId);
	})
	.catch(function(err) {
		console.log("Failed to add user: ", err);
	});
}

io.on("connection", (socket) => {

	socket.on("getNewUserId", () => {
		newUser(socket)
	});

	socket.on("newSocket", ({userId}) => {
		users.getUser(userId)
		.then(function(user) {
			if (!user) {
				return newUser(socket, userId)
			}

			console.log("Returning User: ", userId);
			return Promise.resolve();
		})
		.then(function() {
			return;
		})
		.catch(function(err) {
			console.log("Failed with err: ", err);
		});
	});

	socket.on("joinRoom", ({roomId, userId}, callback) => {

		var roomVal;
		users.getUser(userId)
		.then(function(user) {
			if (!user) {
				return Promise.reject("User does not exist");
			}

			return rooms.getRoom(roomId);
		})
		.then(function(room) {
			if (!room) {
				return Promise.reject("Room does not exist");
			}

			roomVal = room;
			return player.inRoomAlready(userId, room.uuid);
		})
		.then(function(inRoomAlready) {
			if (!inRoomAlready) {
				return player.setRoomId(userId, roomVal.uuid);
			}

			console.log("User is already a member of the room.");
			return Promise.resolve();
		})
		.then(function() {
			callback({roomId, problemId: roomVal.problem_id});
		})
		.catch(function(msg) {
			console.log("Failed: ", msg);
			callback({errorMessage: msg});
		});
	});

	var addedUser = false;
	console.log("New client connected");

	socket.on("add user", () => {
		if (addedUser) return;

		newPlayer = new Player(playerId, socket)
		players.push(newPlayer);
		addedUser = true;
		++playerId;
		// we store the username in the socket session for this client
		//socket.username = username;
		++numUsers;

		socket.emit("login", newPlayer.id);
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			user: playerId
		});

		// when the user disconnects.. perform this
		socket.on('disconnect', () => {
			if (addedUser) {
				--numUsers;
				// echo globally that this client has left
				socket.broadcast.emit('user left', {
					//username: socket.username,
					numUsers: numUsers
				});
			}
		});
	});

	socket.on('createRoom', function(data, callback) {
		users.getUser(data.userId)
		.then(function(user) {
			if (!user) {
				callback("User does not exist!")
			}

			console.log("Found user: ", user);
			return createRoom(user.uuid, data.problemId, callback);
		})
		.then(function(room) {
			console.log("Made room");
		})
		.catch(function(err) {
			callback("Failed with error: ", err);
		});
	});
	socket.on("readyUp", (id) => {
		console.log("ready up", id)
		readyUps += 1;
		if(readyUps == 2) {
			players[0].socket.emit("gameready", getNewProblem())
			players[1].socket.emit("gameready", getNewProblem())
		}
	});


	socket.on("createNewRoom", (name) => {
		console.log("Creating a new room", name)
		
	})


  

  // socket.on("entergame", (roomId, playerId) => {


  //   // if (!rooms[roomId]) {
  //   //   rooms[roomId] = new Room(roomId, player)
  //   // }
  //   // else {
  //   //   rooms[roomId].addSecondPlayer(player);
  //   // }
  // })

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
