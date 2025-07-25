function getReadableDuration(duration) {
    var max = ""
    duration *= 1000;

    const maxhours = Math.floor(duration / 3600000);

    var maxmin = Math.trunc(duration / 60000) - (Math.floor(duration / 60000 / 60) * 60);
    var maxsec = Math.floor(duration / 1000) - (Math.floor(duration / 1000 / 60) * 60);


    if (maxsec < 10) {
        maxsec = `0${maxsec}`;
    }


    if(maxhours != 0) {

        if (maxmin < 10) {
            maxmin = `0${maxmin}`;
        }

        
        max = maxhours + "h" + maxmin + "m" + maxsec
    } else {
        max =  maxmin + "m" + maxsec + "s"
    
    }

    return max
}

function getSecondsDuration(duration) {
   // Duration is in format hh:mm:ss and can be just m:ss or mm:ss
    var durationArray = duration.split(":");
    var seconds = 0;
    if(durationArray.length == 3) {
        seconds = parseInt(durationArray[0]) * 3600 + parseInt(durationArray[1]) * 60 + parseInt(durationArray[2]);
    } else if(durationArray.length == 2) {
        seconds = parseInt(durationArray[0]) * 60 + parseInt(durationArray[1]);
    } else {
        seconds = parseInt(durationArray[0]);
    }
    return seconds;
}

module.exports = {getReadableDuration, getSecondsDuration}