const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const config = require('./config/base');
const models = require('./models/database');
const port = process.env.PORT || 4001;
const { index } = require("./routes/index");
const SocketHandlers = require('./controller/socket/handlers');
var dbConnection = require('./knexfile.js')[process.env.ENV || "development"];

// Create the database connection
var dbConfig = {
	client: 'pg',
	connection: dbConnection,
	searchPath: ['knex', 'public'],
	pool: {min: 0, max: 10}
};

var knex = require('knex')(dbConfig);

knex.raw('select 1+1 as result')
.then(function() {
	return models.initialize(knex);
}).then(function() {
	console.log("Connected + Setup PSQL Database Successfully.");
	global.knex = knex;

	// Start the express Server
	const app = express();
	app.use(index);

	const server = http.createServer(app);

	// Start the Socket
	const io = socketIo(server); // < Interesting!

	// Handle the Socket Messages
	let socketCtrl = new SocketHandlers(io, knex);
	socketCtrl.Start();

	// Listen on Port
	server.listen(port, () => console.log(`Listening on port ${port}`));
}).catch(function(err) {
	console.log("Error during process: ", err);
	process.exit();
});
