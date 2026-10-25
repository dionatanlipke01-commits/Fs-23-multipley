
const http = require("http");

const salas = new Map();

function gerarCodigo() {
  return Math.random().toString(36)
    .substring(2, 8).toUpperCase();
}

function responder(res, status, dados) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(dados));
}

const servidor = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    return responder(res, 200, {});
  }

  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/") {
    return responder(res, 200, {
      projeto: "FS23 Multiplayer",
      status: "online"
    });
  }

  if (req.method === "GET" && url.pathname === "/salas") {
    const busca = (url.searchParams.get("busca") || "")
      .toLowerCase();

    const lista = [...salas.values()]
      .filter(s => s.publica)
      .filter(s => s.nome.toLowerCase().includes(busca))
      .map(s => ({
        nome: s.nome,
        codigo: s.codigo,
        jogadores: s.jogadores.length,
        limite: 4,
        status: s.jogadores.length >= 4 ? "cheia" : "aberta"
      }));

    return responder(res, 200, lista);
  }

  if (req.method === "POST" && url.pathname === "/criar") {
    let corpo = "";

    req.on("data", parte => corpo += parte);

    req.on("end", () => {
      try {
        const dados = JSON.parse(corpo);
        const nome = String(dados.nome || "").trim();
        const jogador = String(dados.jogador || "").trim();

        if (!nome || !jogador) {
          return responder(res, 400, {
            erro: "Informe o nome da sala e do jogador."
          });
        }

        const codigo = gerarCodigo();

        const sala = {
          nome,
          codigo,
          publica: dados.publica !== false,
          jogadores: [jogador]
        };

        salas.set(codigo, sala);

        responder(res, 201, {
          mensagem: "Sala criada!",
          codigo,
          sala: {
            nome,
            jogadores: 1,
            limite: 4
          }
        });
      } catch {
        responder(res, 400, { erro: "Dados inválidos." });
      }
    });

    return;
  }

  if (req.method === "POST" && url.pathname === "/entrar") {
    let corpo = "";

    req.on("data", parte => corpo += parte);

    req.on("end", () => {
      try {
        const dados = JSON.parse(corpo);
        const codigo = String(dados.codigo || "").toUpperCase();
        const jogador = String(dados.jogador || "").trim();
        const sala = salas.get(codigo);

        if (!sala) {
          return responder(res, 404, {
            erro: "Sala não encontrada."
          });
        }

        if (!jogador) {
          return responder(res, 400, {
            erro: "Informe o nome do jogador."
          });
        }

        if (sala.jogadores.includes(jogador)) {
          return responder(res, 200, {
            mensagem: "Jogador já está na sala.",
            codigo
          });
        }

        if (sala.jogadores.length >= 4) {
          return responder(res, 409, {
            erro: "Sala cheia."
          });
        }

        sala.jogadores.push(jogador);

        responder(res, 200, {
          mensagem: "Entrou na sala!",
          codigo,
          jogadores: sala.jogadores.length
        });
      } catch {
        responder(res, 400, { erro: "Dados inválidos." });
      }
    });

    return;
  }

  responder(res, 404, { erro: "Rota não encontrada." });
});

const porta = process.env.PORT || 3000;

servidor.listen(porta, "0.0.0.0", () => {
  console.log("FS23 Multiplayer na porta " + porta);
});
