require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const axios = require("axios");
const GuildConfig = require("./database/schema");
const client = require("./bot");

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 Mongo conectado"))
  .catch(err => console.log("Erro Mongo:", err));

app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// 🔐 LOGIN
app.get("/login", (req, res) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=identify%20guilds`;
  res.redirect(url);
});

// 🔁 CALLBACK
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;

    const token = await axios.post("https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const user = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token.data.access_token}` }
    });

    const guilds = await axios.get("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${token.data.access_token}` }
    });

    req.session.user = user.data;
    req.session.guilds = guilds.data;

    res.redirect("/dashboard.html");

  } catch (err) {
    console.log("Erro OAuth:", err.response?.data || err.message);
    res.redirect("/login.html?erro=oauth");
  }
});

// 🔒 PROTEÇÃO
function auth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ erro: "Não logado" });
  next();
}

// 👤 USUÁRIO
app.get("/api/me", auth, (req, res) => {
  res.json(req.session.user);
});

// 🏠 SERVIDORES
app.get("/api/guilds", auth, (req, res) => {
  const guilds = req.session.guilds.filter(g =>
    client.guilds.cache.has(g.id)
  );
  res.json(guilds);
});

// 📺 CANAIS
app.get("/api/canais/:guildId", auth, (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);

  const canais = guild.channels.cache
    .filter(c => c.type === 0)
    .map(c => ({ id: c.id, nome: c.name }));

  res.json(canais);
});

// 👮 CARGOS
app.get("/api/cargos/:guildId", auth, (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);

  const cargos = guild.roles.cache
    .filter(r => r.name !== "@everyone")
    .map(r => ({ id: r.id, nome: r.name }));

  res.json(cargos);
});

// ⚙ CONFIG
app.get("/api/config/:guildId", auth, async (req, res) => {
  const config = await GuildConfig.findOne({ guildId: req.params.guildId });
  res.json(config || {});
});

app.post("/api/config/:guildId", auth, async (req, res) => {
  const { entrada, saida, logs, cargoEntrada, mensagemEntrada, mensagemSaida } = req.body;

  await GuildConfig.findOneAndUpdate(
    { guildId: req.params.guildId },
    {
      entrada,
      saida,
      logs,
      cargoEntrada,
      mensagemEntrada,
      mensagemSaida
    },
    { upsert: true }
  );

  res.json({ ok: true });
});

// 🚀 START
app.listen(PORT, () => {
  console.log(`🌐 Painel rodando na porta ${PORT}`);
});

client.login(process.env.TOKEN);