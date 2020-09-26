const express = require("express");
const router = express.Router();

let Controller;

function registerController(controller) {
	Controller = controller;
}

router.get("/", (req, res) => {
	res.send({ response: "I am alive" }).status(200);
});

router.get("/numUsers", (req, res) => {
	return Controller.getNumUsers()
			.then(function(num) {
				res.send(num).status(200);
			});
});

router.get("/numRooms", (req, res) => {
	return Controller.getNumRooms()
			.then(function(num) {
				res.send(num).status(200);
			});
});

router.get("/metrics/user/signups", (req, res) => {
	return Controller.getUserSignupGraph()
		.then(function(results) {
			res.send(results).status(200);
		});
});

router.get("/metrics/room/created", (req, res) => {
	return Controller.getRoomCreationGraph()
		.then(function(results) {
			res.send(results).status(200);
		});
});

module.exports = {
	index: router,
	registerController
}