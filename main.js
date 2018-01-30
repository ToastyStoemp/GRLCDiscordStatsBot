const request = require('request');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const Discord = require("discord.js");
const bot = new Discord.Client();

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

        if (msg.channel.name == config.options.introductionChannel && config.options.shouldAddGPUCPURoles) {
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
                    break;
            }
        } else {
            switch (cmd) {
                case "help":
                    msg.channel.send({
                        "embed": {
                            "description": `Bot made for **${config.options.poolName}** by *ToastyStoemp* & *Rut*\nList of commands:`,
                            "color": 16777215,
                            "fields": [{
                                    "name": "!help",
                                    "value": "Shows this help message.",
                                    "inline": true
                                },
                                {
                                    "name": "!tip",
                                    "value": "Shows the address of the server and bot devs, feel free to send us something :smile:",
                                    "inline": true
                                },
                                {
                                    "name": "!stats",
                                    "value": "Shows all interesting statistics!"
                                },
                                {
                                    "name": "!poolStats",
                                    "value": "Shows interesting stats about this pool!",
                                    "inline": true
                                },
                                {
                                    "name": "!grlcStats",
                                    "value": "Shows interesting stats about Garlicoin!",
                                    "inline": true
                                },
                                {
                                    "name": "!etaNextBlock",
                                    "value": "Calculates an __estimated__ percentage of probability how close to mining the next block will be mined. This is an estimate!"
                                },
                                {
                                    "name": "!tipRandomaddress",
                                    "value": "Shows a random address from someone currently mining in the pool- perfect if you want to surprise a fellow miner!"
                                }
                            ]
                        }
                    });
                    break;
                case "tip":
                    msg.channel.send({
                        "embed": {
                            "description": "Want to show your appreciation for all this salty goodness?",
                            "color": 16777215,
                            "fields": [{
                                    "name": `Pool Backbone ( Help keep ${config.options.poolName} running! )`,
                                    "value": `${config.options.poolTipAdress}`
                                },
                                {
                                    "name": "ToastyStoemp ( Bot Developer #1 )",
                                    "value": "GQFMXJCcnremXu8RAi89Hu8ivUUdd6EtVL"
                                },
                                {
                                    "name": "Rut ( Bot Developer #2 )",
                                    "value": "GKxBoZ49srGXuGabXHdLEvRoq1uPQTX9wC"
                                }
                            ]
                        }
                    });
                    break;
                case "etanextblock":
                    try {
                        request({ url: "https://explorer.grlc-bakery.fun/api/getnetworkhashps", json: true }, function(error, response, body) {
                            if (error) console.log(error);
                            else {
                                var NetworkHashRate = body;
                                var PoolHashRate = lastKnownPoolHashRate;
                                var estimatedPoolGain = 24 * 60 * (60 / 40) * 50 * (PoolHashRate / NetworkHashRate);

                                var dayChance = (estimatedPoolGain / 50) * 100;

                                var timePercentage = (Date.now() - config.block.last) / (24 * 60 * 60 * 1000);
                                var currentChance = timePercentage * dayChance;
                                try {
                                    msg.reply(`with the current hashrate (${lastKnownPoolHashRateString}/s) compared to the global network hashrate of (${Math.round(NetworkHashRate / 1000 / 1000 / 1000 * 100) / 100}GH/s) this pool has advanced ${Math.round(currentChance * 100) / 100}% towards a potential next block solve.\n This pool has makes up for ${(PoolHashRate / NetworkHashRate * 100)}‱ in the network.\nTo learn more about the math behind this calculation use !help etaNextBlock`);
                                } catch (error) {
                                    console.log("Failed to reply to message for: " + cmd + "\n" + error);
                                }
                            }
                        });
                    } catch (error) {
                        console.log("Failed to get request data for: https://explorer.grlc-bakery.fun/api/getnetworkhashps\n" + error);
                    }
                    break;
                case "tiprandomaddress":
                    try {
                        request({ url: config.options.poolAPIStats, json: true }, function(error, response, body) {
                            if (error) console.log(error);
                            else {
                                console.log(body);
                                var garlicoinPool = body.pools.garlicoin
                                var obj_keys = Object.keys(garlicoinPool.workers);
                                var ran_key = obj_keys[Math.floor(Math.random() * garlicoinPool.workerCount)];
                                try {
                                    msg.channel.send({
                                        "embed": {
                                            "description": "This guy is chipping away hard at that salt, lookin' for dat tasty bread! He could use a toasty warm tip :wink:",
                                            "color": 16777215,
                                            "fields": [{
                                                    "name": "Address:",
                                                    "value": `${ran_key}`
                                                },
                                                {
                                                    "name": "Hash Rate:",
                                                    "value": `${garlicoinPool.workers[ran_key].hashrateString}`,
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Shares:",
                                                    "value": `${garlicoinPool.workers[ran_key].shares}`,
                                                    "inline": true
                                                }
                                            ]
                                        }
                                    });
                                } catch (error) {
                                    console.log("Failed to send message for: " + cmd + "\n" + error);
                                }
                            }
                        });
                    } catch (error) {
                        console.log("Failed to get request data for: " + config.options.poolAPIStats + "\n" + error);
                    }
                    break;
                case "poolstats":
                    try {
                        msg.channel.send({
                            "embed": {
                                "description": `Zero bamboozle ${config.options.poolName} stats!`,
                                "color": 16777215,
                                "fields": [{
                                        "name": "Highest Pool Hashrate:",
                                        "value": `${config.stats.highestHashRateString}`,
                                        "inline": true
                                    },
                                    {
                                        "name": "Highest Pool Workers:",
                                        "value": `${config.stats.highestWorkercount}`,
                                        "inline": true
                                    },
                                    {
                                        "name": "Highest Individual Hashrate:",
                                        "value": `${config.stats.highestIndividualHashRateString}`,
                                        "inline": true
                                    },
                                    {
                                        "name": "Fastest Block Solve:",
                                        "value": `${config.stats.fastestBlocktimeString}`,
                                        "inline": true
                                    },
                                    {
                                        "name": "Want moar stats?",
                                        "value": "Send us some suggestions on what you'd like to see!"
                                    }
                                ]
                            }
                        });
                    } catch (error) {
                        console.log("Failed to send message for: " + cmd + "\n" + error);
                    }
                    break;
                case "grlcstats":
                    request({ url: "https://explorer.grlc-bakery.fun/ext/summary", json: true }, function(error, response, body) {
                        if (error)
                            if (error) console.log("Error occured while poking: https://explorer.grlc-bakery.fun/ext/summary\n" + error);
                            else {
                                msg.channel.send({
                                    "embed": {
                                        "description": `Zero bamboozle ${config.options.poolName} stats!`,
                                        "color": 16777215,
                                        "fields": [{
                                                "name": "Current USD price:",
                                                "value": `${body.data[0].lastUsdPrice} $`,
                                                "inline": true
                                            },
                                            {
                                                "name": "Current BTC price:",
                                                "value": `${body.data[0].lastPrice} BTC`,
                                                "inline": true
                                            },
                                            {
                                                "name": "Current difficulty:",
                                                "value": `${body.data[0].difficulty}`,
                                                "inline": true
                                            },
                                            {
                                                "name": "Want moar stats?",
                                                "value": "Send us some suggestions on what you'd like to see!"
                                            }
                                        ]
                                    }
                                });
                            }
                    });
                    break;

                case "stats":
                    try {
                        request({ url: "https://explorer.grlc-bakery.fun/ext/summary", json: true }, function(error, response, body) {
                            if (error) console.log("Error occured while poking: https://explorer.grlc-bakery.fun/ext/summary\n" + error);
                            else {
                                try {
                                    msg.channel.send({
                                        "embed": {
                                            "description": `Zero bamboozle ${config.options.poolName} stats!`,
                                            "color": 16777215,
                                            "fields": [{
                                                    "name": "Highest Pool Hashrate:",
                                                    "value": `${config.stats.highestHashRateString}`,
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Highest Pool Workers:",
                                                    "value": `${config.stats.highestWorkercount}`,
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Highest Individual Hashrate:",
                                                    "value": `${config.stats.highestIndividualHashRateString}`,
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Fastest Block Solve:",
                                                    "value": `${config.stats.fastestBlocktimeString}`,
                                                    "inline": true
                                                }, {
                                                    "name": "Current USD price:",
                                                    "value": `${body.data[0].lastUsdPrice} $`,
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Current BTC price:",
                                                    "value": `${body.data[0].lastPrice} BTC`,
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Current difficulty:",
                                                    "value": `${body.data[0].difficulty}`,
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Want moar stats?",
                                                    "value": "Send us some suggestions on what you'd like to see!"
                                                }
                                            ]
                                        }
                                    });
                                } catch (error) {
                                    console.log("Failed to send message for: " + cmd + "\n" + error);
                                }
                            }
                        });
                    } catch (error) {
                        console.log("Failed to pull data from https://explorer.grlc-bakery.fun/ext/summary\n" + error);
                    }
                    break;
            }
        }
    }
});

if (config.options.shouldGreetUser) {
    bot.on('guildMemberAdd', member => {
        try {
            const channel = member.guild.channels.find('name', config.options.introductionChannel);
            if (!channel) return;
            var introMessage = `Welcome to the server, ${member} \n`;
            if (config.options.shouldAddGPUCPURoles)
                introMessage += `Please respond with either '!GPU' or '!CPU'.`
            channel.send(introMessage);
        } catch (error) {
            console.log("Failed to find the channel " + config.options.introductionChannel + " make sure this channel exists\n" + error);
        }
    });
}

bot.login(config.BotToken);

var SetCurrentRate = function() {
    request({ url: config.options.poolAPIStats, json: true }, function(error, response, body) {
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
                config.stats.highestHashRateString = garlicoinPool.hashrateString;
                needsSave = true;
            }

            for (var key in garlicoinPool.workers) {
                if (garlicoinPool.workers.hasOwnProperty(key)) {
                    var worker = garlicoinPool.workers[key];
                    if (worker.hashrate > config.stats.highestIndividualHashRate) {
                        config.stats.highestIndividualHashRate = worker.hashrate;
                        config.stats.highestIndividualHashRateString = worker.hashrateString;
                        config.stats.highestIndividualAdress = key;
                        needsSave = true;
                    }
                }
            }

            var blockData = garlicoinPool.blocks;
            var blockCount = blockData.pending + blockData.confirmed;
            if (blockCount > config.block.total) {
                try {
                    const channel = bot.channels.find('name', config.options.shoutChannel);
                    if (!channel) return;
                    channel.send(`@here Wipe your salty tears! Garlic has been served. Total: ${blockCount}`);

                    if (Date.now() - config.block.last < config.stats.fastestBlocktime) {
                        config.stats.fastestBlocktime = Date.now() - config.block.last;
                        var time = Date.now() - new Date(config.block.last);

                        config.stats.fastestBlocktimeString = "";
                        var hours = time.getHours();
                        if (hours > 0)
                            config.stats.fastestBlocktimeString += `${hours} hours`;

                        var mins = time.getMinutes();
                        if (mins > 0)
                            config.stats.fastestBlocktimeString += `${mins} minutes`;

                        if (config.stats.fastestBlocktimeString != "")
                            config.stats.fastestBlocktimeString += " and ";

                        var secs = time.getSeconds();
                        if (secs > 0)
                            config.stats.fastestBlocktimeString += `${secs} seconds`;

                        needsSave = true;
                    }

                    config.block.total = blockCount;
                    config.block.last = Date.now();
                    needsSave = true;
                } catch (error) {
                    console.log("Did you set the shoutChannel in the config file, and is the channel existant")
                }
            }

            if (needsSave) {
                try {
                    var data = JSON.stringify(config, null, 2);
                    fs.writeFileSync('config.json', data);
                } catch (error) {
                    console.log("Failed to save the config file.\n" + error);
                }
            }
        }
    });
}