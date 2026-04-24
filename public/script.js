let guildId = null;
let canaisCache = [];

const ids = {
  entrada: document.getElementById("entrada"),
  saida: document.getElementById("saida"),
  logs: document.getElementById("logs"),
  mensagemEntrada: document.getElementById("mensagemEntrada"),
  mensagemSaida: document.getElementById("mensagemSaida")
};

async function api(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.location.href = "/login.html";
    return null;
  }
  return await res.json();
}

async function carregarUsuario() {
  const user = await api("/api/me");
  if (!user) return;

  document.getElementById("username").innerText = user.username;

  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  document.getElementById("avatar").src = avatar;
}

async function carregarStatus() {
  const status = await api("/api/status");
  if (!status) return;

  document.getElementById("botStatus").innerText = status.bot === "online" ? "Online" : "Offline";
}

async function carregarGuilds() {
  const guilds = await api("/api/guilds");
  const select = document.getElementById("guilds");
  select.innerHTML = "";

  if (!guilds || guilds.length === 0) {
    select.innerHTML = `<option>Nenhum servidor disponível</option>`;
    return;
  }

  guilds.forEach(g => {
    const option = document.createElement("option");
    option.value = g.id;
    option.textContent = g.name;
    select.appendChild(option);
  });

  guildId = guilds[0].id;
  select.value = guildId;

  await carregarCanais();
  await carregarConfig();

  select.onchange = async () => {
    guildId = select.value;
    await carregarCanais();
    await carregarConfig();
  };
}

async function carregarCanais() {
  if (!guildId) return;

  const canais = await api(`/api/canais/${guildId}`);
  canaisCache = canais || [];

  preencherSelect(ids.entrada, canaisCache);
  preencherSelect(ids.saida, canaisCache);
  preencherSelect(ids.logs, canaisCache);
}

function preencherSelect(select, canais) {
  select.innerHTML = `<option value="">Não configurado</option>`;

  canais.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = `# ${c.nome}`;
    select.appendChild(option);
  });
}

async function carregarConfig() {
  if (!guildId) return;

  const config = await api(`/api/config/${guildId}`) || {};

  ids.entrada.value = config.entrada || "";
  ids.saida.value = config.saida || "";
  ids.logs.value = config.logs || "";
  ids.mensagemEntrada.value = config.mensagemEntrada || "Bem-vindo(a), {user}! Você entrou em **{server}**.";
  ids.mensagemSaida.value = config.mensagemSaida || "{userTag} saiu do servidor.";

  const logsAtivos = config.logsAtivos || {};
  document.getElementById("logEntrada").checked = logsAtivos.entrada ?? true;
  document.getElementById("logSaida").checked = logsAtivos.saida ?? true;
  document.getElementById("logMensagemApagada").checked = logsAtivos.mensagemApagada ?? true;
  document.getElementById("logMensagemEditada").checked = logsAtivos.mensagemEditada ?? true;
  document.getElementById("logCargoCriado").checked = logsAtivos.cargoCriado ?? true;
  document.getElementById("logCargoDeletado").checked = logsAtivos.cargoDeletado ?? true;
  document.getElementById("logCanalCriado").checked = logsAtivos.canalCriado ?? true;
  document.getElementById("logCanalDeletado").checked = logsAtivos.canalDeletado ?? true;

  atualizarStatusUI(config);
  atualizarPreview();
}

function getNomeCanal(id) {
  const canal = canaisCache.find(c => c.id === id);
  return canal ? `# ${canal.nome}` : "Não configurado";
}

function atualizarStatusUI(config) {
  document.getElementById("entradaStatus").innerText = getNomeCanal(config.entrada);
  document.getElementById("saidaStatus").innerText = getNomeCanal(config.saida);
  document.getElementById("logsStatus").innerText = getNomeCanal(config.logs);
}

function coletarLogsAtivos() {
  return {
    entrada: document.getElementById("logEntrada").checked,
    saida: document.getElementById("logSaida").checked,
    mensagemApagada: document.getElementById("logMensagemApagada").checked,
    mensagemEditada: document.getElementById("logMensagemEditada").checked,
    cargoCriado: document.getElementById("logCargoCriado").checked,
    cargoDeletado: document.getElementById("logCargoDeletado").checked,
    canalCriado: document.getElementById("logCanalCriado").checked,
    canalDeletado: document.getElementById("logCanalDeletado").checked
  };
}

async function salvar() {
  if (!guildId) return;

  const btn = document.querySelector(".btn-primary");
  btn.disabled = true;
  btn.innerText = "Salvando...";

  const data = {
    entrada: ids.entrada.value,
    saida: ids.saida.value,
    logs: ids.logs.value,
    mensagemEntrada: ids.mensagemEntrada.value,
    mensagemSaida: ids.mensagemSaida.value,
    logsAtivos: coletarLogsAtivos()
  };

  const result = await api(`/api/config/${guildId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (result?.ok) {
    atualizarStatusUI(data);
    document.getElementById("status").innerText = "✔ Configurações salvas!";
    setTimeout(() => document.getElementById("status").innerText = "", 3000);
  }

  btn.disabled = false;
  btn.innerText = "Salvar configurações";
}

function atualizarPreview() {
  const texto = ids.mensagemEntrada.value
    .replaceAll("{user}", "@usuário")
    .replaceAll("{userTag}", "Usuario#0000")
    .replaceAll("{userId}", "123456789")
    .replaceAll("{server}", "Seu Servidor");

  document.getElementById("previewText").innerText = texto;
}

ids.mensagemEntrada.addEventListener("input", atualizarPreview);

carregarUsuario();
carregarStatus();
carregarGuilds();

function irPara(id, elemento) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");
  });

  elemento.classList.add("active");
}