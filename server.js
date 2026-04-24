require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const axios = require("axios");
const mongoose = require("mongoose");
const path = require("path");
const GuildConfig = require("./database/schema");
const client = require("./bot");

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_API = "https://discord.com/api/v10";

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB conectado"))
  .catch(err => console.log("🔴 Erro MongoDB:", err.message));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "botsystem_secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ erro: "Não autenticado" });
  }
  next();
}

function userCanManageGuild(guild) {
  const permissions = BigInt(guild.permissions || "0");
  const ADMINISTRATOR = 0x8n;
  const MANAGE_GUILD = 0x20n;
  return (permissions & ADMINISTRATOR) === ADMINISTRATOR || (permissions & MANAGE_GUILD) === MANAGE_GUILD;
}

app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard.html");
  res.redirect("/login.html");
});

app.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds"
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.redirect("/login.html");

    const tokenResponse = await axios.post(`${DISCORD_API}/oauth2/token`, new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI
    }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const guildsResponse = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    req.session.user = userResponse.data;
    req.session.guilds = guildsResponse.data;

    res.redirect("/dashboard.html");
  } catch (err) {
    console.log("Erro OAuth:", err.response?.data || err.message);
    res.redirect("/login.html?erro=oauth");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.session.user);
});

app.get("/api/guilds", requireAuth, (req, res) => {
  const guilds = req.session.guilds || [];

  const available = guilds
    .filter(g => userCanManageGuild(g))
    .filter(g => client.guilds.cache.has(g.id))
    .map(g => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      owner: g.owner
    }));

  res.json(available);
});

app.get("/api/canais/:guildId", requireAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ erro: "Bot não está nesse servidor." });

  const userGuild = (req.session.guilds || []).find(g => g.id === req.params.guildId);
  if (!userGuild || !userCanManageGuild(userGuild)) {
    return res.status(403).json({ erro: "Sem permissão para gerenciar esse servidor." });
  }

  const canais = guild.channels.cache
    .filter(c => c.type === 0)
    .map(c => ({ id: c.id, nome: c.name }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  res.json(canais);
});

app.get("/api/config/:guildId", requireAuth, async (req, res) => {
  const userGuild = (req.session.guilds || []).find(g => g.id === req.params.guildId);
  if (!userGuild || !userCanManageGuild(userGuild)) {
    return res.status(403).json({ erro: "Sem permissão." });
  }

  const config = await GuildConfig.findOne({ guildId: req.params.guildId });
  res.json(config || {});
});

app.post("/api/config/:guildId", requireAuth, async (req, res) => {
  const userGuild = (req.session.guilds || []).find(g => g.id === req.params.guildId);
  if (!userGuild || !userCanManageGuild(userGuild)) {
    return res.status(403).json({ erro: "Sem permissão." });
  }

  const {
    entrada,
    saida,
    logs,
    mensagemEntrada,
    mensagemSaida,
    logsAtivos
  } = req.body;

  const config = await GuildConfig.findOneAndUpdate(
    { guildId: req.params.guildId },
    {
      entrada: entrada || "",
      saida: saida || "",
      logs: logs || "",
      mensagemEntrada,
      mensagemSaida,
      logsAtivos
    },
    { upsert: true, new: true }
  );

  res.json({ ok: true, config });
});

app.get("/api/status", requireAuth, (req, res) => {
  res.json({
    bot: client.user ? "online" : "offline",
    servidores: client.guilds.cache.size,
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Painel rodando em http://localhost:${PORT}`);
});

client.login(process.env.TOKEN);
