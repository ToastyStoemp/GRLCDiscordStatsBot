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
                    msg.channel.send({
                      "embed": {
                        "description": "Bot made for **The Salt Mine** by *ToastyStoemp* & *Rut*\nList of commands:",
                        "color": 16777215,
                        "fields": [
                          {
                            "name": "!help",
                            "value": "Shows this help message.",
                            "inline": true
                          },
                          {
                            "name": "!stats",
                            "value": "Shows interesting stats about this pool!",
                            "inline": true
                          },
                          {
                            "name": "!tip",
                            "value": "Shows the address of the server and bot devs, feel free to send us something :smile:"
                          },
                          {
                            "name": "!etaNextBlock",
                            "value": "Calculates an __estimated__ time until the next block will be mined. This is an estimate!"
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
                        "fields": [
                          {
                            "name": "Pool Backbone ( Help keep us running! )",
                            "value": "GWQC7SmUvvmkEbsNVrhBgm4hNMXxPUf3Sj"
                          },
                          {
                            "name": "Spinax ( Our Server Stylist )",
                            "value": "( Psst, we need your wallet address! )"
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
                    request({ url: "https://explorer.grlc-bakery.fun/api/getnetworkhashps", json: true }, function(error, response, body) {
                        if (error) console.log(error);
                        else {
                            var NetworkHashRate = body;
                            var PoolHashRate = lastKnownPoolHashRate;
                            var estimatedPoolGain = 24 * 60 * (60 / 40) * 50 * (PoolHashRate / NetworkHashRate);

                            var dayChance = (estimatedPoolGain / 50) * 100;

                            var timePercentage = (Date.now() - config.block.last) / (24 * 60 * 60 * 1000);
                            var currentChance = timePercentage * dayChance;
                            msg.reply(`with the current hashrate (${lastKnownPoolHashRateString}/s) compared to the global network hashrate of (${Math.round(NetworkHashRate / 1000 / 1000 / 1000 * 100) / 100}GH/s) this pool has advanced ${Math.round(currentChance * 100) / 100}% towards a potential next block solve.\n This pool has makes up for ${(PoolHashRate / NetworkHashRate * 100)}‱ in the network.\nTo learn more about the math behind this calculation use !help etaNextBlock`);
                        }
                    });
                    break;
                case "tiprandomaddress":
                    request({ url: "http://209.250.230.130/api/stats", json: true }, function(error, response, body) {
                        if (error) console.log(error);
                        else {
                            var garlicoinPool = body.pools.garlicoin
                            var obj_keys = Object.keys(garlicoinPool.workers);
                            var ran_key = obj_keys[Math.floor(Math.random() * garlicoinPool.workerCount)];
                            msg.channel.send({
                              "embed": {
                                "description": "This guy is chipping away hard at that salt, lookin' for dat tasty bread! He could use a toasty warm tip :wink:",
                                "color": 16777215,
                                "fields": [
                                  {
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
                        }
                    });
                    break;
                case "stats":
                    msg.channel.send({
                      "embed": {
                        "description": "Zero bamboozle garlic salt stats!",
                        "color": 16777215,
                        "fields": [
                          {
                            "name": "Highest Pool Hashrate:",
                            "value": `${config.stats.highestHashRate}`,
                            "inline": true
                          },
                          {
                            "name": "Highest Pool Workers:",
                            "value": `${config.stats.highestWorkercount}`,
                            "inline": true
                          },
                          {
                            "name": "Want moar stats?",
                            "value": "Send us some suggestions on what you'd like to see!"
                          }
                        ]
                      }
                    });
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
