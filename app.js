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
function createRoom(host, problemId, fn) {
	console.log("host", host)
	const roomId = createGuid();
	if (!users.hasUser(host.id)) {
		fn({ errorMessage: 'Disconnected.' });
		console.log('The socket received a message after it was disconnected.');
		return;
	}
	
	new Room(roomId, host, problemId)
	.then(function() {
		host.setRoomId(roomId);

		//users[userId].sessionId = sessionId;
		//sessions[session.id] = session;
		
		// fn({
		// 	roomId: roomId,
		// 	problemId: problemId
		// });
		//sendMessage('created the session', true);
		console.log('User ' + host.id + ' created session ' + room.id + ' with problem ' + problemId);
	})
	.catch(function(err) {
		console.log("Failed to setup room: ", err);
	});
}


function newUser(socket, userId = '') {
	if (userId == '') {
		userId = createGuid();
	}
	const player = new Player(userId, socket);
	
	users.addUser(player)
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
		let player = users.getUser(userId);

		// Incase server goes down & we lose our memory of user
		if (player === null || player === undefined) {
			newUser(socket, userId)
		} else {
			player.setSocket(socket);
			console.log('User is back! ' + userId);
		}
	})

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

	socket.on('createRoom', function(data, fn) {
		let player = users.getUser(data.playerId)
		createRoom(player, data.problemId, fn);
		console.log(rooms.getRooms());
		console.log(users.getUsers());
	})
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

module.exports = {
	rooms,
	users
}