function createGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function buildHostRoomID(roomId) {
    return "host_socket_" + roomId;
}

function handlerErrorGraceful(callback, caller, resp, err) {
    console.log("Handler has failed: ", {
        handler: caller,
        response: resp,
        err: err
    })
    callback(resp);
}

var secondsBetweenDates = function(dateA, dateB) {
    return Math.abs((dateA.getTime() - dateB.getTime()) / 1000);
}

var trimLetters = function(string) {
    return string.replace(/[^0-9\.]+/g,"");
}

function points(runTime, memoryUsage, startTime, finishTime) {
    let seconds = secondsBetweenDates(startTime, finishTime)
    runTime = trimLetters(runTime);
    memoryUsage = trimLetters(memoryUsage);
    return runTime * 2 + memoryUsage * 2 + seconds;
}

module.exports = {
    createGuid,
    buildHostRoomID,
    handlerErrorGraceful,
    points
};