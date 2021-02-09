require('dotenv').config();
const Discord = require('discord.js');
const mongoose = require('mongoose');
const { prefix } = require('./config.json');
const fs = require('fs');

mongoose.connect(process.env.MONGO_URL, {authSource: 'admin', useNewUrlParser: true, useUnifiedTopology: true})
    .catch(console.error);

const teamSchema = {"": String, leader: String, members: Array};
const guildSchema = new mongoose.Schema({id: String, mainChannel: String, embed: Array, embedId: String, flags: Array, teams: teamSchema,}, { minimize: false });
const userSchema = new mongoose.Schema({id: String, leaderOf: Array, guilds: Array});
const Guild = mongoose.model("Guild", guildSchema)
const User = mongoose.model("User", userSchema);


const bot = new Discord.Client();
bot.commands = new Discord.Collection();
bot.data = {};

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
  bot.user.setActivity("you say !team", { type: 'WATCHING'});
  bot.user.setPresence({activity: {name: 'you say !team',type: 'WATCHING', url: 'https://www.solo.to/jimmyboy'}, status: 'idle'})
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for(const file of commandFiles){
        const command = require(`./commands/${file}`);
        
        bot.commands.set(command.name,command);
    }
});

bot.warn = function(msg){

    console.log(`No main channel in "${msg.guild.name}" : ${msg.guild.id}`)
    return msg.channel.send(new Discord.MessageEmbed({color: 0x6441a4,fields: [{name: 'Not Ready for that yet!', value:`I don't have a main channel yet! If you're an admin, please type **!teaminit** for me to take ov- *cough* -instantiate your server in my database!`},
        {name: '*Warning*', value:`*This will create a new category called "Teams" with *`}],}) );
}

bot.on('message', async (msg) => {
    if(msg.author.bot || !msg.guild) return;
// If it exists, find the guild in database and set the bot's data to it. Otherwise, create a new guild.
    if(!bot.data[msg.guild.id]){
        await Guild.findOne({id: msg.guild.id}, (err, doc) => {
            var g = doc;
            if(!doc){
                g = new Guild({id: msg.guild.id, mainChannel: '', embed: [], embedId: '', teams: {}});
                g.teams = {};
                g.save();
            }
            bot.data[msg.guild.id] = g;
        }).catch(console.error);
    }
    
    //Boolean constants to help format checks
    var isInit = bot.data[msg.guild.id].mainChannel !== '';
    var inMain = bot.data[msg.guild.id].mainChannel === msg.channel.id;
    
    // Is this message even a command??! if not, ignore unless it's in main channel. Otherwise Delete it.
    if(!msg.content.startsWith(prefix)){
        if(inMain) {return bot.delMessage(msg);}
        else return;
    }
    
    const args = msg.content.trim().split(/ +/);
    const command = args.shift().toLowerCase().replace("!","");
    
    // Associate guild with the user in the database, creates a user if can't find one.
    User.findOne({id: msg.author.id}, (err,user) => {
        if(user){
            var hasIt = user.guilds.find(val => val.match(msg.guild.id)) ? true: false;
            if(hasIt){
                user.guilds.push(msg.guild.id);
                user.save();   
            }
        }
        else{
            user = new User({id: msg.author.id, leaderOf: [], guilds: [msg.guild.id]});
            user.save();
            console.log("Created new User: " + user.id);
        }
    })
    
    const cmd = bot.commands.get(command) || bot.commands.find(comd => comd.aliases && comd.aliases.includes(command));
    if (!cmd || !msg.guild.available) {bot.delMessage(); return;}
    
    console.info(`Command Called: ${command}`);
    try{
        if(bot.data[msg.guild.id].mainChannel !== '' || cmd.name.match(/teaminit|teamhere|help/)){
            cmd.execute(msg,args).then(val => {
                bot.buildAndSendEmbed(msg);
                bot.saveData(msg, 'guild');
            }).catch(err => {
                console.error(err);
                msg.reply("Error: " + err).then(mes => mes.delete({timeout: 5000,reason:"Error message cleanup."}));
            });
            
        }else return bot.warn(msg);
    }
    catch(err){
        console.error(err);
        msg.reply("I had trouble doing that... Oopsie! :poop:");
    }
    if(isInit && inMain)
        bot.delMessage(msg);
});

/**
 * 
 * @param {Discord.Message} msg 
 * @param {String} type 
 */
bot.saveData = (msg, type) => {
    var id = msg.guild.id;
    var typeArg = type.toLowerCase().split(" ");
    console.log(typeArg[0]);
    switch(typeArg[0]){
        case 'guild': 
            bot.data[msg.guild.id].save().catch(err => console.error(err));
        break;
        case 'user': 
            User.findOneAndUpdate({id: id}, {id: msg.author.id, '$push': {leaderOf: ((typeArg[1] === 'create')?data.id: null)}, '$push': {teams: data.id}}, {useFindAndModify: false});
        break;
        case 'remTeam':
            
            Guild.updateOne({id: id.guild}, {teams: {'$unset': `${data.id}`}}).exec();
            User.find({id: msg.author.id}, (err, user) => {
                if(!err){
                    
                }
            })
        
        break;
    }
}

/**
 * 
 * @param {Discord.Message} msg 
 */
bot.buildAndSendEmbed = function(msg) {
    if(bot.data[msg.guild.id].embedId !== ''){msg.channel.messages.delete(bot.data[msg.guild.id].embedId);}
    var embedArr = bot.data[msg.guild.id].embed;
    var teams = bot.data[msg.guild.id].teams;
    
    if(!embedArr[0]){
        embedArr[0] = {
            color: 0x6441a4,
            title: 'Teams List',
            author: {
                name: msg.guild.name,
                icon_url: bot.user.avatarURL({dynamic: false, size: 128}),
            },
            description: "Current Teams in " + msg.guild.name + ":",
            thumbnail: {url: 'attachment://icon.png',},
            fields: [],
            timestamp: new Date(),
            footer: {
                text: "Don't let your teams be teams ~ Shia Lebeouf",
            },
        };
    }
    if(teams && Object.keys(teams).length >0){
        embedArr[0].description = `Current ${Object.keys(teams).length} Teams in ` + msg.guild.name + ":"
        Object.values(teams).forEach((r, index) => {
            if(r == 1) return;
            var teamName = r.roleName.slice(0,1).toUpperCase() + r.roleName.slice(1);
            if(!embedArr[0].fields.find((val) => val.name === teamName)){
                var memberStr = [];
                r.members.forEach((id) => memberStr.push(msg.guild.members.fetch(id).displayName))
                embedArr[0].fields.push({
                    name: teamName, 
                    value: `Type **!team join ${r.roleName}** to join!\n**Members:**\n${memberStr.join("\n")}`,
                    inline: true,
                });
            }
        });
    } else{
        embedArr[0].description = 'No teams yet in ' + msg.guild.name + "!\nDo **!team <add|create> <Team Name>**";
    }
    var mainChan = msg.guild.channels.resolve(bot.data[msg.guild.id].mainChannel)
    if(mainChan)
        mainChan.send({embed: embedArr[0]}).then(res => {bot.data[msg.guild.id].embedId= res.id});
}

/**
 * 
 * @param {Discord.Message} msg 
 */
bot.delMessage = async function(msg){
    msg.delete({timeout:5000, reason:"Command - This is normal behaviour."});
}

//bot.on('debug', console.log).on('warn', console.log);

mongoose.connection.once('connected', () => {
    bot.login(process.env.BOT_TOKEN);
})
