const mongoose = require("mongoose");

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  entrada: { type: String, default: "" },
  saida: { type: String, default: "" },
  logs: { type: String, default: "" },
  mensagemEntrada: {
    type: String,
    default: "Bem-vindo(a), {user}! Você entrou em **{server}**."
  },
  mensagemSaida: {
    type: String,
    default: "{userTag} saiu do servidor."
  },
  logsAtivos: {
    entrada: { type: Boolean, default: true },
    saida: { type: Boolean, default: true },
    mensagemApagada: { type: Boolean, default: true },
    mensagemEditada: { type: Boolean, default: true },
    cargoCriado: { type: Boolean, default: true },
    cargoDeletado: { type: Boolean, default: true },
    canalCriado: { type: Boolean, default: true },
    canalDeletado: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model("GuildConfig", guildConfigSchema);
