let guildId = null;

// ELEMENTOS
const entrada = document.getElementById("entrada");
const saida = document.getElementById("saida");
const logs = document.getElementById("logs");
const cargoEntrada = document.getElementById("cargoEntrada");
const mensagemEntrada = document.getElementById("mensagemEntrada");
const mensagemSaida = document.getElementById("mensagemSaida");

// 🔐 API helper
async function api(url, options = {}) {
  const res = await fetch(url, options);

  if (res.status === 401) {
    window.location.href = "/login.html";
    return null;
  }

  return res.json();
}

// 🔽 CARREGAR SERVIDORES
async function carregarGuilds() {
  const guilds = await api("/api/guilds");
  const select = document.getElementById("guilds");

  select.innerHTML = "";

  guilds.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    select.appendChild(opt);
  });

  guildId = guilds[0]?.id;
  select.value = guildId;

  await carregarTudo();

  select.onchange = async () => {
    guildId = select.value;
    await carregarTudo();
  };
}

// 🔄 CARREGAR TUDO
async function carregarTudo() {
  await carregarCanais();
  await carregarCargos();
  await carregarConfig();
}

// 📺 CANAIS
async function carregarCanais() {
  const canais = await api(`/api/canais/${guildId}`);

  preencherSelect(entrada, canais);
  preencherSelect(saida, canais);
  preencherSelect(logs, canais);
}

// 👮 CARGOS
async function carregarCargos() {
  const cargos = await api(`/api/cargos/${guildId}`);

  cargoEntrada.innerHTML = `<option value="">Nenhum</option>`;

  cargos.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nome;
    cargoEntrada.appendChild(opt);
  });
}

// 📌 PREENCHER SELECT
function preencherSelect(select, lista) {
  select.innerHTML = `<option value="">Nenhum</option>`;

  lista.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `# ${item.nome}`;
    select.appendChild(opt);
  });
}

// ⚙ CARREGAR CONFIG
async function carregarConfig() {
  const config = await api(`/api/config/${guildId}`) || {};

  entrada.value = config.entrada || "";
  saida.value = config.saida || "";
  logs.value = config.logs || "";
  cargoEntrada.value = config.cargoEntrada || "";

  mensagemEntrada.value = config.mensagemEntrada || "Bem-vindo {user}";
  mensagemSaida.value = config.mensagemSaida || "{userTag} saiu";

  atualizarStatus(config);
  atualizarPreview();
}

// 🔄 STATUS
function atualizarStatus(config) {
  document.getElementById("entradaStatus").innerText = config.entrada ? "Configurado" : "Não configurado";
  document.getElementById("saidaStatus").innerText = config.saida ? "Configurado" : "Não configurado";
  document.getElementById("logsStatus").innerText = config.logs ? "Configurado" : "Não configurado";
  document.getElementById("cargoStatus").innerText = config.cargoEntrada ? "Configurado" : "Não configurado";
}

// 💾 SALVAR
async function salvar() {
  const btn = document.querySelector(".btn-primary");

  btn.innerText = "Salvando...";
  btn.disabled = true;

  await api(`/api/config/${guildId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      entrada: entrada.value,
      saida: saida.value,
      logs: logs.value,
      cargoEntrada: cargoEntrada.value,
      mensagemEntrada: mensagemEntrada.value,
      mensagemSaida: mensagemSaida.value
    })
  });

  document.getElementById("status").innerText = "✔ Salvo com sucesso";

  setTimeout(() => {
    document.getElementById("status").innerText = "";
  }, 3000);

  btn.innerText = "Salvar configurações";
  btn.disabled = false;
}

// 🎨 PREVIEW
function atualizarPreview() {
  const texto = mensagemEntrada.value
    .replace("{user}", "@usuario")
    .replace("{userTag}", "usuario#0000")
    .replace("{server}", "Servidor");

  document.getElementById("previewText").innerText = texto;
}

mensagemEntrada.addEventListener("input", atualizarPreview);

// 🔽 MENU
function irPara(id, el) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth"
  });

  document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
  el.classList.add("active");
}

// 🚀 START
carregarGuilds();