const Discord = require("discord.js");


const newPermMember = Discord.Permissions.DEFAULT;
const newPermNonMember = Discord.Permissions.ALL;
// if(subCom.match(/add|create/)){
    
// }
// else if(subCom.match(/join/)){
//     bot.data[msg.guild.id].teams[data.roleId].members.push(msg.author.id);
// }
/**
 * 
 * @param {Discord.Message} msg 
 * @param {string[]} args 
 */
async function addTeam(msg,args){
    var guild = msg.guild;
    
    var teamCategory = msg.channel.parent || null;
    args.shift();
    var teamName = args.join(" ");
    if(guild.client.data[guild.id].teams){
        var guildRoles = guild.client.data[guild.id].teams;
        Object.keys(guildRoles).forEach((role)=>{
            if(guildRoles[role].roleName === teamName){
                return Promise.reject('That team already exists!');
            }
            if(guildRoles[role].leader === msg.author.id){
                return Promise.reject('You can only have one team!')
            }
        });
    }
    var teamRole = await guild.roles.create({data: {name: teamName, color: 'RANDOM', permissions: Discord.Permissions.DEFAULT, mentionable: true}, reason: msg.author.username + ' created a team.'})
    .catch(err => console.error);
    var permissionOverwrites = [{id: teamRole, allow:newPermMember,type: 'role'},{id:guild.roles.everyone, deny: newPermNonMember, type:'role'}];
    await guild.channels.create(args.join("-").toLowerCase(),{type: 'text', topic: 'Planning', parent: teamCategory,permissionOverwrites: permissionOverwrites});
    await guild.channels.create(teamName + " VC",{type: 'voice', topic: 'Planning', parent: teamCategory,permissionOverwrites: permissionOverwrites});
    guild.member(msg.author).roles.add(teamRole);
    msg.client.data[msg.guild.id].teams[teamRole.roleId] = {roleName: teamRole.name, roleId: teamRole.id, leader: msg.author.id, members:[msg.author.id]};
    return Promise.resolve({msg: 'Success!'});
}
/**
 * 
 * @param {Discord.Message} msg 
 * @param {string[]} args 
 */
async function joinTeam(msg, args){
    args.shift();
    var joinRole = args.join(" ");
    var guildRoles = msg.client.data[msg.guild.id].teams;
    Object.keys(guildRoles).forEach(id => {
        if(guildRoles[id].roleName === joinRole){
            if(guildRoles[id].members.indexOf(msg.author.id) !== -1) return Promise.reject("You're a part of this team already.")
            msg.guild.member(msg.author).roles.add(id);
            return Promise.resolve({roleId: id});
        }
    })
    return Promise.reject("Could not find team. :cry:");
}
const colors = ['DEFAULT','WHITE','AQUA','GREEN', 'BLUE', 'YELLOW', 'PURPLE', 'LUMINOUS_VIVID_PINK', 'GOLD', 'ORANGE', 'RED', 'GREY', 'DARKER_GREY',
'NAVY', 'DARK_AQUA', 'DARK_GREEN', 'DARK_BLUE', 'DARK_PURPLE', 'DARK_VIVID_PINK', 'DARK_GOLD', 'DARK_ORANGE', 'DARK_RED', 'DARK_GREY', 'LIGHT_GREY',
'DARK_NAVY', 'BLURPLE', 'GREYPLE', 'DARK_BUT_NOT_BLACK', 'NOT_QUITE_BLACK'];

module.exports = {
    name: 'team',
    description: 'Create/remove a team',
    aliases: [],
    usage: '[add/create|join] [team name]',
    cooldown: 5,
    /**
     * 
     * @param {Discord.Message} msg 
     * @param {string[]} args 
     */
    async execute(msg, args){
        const errString = 'Invalid Command: Please format as **!team <add|create|join> <Team Name>**';
        if((args.length < 2)) { return Promise.reject(errString);}
        if( !args[0].match(/add|create|join/)) { return Promise.reject(errString); }
        switch(args[0]){
            case 'add': return Promise.resolve(await addTeam(msg,args));
            case 'create': return Promise.resolve(await addTeam(msg,args));
            case 'join': return Promise.resolve(await joinTeam(msg,args));
        }
    },
    colors,
    joinTeam,
    addTeam,
    newPermMember,
    newPermNonMember
}