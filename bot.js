const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const GuildConfig = require("./database/schema");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});

function formatar(msg, member, guild) {
  return msg
    .replace("{user}", `<@${member.id}>`)
    .replace("{userTag}", member.user.tag)
    .replace("{server}", guild.name);
}

client.on("guildMemberAdd", async member => {
  const config = await GuildConfig.findOne({ guildId: member.guild.id });
  if (!config) return;

  // 👮 CARGO AUTOMÁTICO
  if (config.cargoEntrada) {
    const cargo = member.guild.roles.cache.get(config.cargoEntrada);
    if (cargo) {
      await member.roles.add(cargo).catch(() => {});
    }
  }

  if (config.entrada) {
    const canal = member.guild.channels.cache.get(config.entrada);

    const embed = new EmbedBuilder()
      .setColor("#22c55e")
      .setTitle("📥 Membro entrou")
      .setDescription(formatar(config.mensagemEntrada, member, member.guild))
      .setThumbnail(member.user.displayAvatarURL())
      .setImage("https://i.imgur.com/abc123.png")
      .setTimestamp();

    canal.send({ embeds: [embed] });
  }
});

client.on("guildMemberRemove", async member => {
  const config = await GuildConfig.findOne({ guildId: member.guild.id });
  if (!config) return;

  if (config.saida) {
    const canal = member.guild.channels.cache.get(config.saida);

    const embed = new EmbedBuilder()
      .setColor("#ef4444")
      .setTitle("📤 Membro saiu")
      .setDescription(formatar(config.mensagemSaida, member, member.guild))
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    canal.send({ embeds: [embed] });
  }
});

module.exports = client;