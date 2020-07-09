const express = require("express");
const router = express.Router();
const { rooms, users } = require("../app")

router.get("/", (req, res) => {
	res.send({ response: "I am alive" }).status(200);
});

router.get("/numUsers", (req, res) => {
	res.send(users.getUsers().length).status(200);
});

router.get("/numRooms", (req, res) => {
	res.send(rooms.getRooms().length).status(200);
});

module.exports = router;