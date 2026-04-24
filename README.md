# Bot'System SaaS Final

Bot Discord com painel web profissional para configurar logs de entrada, saída e auditoria.

## Funções

- Login com Discord OAuth2
- Painel multi-servidor
- Permissão apenas para administradores ou quem tem "Gerenciar Servidor"
- Canal de entrada configurável
- Canal de saída configurável
- Canal de logs configurável
- Mensagens personalizadas com variáveis
- Logs de:
  - entrada de membros
  - saída de membros
  - mensagem apagada
  - mensagem editada
  - cargo criado/deletado
  - canal criado/deletado

## Como instalar

```bash
npm install
```

Copie `.env.example` para `.env` e preencha:

```env
TOKEN=token do bot
CLIENT_ID=id da aplicação
CLIENT_SECRET=client secret
REDIRECT_URI=http://localhost:3000/callback
MONGO_URI=sua uri do mongodb
SESSION_SECRET=qualquer senha forte
PORT=3000
```

## Discord Developer Portal

Em OAuth2 > Redirects, coloque:

```txt
http://localhost:3000/callback
```

Em Bot > Privileged Gateway Intents, ative:

```txt
SERVER MEMBERS INTENT
MESSAGE CONTENT INTENT
```

## Rodar

```bash
npm start
```

Abra:

```txt
http://localhost:3000
```

## Observação

Para aparecer na lista do painel:
- você precisa ser admin ou ter permissão de gerenciar servidor;
- o bot precisa estar dentro do servidor.
