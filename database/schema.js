const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  guildId: String,
  entrada: String,
  saida: String,
  logs: String,
  cargoEntrada: String,

  mensagemEntrada: {
    type: String,
    default: "Bem-vindo {user} ao servidor {server}"
  },

  mensagemSaida: {
    type: String,
    default: "{userTag} saiu do servidor"
  }
});

module.exports = mongoose.model("GuildConfig", schema);
