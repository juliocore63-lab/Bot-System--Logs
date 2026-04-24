const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require("discord.js");
const GuildConfig = require("./database/schema");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

async function getConfig(guildId) {
  return await GuildConfig.findOne({ guildId });
}

function formatar(texto, memberOrUser, guild) {
  const user = memberOrUser.user || memberOrUser;
  return texto
    .replaceAll("{user}", `<@${user.id}>`)
    .replaceAll("{userTag}", user.tag || user.username)
    .replaceAll("{userId}", user.id)
    .replaceAll("{server}", guild.name);
}

async function enviarEmbed(canal, embed) {
  if (!canal) return;
  try {
    await canal.send({ embeds: [embed] });
  } catch (err) {
    console.log("Erro ao enviar mensagem:", err.message);
  }
}

async function enviarLog(guild, titulo, descricao, cor = "#5865F2") {
  const config = await getConfig(guild.id);
  if (!config || !config.logs) return;

  const canal = guild.channels.cache.get(config.logs);
  if (!canal) return;

  const embed = new EmbedBuilder()
  .setColor("#22c55e")
  .setTitle("📥 Membro entrou")
  .setDescription(formatar(config.mensagemEntrada, member, member.guild))

  // 👤 FOTO DO USUÁRIO
  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))

  // 🖼️ IMAGEM GRANDE (BANNER)
  .setImage("https://media.discordapp.net/attachments/1337939319402266664/1495448842114437240/ChatGPT_Image_19_de_abr._de_2026_12_37_58.png?ex=69ec3784&is=69eae604&hm=229cb43ed41573fcad48de97353cbb9c1eadfab06e3d30997fa0b6a6efc7ae36&=&format=webp&quality=lossless&width=1376&height=917.png")

  .addFields(
    { name: "Usuário", value: member.user.tag, inline: true },
    { name: "ID", value: member.id, inline: true }
  )
  .setTimestamp();

  await enviarEmbed(canal, embed);
}

client.on("guildMemberAdd", async member => {
  const config = await getConfig(member.guild.id);
  if (!config) return;

  if (config.entrada) {
    const canalEntrada = member.guild.channels.cache.get(config.entrada);

    const embed = new EmbedBuilder()
      .setColor("#22c55e")
      .setTitle("📥 Membro entrou")
      .setDescription(formatar(config.mensagemEntrada, member, member.guild))
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Usuário", value: member.user.tag, inline: true },
        { name: "ID", value: member.id, inline: true }
      )
      .setTimestamp();

    await enviarEmbed(canalEntrada, embed);
  }

  if (config.logsAtivos?.entrada) {
    await enviarLog(member.guild, "📥 Log de entrada", `${member.user.tag} entrou no servidor.`, "#22c55e");
  }
});

client.on("guildMemberRemove", async member => {
  const config = await getConfig(member.guild.id);
  if (!config) return;

  if (config.saida) {
    const canalSaida = member.guild.channels.cache.get(config.saida);

    const embed = new EmbedBuilder()
  .setColor("#ef4444")
  .setTitle("📤 Membro saiu")
  .setDescription(formatar(config.mensagemSaida, member, member.guild))

  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
  .setImage("https://media.discordapp.net/attachments/1337939319402266664/1495448842114437240/ChatGPT_Image_19_de_abr._de_2026_12_37_58.png?ex=69ec3784&is=69eae604&hm=229cb43ed41573fcad48de97353cbb9c1eadfab06e3d30997fa0b6a6efc7ae36&=&format=webp&quality=lossless&width=1376&height=917.png")

  .addFields(
    { name: "Usuário", value: member.user.tag, inline: true },
    { name: "ID", value: member.id, inline: true }
  )
  .setTimestamp();

    await enviarEmbed(canalSaida, embed);
  }

  if (config.logsAtivos?.saida) {
    await enviarLog(member.guild, "📤 Log de saída", `${member.user.tag} saiu do servidor.`, "#ef4444");
  }
});

client.on("messageDelete", async message => {
  if (!message.guild || message.author?.bot) return;

  const config = await getConfig(message.guild.id);
  if (!config?.logsAtivos?.mensagemApagada) return;

  await enviarLog(
    message.guild,
    "🗑️ Mensagem apagada",
    `**Autor:** ${message.author.tag}\n**Canal:** ${message.channel}\n**Conteúdo:** ${message.content || "Sem conteúdo ou não carregado."}`,
    "#f97316"
  );
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (!oldMessage.guild || oldMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const config = await getConfig(oldMessage.guild.id);
  if (!config?.logsAtivos?.mensagemEditada) return;

  await enviarLog(
    oldMessage.guild,
    "✏️ Mensagem editada",
    `**Autor:** ${oldMessage.author.tag}\n**Canal:** ${oldMessage.channel}\n\n**Antes:** ${oldMessage.content || "Sem conteúdo"}\n**Depois:** ${newMessage.content || "Sem conteúdo"}`,
    "#eab308"
  );
});

client.on("roleCreate", async role => {
  const config = await getConfig(role.guild.id);
  if (!config?.logsAtivos?.cargoCriado) return;
  await enviarLog(role.guild, "🟢 Cargo criado", `O cargo **${role.name}** foi criado.`, "#22c55e");
});

client.on("roleDelete", async role => {
  const config = await getConfig(role.guild.id);
  if (!config?.logsAtivos?.cargoDeletado) return;
  await enviarLog(role.guild, "🔴 Cargo deletado", `O cargo **${role.name}** foi deletado.`, "#ef4444");
});

client.on("channelCreate", async channel => {
  if (!channel.guild) return;
  const config = await getConfig(channel.guild.id);
  if (!config?.logsAtivos?.canalCriado) return;
  await enviarLog(channel.guild, "🟢 Canal criado", `O canal **${channel.name}** foi criado.`, "#22c55e");
});

client.on("channelDelete", async channel => {
  if (!channel.guild) return;
  const config = await getConfig(channel.guild.id);
  if (!config?.logsAtivos?.canalDeletado) return;
  await enviarLog(channel.guild, "🔴 Canal deletado", `O canal **${channel.name}** foi deletado.`, "#ef4444");
});

module.exports = client;
