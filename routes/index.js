const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
	res.send({ response: "I am alive" }).status(200);
});

router.get("/numUsers", (req, res) => {
	res.send(numUsers).status(200);
});

router.get("/numRooms", (req, res) => {
	res.send(numRooms).status(200);
});

module.exports = router;