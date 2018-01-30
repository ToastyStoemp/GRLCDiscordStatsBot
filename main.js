const request = require('request');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const Discord = require("discord.js");
const bot = new Discord.Client();

var moderators = config.moderators;
var lastKnownPoolHashRate;
var lastKnownPoolHashRateString;

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    setInterval(SetCurrentRate, 60 * 1000);
    SetCurrentRate();
});

bot.on('message', msg => {
    var message = msg.content;

    if (message[0] == "!") {
        message = message.substr(1, message.length - 1);
        var messageArr = message.split(' ');
        var cmd = messageArr.splice(0, 1)[0].toLowerCase();
        var arg = "";
        if (messageArr.length > 0)
            arg = messageArr.splice(0, 1)[0].toLowerCase();

        if (msg.channel.name == "introduction") {
            switch (cmd) {
                case "gpu":
                    var guildMem = msg.channel.lastMessage.member;
                    var role = msg.guild.roles.find("name", "GPU");
                    guildMem.addRole(role).catch(console.error);
                    break;
                case "cpu":
                    var guildMem = msg.channel.lastMessage.member;
                    var role = msg.guild.roles.find("name", "CPU");
                    guildMem.addRole(role).catch(console.error);

                    msg.delete(10000);
                    break;
            }
        } else {
            switch (cmd) {
                case "help":
                    if (arg == "")
                        msg.reply("Bot made for **The Salt Mine** by *ToastyStoemp*\n List of commands:\n !help, !tip, !etaNextBlock, !tipRandomAdress, !stats");
                    else {
                        switch (arg) {
                            case "help":
                                msg.reply("Shows the help message");
                                break;
                            case "tip":
                                msg.reply("Shows the adress of the server and bot dev, feel free to send us something :)");
                                break;
                            case "etanextblock":
                                msg.reply("Calculates the estimate time till the next block will be mined. This is an estimate!");
                                break;
                            case "tiprandomadress":
                                msg.reply("Shows the a random adress from someone currently mining in the pool, perfect if you want to surprise a fellow miner!");
                                break;
                            case "stats":
                                msg.reply("Shows the some interesting stats about this pool!");
                                break;
                        }
                    }
                    break;
                case "tip":
                    msg.reply("Feel free to tip **The Salt Mine** at: GWQC7SmUvvmkEbsNVrhBgm4hNMXxPUf3Sj\nOr throw some GRLC at the developer of this bot: GQFMXJCcnremXu8RAi89Hu8ivUUdd6EtVL");
                    break;
                case "etanextblock":
                    request({ url: "https://explorer.grlc-bakery.fun/api/getnetworkhashps", json: true }, function(error, response, body) {
                        if (error) console.log(error);
                        else {
                            var NetworkHashRate = body;
                            var PoolHashRate = lastKnownPoolHashRate;
                            var estimatedPoolGain = 24 * 60 * (60 / 40) * 50 * (PoolHashRate / NetworkHashRate);

                            var dayChance = (estimatedPoolGain / 50) * 100;

                            var timePercentage = (Date.now() - config.block.last) / (24 * 60 * 60 * 1000);
                            var currentChance = timePercentage * dayChance;
                            msg.reply(`With the current hashrate (${lastKnownPoolHashRateString}/s) compared to the global network hashrate (${Math.round(NetworkHashRate / 1000 / 1000 / 1000 * 100) / 100}GH/s) this pool has an ${Math.round(currentChance * 100) / 100}% chance to solve the current block first.\nTo learn more about the math behind this calculation use !help etaNextBlock`);
                        }
                    });
                    break;
                case "tiprandomadress":
                    request({ url: "http://209.250.230.130/api/stats", json: true }, function(error, response, body) {
                        if (error) console.log(error);
                        else {
                            var garlicoinPool = body.pools.garlicoin
                            var obj_keys = Object.keys(garlicoinPool.workers);
                            var ran_key = obj_keys[Math.floor(Math.random() * garlicoinPool.workerCount)];
                            msg.reply("Here is a random adress from the list of current workers: " + ran_key);
                        }
                    });
                    break;
                case "stats":
                    msg.reply("Highest HashRate: " + config.stats.highestHashRate + "\nHighest Worker Count: " + config.stats.highestWorkercount + "\nWill show more stats soon.");
                    break;
            }
        }

        if (message === "ping") {
            bot.sendMessage({
                to: channelID,
                message: "pong"
            });
        }
    }
});

bot.on('guildMemberAdd', member => {
    const channel = member.guild.channels.find('name', 'introduction');
    if (!channel) return;
    channel.send(`Welcome to the server, ${member} \nPlease respond with either '!GPU' or '!CPU'.`);
});

bot.login(config.BotToken);

var SetCurrentRate = function() {
    request({ url: "http://209.250.230.130/api/stats", json: true }, function(error, response, body) {
        if (error) console.log(error);
        else {
            var needsSave = false;

            var garlicoinPool = body.pools.garlicoin;
            lastKnownPoolHashRate = garlicoinPool.hashrate;
            lastKnownPoolHashRateString = garlicoinPool.hashrateString;

            bot.user.setPresence({ game: { name: garlicoinPool.hashrateString + " ~ " + garlicoinPool.workerCount, type: 0 } });

            if (garlicoinPool.workerCount > config.stats.highestWorkercount) {
                config.stats.highestWorkercount = garlicoinPool.workerCount;
                needsSave = true;
            }

            if (garlicoinPool.hashrate > config.stats.highestHashRate) {
                config.stats.highestHashRate = garlicoinPool.hashrate;
                needsSave = true;
            }

            var blockData = garlicoinPool.blocks;
            var blockCount = blockData.pending + blockData.confirmed;
            if (blockCount > config.block.total) {

                const channel = bot.channels.find('name', 'shout');
                if (!channel) return;
                channel.send(`@here Wipe your salty tears! Garlic has been served. Total: ${blockCount}`);

                config.block.total = blockCount;
                config.block.last = Date.now();
                needsSave = true;
            }

            if (needsSave) {
                var data = JSON.stringify(config, null, 2);
                fs.writeFileSync('config.json', data);
            }
        }
    });
}