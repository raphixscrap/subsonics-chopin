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

module.exports = {getReadableDuration}