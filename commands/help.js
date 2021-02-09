const { prefix } = require('../config.json');
const Discord = require('discord.js');
module.exports = {
    name: 'help',
    description: 'Initialise the bot\'s workspace. This will create a new category named "Teams" with a channel to send commands in.',
    aliases: ['commands'],
    usage: '[command name]',
    cooldown: 5,
    /**
     * 
     * @param {Discord.Message} message 
     * @param {string[]} args 
     */
    async execute(message, args){
        const data = new Discord.MessageEmbed()
        .setColor('')
        .setTitle('Team Manager Help')
        .setURL('https://developer.jimmyboy.dev/team-manager-bot')
        .setAuthor('Team Manager', 'https://cdn.discordapp.com/avatars/801471878614745139/31488827f2cb418c7bcd3d131b4a76d7.webp?size=128', 'https://www.jimmyboy.dev')
        .setDescription('My current list of commands!')
        .setThumbnail('');

        if (!args.length) {
        	message.client.commands.map((command) => {
        	   data.addField(
        	        `**${prefix}${command.name}**`, `${command.aliases.length == 0 ? "": "**Aliases:** " + command.aliases.map((val) => prefix + val + '; ')}\n${command.description}\n**Usage:** ${prefix}${command.name} ${command.usage}`
        	   )
        	});
            data.setFooter(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);
            message.author.send(data)
            	.then(() => {
            		if (message.channel.type === 'dm') return;
            		message.reply('I\'ve sent you a DM with all my commands!');
            	})
            	.catch(error => {
            		console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
            		message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
            	});
            return Promise.resolve()
        }
        const name = args[0].toLowerCase();
        const command = message.client.commands.get(name) || message.client.commands.find(c => c.aliases && c.aliases.includes(name));
        
        if (!command) {
            return message.reply('that\'s not a valid command!');
        }
        
        data.push(`**Name:** ${command.name}`);
        
        if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
        if (command.description) data.push(`**Description:** ${command.description}`);
        if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
        
        message.channel.send(data, { split: true });
    },
}