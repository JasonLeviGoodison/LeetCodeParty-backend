const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const config = require('./config/base');
const models = require('./models/database');
const port = process.env.PORT || 4001;
const index = require("./routes/index");
const Socket = require('./controller/socket/socket');

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

	// Start the express Server
	const app = express();
	app.use(index);

	const server = http.createServer(app);

	// Start the Socket
	const io = socketIo(server); // < Interesting!

	// Handle the Socket Messages
	let socketCtrl = new Socket(io, knex);
	socketCtrl.Start();

	// Listen on Port
	server.listen(port, () => console.log(`Listening on port ${port}`));
}).catch(function(err) {
	console.log("Error during process: ", err);
	process.exit();
});
