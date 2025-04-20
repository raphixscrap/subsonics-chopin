/**
 * [Subsonics Chopin - Backend] - Raphix - 02/2025
 * File: main.js
 * Description: Main entry point for the backend application
 */


const { LogType } = require('loguix');
const { __glob } = require("./utils/GlobalVars")
require("loguix").setup(__glob.LOGS, __glob.PACKAGEINFO)
const config = require("./utils/Database/Configuration")
const metric = require("webmetrik")
metric.setMetricFile(__glob.METRIC_FILE)
metric.publishMetrics("8001", "raphraph")


// SETUP 

setup();

async function setup() {
    const DiscordBot = require("./discord/Bot")
    DiscordBot.init()
    const Server = require("./server/Server")
    Server.init()
}