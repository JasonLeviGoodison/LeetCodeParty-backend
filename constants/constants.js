module.exports = {
    SERVER_ENV: process.env.ENV || "development",

    NEW_SOCKET_MESSAGE: "newSocket",
    GET_NEW_USER_ID_MESSAGE: "getNewUserId",
    JOIN_ROOM_MESSAGE: "joinRoom",
    CREATE_ROOM_MESSAGE: "createRoom",
    LEAVE_ROOM_MESSAGE: "leaveRoom",
    READY_UP_MESSAGE: "readyUp",
    START_ROOM_MESSAGE: "startRoom",
    ROOM_STARTED_MESSAGE: "roomStarted",
    USER_SUBMITTED_MESSAGE: "userSubmitted",
    GAME_OVER_MESSAGE: "gameOver",
    USER_VIEWED_CODE_MESSAGE: "userViewedCode",

    // Point IDs
    RUNTIME_POINTS_ID: "runtimePointsID",
    MEM_POINTS_ID: "memoryPointsID",
    WRITING_TIME_POINTS_ID: "writingTimePointsID",
    READ_RECEIPT_POINTS_ID: "readReceiptPointsID"
};