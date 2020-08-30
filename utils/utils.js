function createGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function buildHostRoomID(roomId) {
    return "host_socket_" + roomId;
}

var secondsBetweenDates = function(dateA, dateB) {
    return Math.abs((dateA.getTime() - dateB.getTime()) / 1000);
}

var trimLetters = function(string) {
    return string.replace(/[^0-9\.]+/g,"");
}

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

function points(runTime, memoryUsage, startTime, finishTime) {
    let multipliers = requireUncached('../config/multipliers.json');
    let seconds = secondsBetweenDates(startTime, finishTime)

    runTime = trimLetters(runTime);
    memoryUsage = trimLetters(memoryUsage);

    return runTime * multipliers['runTime'] + memoryUsage * multipliers['memoryUsage'] + seconds * multipliers['writingTime'];
}

module.exports = {
    createGuid,
    buildHostRoomID,
    points
};