const request = require('request');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const Discord = require("discord.js");
const bot = new Discord.Client();

var lastKnownPoolHashRate;
var lastKnownPoolHashRateString;

var lastKnownData = {};

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);

    setInterval(UpdateData, 60 * 1000);
    UpdateData();

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
                    var role = msg.guild.roles.find("name", config.options.GPURole);
                    guildMem.addRole(role).catch(console.error);
                    return;
                    break;
                case "cpu":
                    var guildMem = msg.channel.lastMessage.member;
                    var role = msg.guild.roles.find("name", config.options.CPURole);
                    guildMem.addRole(role).catch(console.error);
                    return;
                    break;
            }
        }
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
                                "name": "!poolInfo",
                                "value": "Shows pool details!"
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
                                "value": `${config.options.poolTipAddress}`
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
            case "poolinfo":
                msg.channel.send({
                    "embed": {
                        "description": "Want to show your appreciation for all this salty goodness?",
                        "color": 16777215,
                        "fields": [{
                                "name": `Pool Name`,
                                "value": `${config.options.poolName}`
                            },
                            {
                                "name": "Pool Site",
                                "value": `${config.options.poolAPIStats.slice(0, -9)}`
                            },
                            {
                                "name": "Pool Fee",
                                "value": `${config.options.poolFee}`
                            },
                            {
                                "name": "Pool Stratum",
                                "value": `${config.options.poolAddress}`
                            }
                        ]
                    }
                });
                break;
            case "eta":
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
                                msg.reply(`With the current hashrate (${lastKnownPoolHashRateString}/s) compared to the global network hashrate of (${Math.round(NetworkHashRate / 1000 / 1000 / 1000 * 100) / 100}GH/s) this pool has advanced ${Math.round(currentChance * 100) / 100}% towards a potential next block solve.\nThis pool has an estimate income of ${Math.round(estimatedPoolGain * 100) / 100} GRLC/24h\nThis pool has makes up for ${Math.round(PoolHashRate / NetworkHashRate * 100 * 100) /100}‱ in the network.\nTo learn more about the math behind this calculation use !help etaNextBlock`);
                            } catch (error) {
                                console.log("Failed to reply to message for: " + cmd + "\n" + error);
                            }
                        }
                    });
                } catch (error) {
                    console.log("Failed to get request data for: https://explorer.grlc-bakery.fun/api/getnetworkhashps\n" + error);
                }
                break;
            case "tiprandom":
            case "tiprandomaddress":
                try {
                    request({ url: config.options.poolAPIStats, json: true }, function(error, response, body) {
                        if (error) console.log(error);
                        else {
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
                    request({ url: config.options.poolAPIStats, json: true }, function(error, response, body) {
                        if (error) console.log(error);
                        else {
                            var garlicoinPool = body.pools.garlicoin;
                            var targetTime = lastKnownData[Math.floor(Date.now() / 1000 / 60) - 60];
                            if (targetTime == undefined)
                                targetTime = lastKnownData[Object.keys(lastKnownData)[0]];
                            msg.channel.send({
                                "embed": {
                                    "description": `Zero bamboozle ${config.options.poolName} stats!`,
                                    "color": 16777215,
                                    "fields": [{
                                            "name": "Blocks Mined:",
                                            "value": `${config.block.total} (${StringDifference(targetTime.blocksMined, config.block.total)})`,
                                            "inline": true
                                        },
                                        {
                                            "name": "Current Hashrate:",
                                            "value": `${garlicoinPool.hashrateString} (${StringDifference(targetTime.poolRate, HashrateFromString(garlicoinPool.hashrateString))})`,
                                            "inline": true
                                        },
                                        {
                                            "name": "Current Worker Count",
                                            "value": `${garlicoinPool.workerCount} (${StringDifference(targetTime.workerCount, garlicoinPool.workerCount)})`,
                                            "inline": true
                                        },
                                        {
                                            "name": "Average Hashrate",
                                            "value": `${garlicoinPool.workerCount} (${StringDifference(targetTime.workerCount, garlicoinPool.workerCount)})`,
                                            "inline": true
                                        },
                                        {
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
                                            "value": `${config.stats.highestIndividualWorker.hashrateString}`,
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
                        }
                    });
                } catch (error) {
                    console.log("Failed to send message for: " + cmd + "\n" + error);
                }
                break;
            case "grlcstats":
                try {
                    request({ url: "https://explorer.grlc-bakery.fun/ext/summary", json: true }, function(error, response, body) {
                        if (error) console.log("Error occured while poking: https://explorer.grlc-bakery.fun/ext/summary\n" + error);
                        else {
                            var targetTime = lastKnownData[Math.floor(Date.now() / 1000 / 60) - 60];
                            if (targetTime == undefined)
                                targetTime = lastKnownData[Object.keys(lastKnownData)[0]];
                            msg.channel.send({
                                "embed": {
                                    "description": `Zero bamboozle ${config.options.poolName} stats!`,
                                    "color": 16777215,
                                    "fields": [{
                                            "name": "Current USD price:",
                                            "value": `${body.data[0].lastUsdPrice} $ (${StringDifference(targetTime.UsdPrice, body.data[0].lastUsdPrice)})`,
                                            "inline": true
                                        },
                                        {
                                            "name": "Current BTC price:",
                                            "value": `${Math.round(body.data[0].lastPrice * 1000 * 100) / 100} mBTC (${StringDifference(targetTime.lastPrice, body.data[0].lastPrice)})`,
                                            "inline": true
                                        },
                                        {
                                            "name": "Current difficulty:",
                                            "value": `${Math.round(body.data[0].difficulty * 100) / 100} (${StringDifference(targetTime.difficulty, body.data[0].difficulty)})`,
                                            "inline": true
                                        },
                                        {
                                            "name": "Block Count:",
                                            "value": `${body.data[0].blockcount} (${StringDifference(targetTime.blockCount,body.data[0].blockcount)})`,
                                            "inline": true
                                        },
                                        {
                                            "name": "Network Rate:",
                                            "value": `${body.data[0].hashrate}GH/s (${StringDifference(targetTime.networkRate,body.data[0].hashrate)})`,
                                            "inline": true
                                        },
                                        {
                                            "name": "Ammount of GRLC needed for Lambo:",
                                            "value": `${Math.round(200000 / body.data[0].lastUsdPrice * 100) / 100} GRLC`,
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
                } catch (error) {
                    console.log("Failed getting date from https://explorer.grlc-bakery.fun/ext/summary\n" + error)
                }
                break;

            case "stats":
                try {
                    request({ url: "https://explorer.grlc-bakery.fun/ext/summary", json: true }, function(error, response, body) {
                        if (error) console.log("Error occured while poking: https://explorer.grlc-bakery.fun/ext/summary\n" + error);
                        else {
                            request({ url: config.options.poolAPIStats, json: true }, function(error, response, bodyTwo) {
                                if (error) console.log(error);
                                else {
                                    var garlicoinPool = bodyTwo.pools.garlicoin;
                                    try {
                                        var targetTime = lastKnownData[Math.floor(Date.now() / 1000 / 60) - 60];
                                        if (targetTime == undefined)
                                            targetTime = lastKnownData[Object.keys(lastKnownData)[0]];
                                        msg.channel.send({
                                            "embed": {
                                                "description": `Zero bamboozle ${config.options.poolName} stats!`,
                                                "color": 16777215,
                                                "fields": [{
                                                        "name": "Blocks Mined:",
                                                        "value": `${config.block.total} (${StringDifference(targetTime.blocksMined, config.block.total)})`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Current Hashrate:",
                                                        "value": `${garlicoinPool.hashrateString} (${StringDifference(targetTime.poolRate, HashrateFromString(garlicoinPool.hashrateString))})`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Current Worker Count",
                                                        "value": `${garlicoinPool.workerCount} (${StringDifference(targetTime.workerCount, garlicoinPool.workerCount)})`,
                                                        "inline": true
                                                    },
                                                    {
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
                                                        "value": `${config.stats.highestIndividualWorker.hashrateString}`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Fastest Block Solve:",
                                                        "value": `${config.stats.fastestBlocktimeString}`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Current USD price:",
                                                        "value": `${body.data[0].lastUsdPrice} $ (${StringDifference(targetTime.UsdPrice, body.data[0].lastUsdPrice)})`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Current BTC price:",
                                                        "value": `${Math.round(body.data[0].lastPrice * 1000 * 100) / 100} mBTC (${StringDifference(targetTime.lastPrice * 1000, body.data[0].lastPrice * 1000)})`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Current difficulty:",
                                                        "value": `${Math.round(body.data[0].difficulty * 100) / 100} (${StringDifference(targetTime.difficulty, body.data[0].difficulty)})`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Block Count:",
                                                        "value": `${body.data[0].blockcount} (${StringDifference(targetTime.blockCount,body.data[0].blockcount)})`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Network Rate:",
                                                        "value": `${body.data[0].hashrate}GH/s (${StringDifference(targetTime.networkRate,body.data[0].hashrate)})`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Ammount of GRLC needed for Lambo:",
                                                        "value": `${Math.round(200000 / body.data[0].lastUsdPrice * 100) / 100} GRLC`,
                                                        "inline": true
                                                    },
                                                    {
                                                        "name": "Want moar stats?",
                                                        "value": "Send us some suggestions on what you'd like to see!"
                                                    },
                                                    {
                                                        "name": "Analitic report of the current stats",
                                                        "value": "**HODL** recommended"
                                                    }
                                                ]
                                            }
                                        });
                                    } catch (error) {
                                        console.log("Failed to send message for: " + cmd + "\n" + error);
                                    }
                                }
                            });
                        }
                    });
                } catch (error) {
                    console.log("Failed to pull data from https://explorer.grlc-bakery.fun/ext/summary\n" + error);
                }
                break;

        }
    }
});

if (config.options.shouldGreetUser) {
    bot.on('guildMemberAdd', member => {
        try {
            const channel = member.guild.channels.find('name', config.options.introductionChannel);
            if (!channel) return;
            var introMessage = `Welcome to the server, ${member} \nThe bot has a few commands, use !help to get a list of commands\n`;
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
                    var hashRate = HashrateFromString(worker.hashrateString);
                    if (hashRate > config.stats.highestIndividualHashRate) {
                        config.stats.highestIndividualHashRate = hashRate;
                        worker.address = key;
                        config.stats.highestIndividualWorker = worker;
                        needsSave = true;
                    }
                }
            }

            var blockData = garlicoinPool.blocks;
            var blockCount = blockData.pending + blockData.confirmed;
            if (blockCount > config.block.total) {
                try {
                    console.log("Found a block " + new Date(Date.now()));
                    const channel = bot.channels.find('name', config.options.shoutChannel);
                    if (!channel) return;
                    channel.send(`@here Wipe your salty tears! Garlic has been served. Total: ${blockCount}`);

                    if (Date.now() - config.block.last < config.stats.fastestBlocktime) {
                        config.stats.fastestBlocktime = Date.now() - config.block.last;
                        var time = new Date(Date.now() - config.block.last);
                        config.stats.fastestBlocktimeString = "";
                        var hours = time.getHours();
                        if (hours > 0)
                            config.stats.fastestBlocktimeString += `${hours} hours `;

                        var mins = time.getMinutes();
                        if (mins > 0)
                            config.stats.fastestBlocktimeString += `${mins} minutes `;

                        if (config.stats.fastestBlocktimeString != "")
                            config.stats.fastestBlocktimeString += "and ";

                        var secs = time.getSeconds();
                        if (secs > 0)
                            config.stats.fastestBlocktimeString += `${secs} seconds`;

                        needsSave = true;
                    }

                    config.block.total = blockCount;
                    config.block.last = Date.now();
                    needsSave = true;
                } catch (error) {
                    console.log("Did you set the shoutChannel in the config file, and is the channel existant\n" + error)
                }
            } else {
                if (blockCount < config.block.total) {
                    try {
                        console.log("Kicked a block " + new Date(Date.now()));
                        const channel = bot.channels.find('name', config.options.shoutChannel);
                        if (!channel) return;
                        channel.send(`The previous block was not able to be confirmed. Total: ${blockCount}`);

                        config.block.total = blockCount;
                        needsSave = true;
                    } catch (error) {
                        console.log("Did you set the shoutChannel in the config file, and is the channel existant\n" + error)
                    }
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
var UpdateData = function() {
    request({ url: "https://explorer.grlc-bakery.fun/ext/summary", json: true }, function(error, response, body) {
        if (error) console.log("Error occured while poking: https://explorer.grlc-bakery.fun/ext/summary\n" + error);
        else {
            request({ url: config.options.poolAPIStats, json: true }, function(error, response, twobody) {
                if (error) console.log(error);
                else {
                    var needsSave = false;

                    var garlicoinPool = twobody.pools.garlicoin;

                    var data = {
                        "poolRate": HashrateFromString(garlicoinPool.hashrateString),
                        "workerCount": garlicoinPool.workerCount,
                        "blocksMined": config.block.total,
                        "UsdPrice": body.data[0].lastUsdPrice,
                        "lastPrice": body.data[0].lastPrice,
                        "difficulty": body.data[0].difficulty,
                        "blockCount": body.data[0].blockcount,
                        "networkRate": body.data[0].hashrate
                    }

                    lastKnownData[Math.floor(Date.now() / 1000 / 60)] = data;

                    var keys = Object.keys(lastKnownData);
                    if (keys.length > 60) {
                        var smallestKey = Date.now();
                        for (var key in keys) {
                            var currkey = keys[key];
                            if (currkey < smallestKey)
                                smallestKey = currkey;
                        }
                        delete lastKnownData[smallestKey];
                    }
                }
            });
        }
    });
}

var StringDifference = function(a, b) {
    var c = b - a;
    c = Math.round(c * 100) / 100;
    if (c > 0)
        return "+" + c;
    if (c < 0)
        return c;
    if (c == 0)
        return "—";
}

var HashrateFromString = function(string) {
    var hashRate = parseFloat(string.slice(0, -2));
    if (string.indexOf("M") != -1)
        hashRate *= 1000;
    if (string.indexOf("G") != -1)
        hashRate *= 1000;
    return hashRate;
}