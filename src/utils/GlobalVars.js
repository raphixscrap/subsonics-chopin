const path = require("path")
const root = path.resolve(__dirname, '../../')
const version = JSON.parse(require('fs').readFileSync(root + path.sep + "package.json", "utf-8")).version

const __glob = {
    PACKAGEINFO: root + path.sep + "package.json",
    ROOT: root + + path.sep,
    SRC: root + path.sep + "src",
    LOGS: root + path.sep + "logs",
    DATA: root + path.sep + "data",
    COMMANDS: root + path.sep + "src" + path.sep + "discord" + path.sep + "commands",
    METRIC_FILE: root + path.sep + "data" + path.sep + "metrics.json",
    PREVIOUSFILE: root + path.sep + "data" + path.sep + "previous.json",
    USERFILE: root + path.sep + "data" + path.sep + "users.json",
    PLAYLISTFILE: root + path.sep + "data" + path.sep + "playlists.json",
    HISTORY_DB: root + path.sep + "data" + path.sep + "history.json",
    MEDIA_DB: root + path.sep + "data" + path.sep + "media.json",
    VERSION: version,
    CHANGELOG_PATH: root + path.sep + "CHANGELOG.html",
}

module.exports = {__glob}