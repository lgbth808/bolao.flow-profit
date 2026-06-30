export type TutorialPageData = {
  id: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  cta: string;
  bullets?: string[];
  href?: string;
  final?: boolean;
};

export const tutorialPages: TutorialPageData[] = [
  {
    id: "welcome",
    title: "Seja bem-vindo!",
    text:
      "O Bet Barão by d. Rosa é o bolão privado da família Silva, agregados e amigos para acompanhar a Copa com alegria.",
    image: "/brand/tutorial/tutorial_01_welcome.png",
    imageAlt: "D. Rosa segurando o celular com a marca Bet Barão",
    cta: "Começar",
    bullets: ["Privado e familiar", "Simples de usar", "Cada jogo tem seu prêmio"]
  },
  {
    id: "evolution",
    title: "A evolução do bolão",
    text:
      "O que antes era feito na folha de papel virou um app simples para organizar palpites, pagamentos e resultados.",
    image: "/brand/tutorial/tutorial_02_evolution.png",
    imageAlt: "Cartoon mostrando a evolução do bolão de papel para o Bet Barão",
    cta: "Próxima etapa",
    bullets: ["Menos trabalho manual", "Menos erro", "Mais tempo para a família"]
  },
  {
    id: "access-site",
    title: "Acesse o site",
    text:
      "Entre no site do Bet Barão pelo navegador do celular ou computador e mantenha o link salvo para as próximas rodadas.",
    image: "/brand/tutorial/tutorial_03_access_site.png",
    imageAlt: "D. Rosa mostrando o acesso ao site bolao.flow-profit.com",
    cta: "Entendi",
    bullets: ["Site oficial: bolao.flow-profit.com", "Funciona no celular", "Não precisa instalar nada"]
  },
  {
    id: "login",
    title: "Login com WhatsApp e senha",
    text:
      "Digite seu WhatsApp com DDD e sua senha numérica de 4 dígitos. Não usamos e-mail, Google ou rede social.",
    image: "/brand/tutorial/tutorial_04_login.png",
    imageAlt: "Cartoon explicando login por WhatsApp e senha de quatro números",
    cta: "Continuar",
    bullets: ["WhatsApp com DDD", "Senha de 4 números", "Acesso direto"]
  },
  {
    id: "automatic-account",
    title: "Primeiro acesso automático",
    text:
      "Se o WhatsApp ainda não existir no bolão, informe o número e uma senha de 4 números. A conta será criada automaticamente.",
    image: "/brand/tutorial/tutorial_05_auto_account.png",
    imageAlt: "Tela de login do Bet Barão com criação automática de conta",
    cta: "Próximo",
    bullets: [
      "Sem cadastro separado",
      "Nome é pedido só quando precisar",
      "Acesso fica salvo no aparelho"
    ]
  },
  {
    id: "choose-pool",
    title: "Escolha o bolão",
    text:
      "Depois de entrar, escolha o bolão em que deseja participar. Assim cada grupo de família e amigos fica organizado.",
    image: "/brand/tutorial/tutorial_06_choose_pool.png",
    imageAlt: "Tela mostrando a escolha de bolões disponíveis",
    cta: "Ver palpites",
    bullets: ["Um bolão por grupo", "Jogos separados por bolão", "Tudo em um só lugar"]
  },
  {
    id: "predictions",
    title: "Faça seus palpites",
    text:
      "Abra o jogo do Brasil, informe o placar que você acredita e confirme antes do fechamento das apostas.",
    image: "/brand/tutorial/tutorial_07_predictions.png",
    imageAlt: "D. Rosa apontando para a tela de palpites no celular",
    cta: "Entender prêmio",
    bullets: ["Palpite por jogo", "Placar do Brasil e do adversário", "Edição dentro do prazo"]
  },
  {
    id: "prize",
    title: "Entenda a premiação",
    text:
      "Quem acertar o placar até o final da prorrogação, quando houver, divide o prêmio arrecadado entre todos os acertadores.",
    image: "/brand/tutorial/tutorial_08_prize.png",
    imageAlt: "Troféu e explicação sobre divisão do prêmio entre acertadores",
    cta: "Ir para pagamento",
    bullets: ["Prêmio por jogo", "Rateio entre acertadores", "Resultado oficial considerado"]
  },
  {
    id: "pix",
    title: "Pague com PIX",
    text:
      "Depois do palpite, pague o valor combinado pelo PIX informado no bolão para confirmar sua participação.",
    image: "/brand/tutorial/tutorial_09_pix.png",
    imageAlt: "Cartoon mostrando pagamento via PIX",
    cta: "Enviar comprovante",
    bullets: ["Pagamento rápido", "Confirmação pelo admin", "Participação organizada"]
  },
  {
    id: "receipt",
    title: "Envie o comprovante",
    text:
      "Envie o comprovante pelo upload do site ou pelo WhatsApp da D. Rosa para validação do pagamento.",
    image: "/brand/tutorial/tutorial_10_receipt.png",
    imageAlt: "D. Rosa explicando envio do comprovante pelo site ou WhatsApp",
    cta: "Acompanhar rodada",
    bullets: ["Upload no site", "WhatsApp da D. Rosa", "Pagamento marcado como confirmado"]
  },
  {
    id: "follow",
    title: "Acompanhe rodada, ranking e resultados",
    text:
      "Quando as apostas fecharem, acompanhe palpites, resultados, vencedores e ranking de forma simples.",
    image: "/brand/tutorial/tutorial_11_follow.png",
    imageAlt: "Cartoon mostrando ranking e acompanhamento da rodada",
    cta: "Última etapa",
    bullets: ["Palpites liberados no prazo", "Resultado do jogo", "Vencedores e rateio"]
  },
  {
    id: "enter-pool",
    title: "Agora é com você!",
    text:
      "Entre no bolão do jogo Brasil x Noruega, convide a família e faça seus palpites para participar da rodada.",
    image: "/brand/tutorial/tutorial_12_enter_pool.png",
    imageAlt: "Arte Bet Barão com D. Rosa, troféu e bola de futebol",
    cta: "Entrar no Bolão",
    href: "/apostas",
    final: true,
    bullets: ["Brasil x Noruega", "Quanto mais palpites, mais chances", "Salve o site no celular"]
  }
];
