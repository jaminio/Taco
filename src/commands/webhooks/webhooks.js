const Command = require('../../structures/Command');
const GenericPager = require('../../structures/GenericPager');
const Util = require('../../util');

module.exports = class Webhooks extends Command {
  get name() { return 'webhooks'; }

  get _options() { return {
    aliases: ['whs'],
    cooldown: 4,
    permissions: ['embed', 'webhooks', 'trelloRole']
  }; }

  async exec(message, { args, _ }) {
    const discordWebhooks = await message.channel.guild.getWebhooks();
    const webhooks = (await this.client.pg.models.get('webhook').findAll({ where: {
      guildID: message.guildID
    }}))
      .map(wh => wh.get({ plain: true }))
      .map(wh => ({
        ...wh,
        discordWebhook: discordWebhooks.find(dwh => dwh.id === wh.webhookID)
      }));

    if (!webhooks.length)
      return message.channel.createMessage(_('webhook_cmd.none'));

    const emojiFallback = Util.emojiFallback({ client: this.client, message });
    const checkEmoji = emojiFallback('632444546684551183', '☑️');
    const uncheckEmoji = emojiFallback('632444550115491910', '⬜');

    const paginator = new GenericPager(this.client, message, {
      items: webhooks,
      _, header: _('webhook_cmd.header'), itemTitle: 'words.webhook.many',
      display: (item) => {
        let result = `${item.active ? checkEmoji : uncheckEmoji} \`ID: ${item.id}\` `;
        
        if (item.discordWebhook)
          result += `${
            Util.cutoffText(Util.Escape.markdown(item.discordWebhook.name), 50)} ` + 
            `(<@${item.discordWebhook.user.id}>)`;
        else
          result += `[${_('webhook_cmd.unknown')}] (${_('words.board.one')} \`${item.modelID}\`)`;

        return result;
      }
    });

    if (args[0])
      paginator.toPage(args[0]);

    return paginator.start(message.channel.id, message.author.id);
  }

  get metadata() { return {
    category: 'categories.webhook',
  }; }
};