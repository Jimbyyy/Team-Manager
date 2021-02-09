module.exports = {
    name: 'teaminit',
    description: 'Initialise the bot\'s workspace. This will create a new category named "Teams" with a channel to send commands in.',
    aliases: ['teamhere'],
    usage: 'optional: [noclear]',
    cooldown: 5,
    /**
     * 
     * @param {Discord.Message} msg 
     * @param {string[]} args 
     */
    async execute(msg, args){
        const makeChan = async (channel) => {
            return msg.guild.channels.create('create-teams-here', {type:'text', parent: channel, topic: 'Create/Join teams here!', reason: '!init called'});
        };
        
        if(msg.member.hasPermission('ADMINISTRATOR')){
            var subCom = args.length == 0 ? undefined : args.shift();
            // Check flags
            if(subCom && subCom.match("noclear")) {msg.client.data[msg.guild.id].flags.push('noclear');}
            var categor = msg.guild.channels.cache.find((val) => val.name.toLowerCase().match(/team/))
            if(!categor)
                await msg.guild.channels.create('Teams',{type:'category', reason: '!init called'}).then(async (catChannel) => {
                    var mainChan = await makeChan(catChannel);
                    msg.client.data[msg.guild.id].mainChannel = mainChan.id;
                    
                });
            else{
                var mainChan = await makeChan(categor);
                    msg.client.data[msg.guild.id].mainChannel = mainChan.id;
            }
            return Promise.resolve();
        }
        else{
            return Promise.reject("You do not have permissions to execute this command! Please get an Administrator to perform this!");
        }
    },
}