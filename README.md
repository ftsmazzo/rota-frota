# Rota — Frota interna SST

MVP de checklist veicular com Next.js, PostgreSQL, fotos em volume persistente, autenticação própria e assistente via OpenRouter.

Repositório: [ftsmazzo/rota-frota](https://github.com/ftsmazzo/rota-frota).

O repositório contém a versão operacional da aplicação, migrations, ícones do PWA, scripts de implantação e documentação. Credenciais reais, dados da frota, fotos operacionais, backups e builds gerados não são versionados. A instalação em outro ambiente começa com banco vazio e criação do administrador inicial.

Para obter o projeto:

```sh
git clone https://github.com/ftsmazzo/rota-frota.git
cd rota-frota
npm ci
```

Use Node.js 22. Para produção, configure as variáveis de `.env.example` no EasyPanel e construa pelo `Dockerfile`, mantendo PostgreSQL e o volume `/data` persistentes. O Dockerfile identifica a versão, gera o build e prepara os arquivos offline do PWA automaticamente. Os detalhes estão abaixo.

## Implantação em operação

- URL: https://rota-frota-app.kxryyk.easypanel.host
- Painel: a instância EasyPanel do responsável pela implantação.
- Projeto: `rota-frota`
- Aplicação: `app`, porta interna HTTP `3000`, HTTPS pelo proxy do EasyPanel.
- Banco: `postgres`, imagem `postgres:17`, banco e usuário `rota`, sem porta pública.
- Host interno do banco: `rota-frota_postgres:5432`.
- Volume da aplicação: `dados`, montado em `/data`.
- Fotos: `/data/uploads`; backups: `/data/backups`.
- Saúde: `GET /api/health` verifica banco e acesso ao armazenamento.

As credenciais de entrega ficam em arquivo separado. Nenhuma chave, senha, sessão ou arquivo de ambiente real está neste pacote.

## Recursos

- Painel, veículos, motoristas e histórico de vistorias de saída/retorno.
- Checklist com fotos, avarias, assinaturas e relatório PDF de três páginas.
- Administrador e operador; gestão de acessos; troca obrigatória da senha inicial.
- IA para organizar observações, ler hodômetro em foto e transcrever áudio, sempre sujeita à conferência do operador.
- A leitura do painel usa `/api/ai/dashboard`, com resultado específico para hodômetro e combustível, até duas tentativas para falhas temporárias e limites de tempo. A confirmação aplica somente os campos legíveis; resultados inteiramente ilegíveis preservam os valores e orientam uma nova foto. Falhas ficam visíveis na tela e geram logs sem fotos, números lidos ou credenciais. `OPENROUTER_VISION_MODEL` permite configurar um modelo de visão diferente do assistente, se necessário.
- A transcrição do visor mantém pontos e vírgulas. Leituras decimais, parciais ou sem unidade confirmada não são convertidas silenciosamente em quilômetros inteiros. O caminho `/api/ai` permanece compatível com telas anteriores.
- Rascunhos e fila de envio no IndexedDB, isolados por usuário.
- PWA com cache da interface. O aparelho precisa abrir e autenticar com conexão antes do uso offline. O perfil offline expira em sete dias.
- No iPhone, instale pelo Safari em Compartilhar > Adicionar à Tela de Início. O login e as configurações mostram essa orientação quando o aplicativo ainda não está instalado.
- Os campos usam fonte de 16px em telas de até 1024px e dispositivos de toque para evitar o zoom automático de foco do iOS, mantendo disponível o zoom manual. Formulários usam uma coluna até 480px; painéis respeitam as áreas seguras e a altura dinâmica da tela.
- A sincronização ocorre com o aplicativo aberto e conexão disponível. IA, novos cadastros e administração precisam de conexão. Não há garantia de sincronização em segundo plano no iOS.
- As cinco fotos obrigatórias, todos os itens e duas assinaturas são exigidos antes do recebimento. Reenvios de fotos e vistorias usam identificadores estáveis para evitar duplicação.
- Conferência administrativa de apontamentos preserva a vistoria original.
- O mapa de avarias mostra um marcador de seleção imediatamente ao toque, sugere a região e mantém a edição no rascunho. Após preencher a descrição e adicionar o apontamento, a marcação passa a fazer parte da vistoria. As posições usam as coordenadas do desenho SVG para manter o alinhamento em celular e desktop.
- Utilizações vincula cada saída a um único retorno, calcula a distância pelos dois hodômetros e apresenta histórico completo com filtros por veículo, motorista da saída e período. O período considera a data do retorno; em saídas abertas, a data da saída. Registros incompletos não entram nos totais. Não há rastreamento de trajeto por GPS.
- O retorno novo exige uma saída aberta do mesmo veículo; o servidor impede saídas simultâneas, odômetro regressivo e retorno com vínculo incorreto. As gravações usam transação e bloqueio por veículo. O hodômetro do cadastro acompanha a última leitura.
- O comparativo apresenta checklist, fotos por posição, observações, ocorrências e seus acompanhamentos. O PDF completo reúne saída, retorno, histórico das ocorrências e as quatro assinaturas originais. Os PDFs individuais continuam disponíveis.
- Ocorrências seguem Identificada → Em avaliação → Encaminhada para reparo → Em reparo → Aguardando conferência final → Concluída; as etapas de encaminhamento e execução podem ser abreviadas quando aplicável. Encaminhar mantém a ocorrência aberta e o carro em reparo. Reparo concluído mantém o carro em atenção até a confirmação final. Ocorrências críticas bloqueiam novas saídas; ocorrências leves identificadas permanecem acompanhadas sem bloqueio automático.
- Cada atualização exige administrador, conexão, nota e conferência da versão atual para evitar sobreposição. A conclusão exige confirmação explícita. O histórico permite reabertura sem apagar a conclusão anterior.
- A migration preserva as conclusões e observações do fluxo anterior, identificadas como legado. Não interpreta o texto de uma conclusão antiga como reparo executado; se houve apenas encaminhamento, o administrador pode reabrir para reparo. Vistorias históricas sem vínculo válido aparecem em Conferir vínculos, para associação manual auditada. A vistoria original não é alterada.

Os seis veículos, quatro motoristas e sete registros iniciais são fictícios; suas imagens são ilustrativas e geradas por IA. O relatório identifica demonstrações. O botão de cenário demonstrativo cria um exemplo somente no navegador.

## Build e configuração

Node.js 22. Use `npm ci`, `npm run typecheck`, `node scripts/stamp-release.mjs` e `npm run build`. O `Dockerfile` instala dependências, identifica a versão automaticamente, constrói o Next.js e inicia o servidor standalone. O script de inicialização aplica migrations versionadas e cria o primeiro administrador quando não existe nenhum usuário.

`/api/version` publica a identificação da versão, sem cache. Ao retomar o aplicativo com conexão, o PWA confere se há atualização e oferece o botão Atualizar. Antes de recarregar, aguarda as escritas no IndexedDB. A atualização não apaga rascunhos nem fotos e mantém o cache da versão anterior para telas ainda abertas.

Cada nova implantação verifica os dois caminhos de leitura por HTTP no próprio servidor, usando uma imagem vazia. Se já existe um administrador com senha definida, cria uma sessão interna de cinco minutos, faz as verificações e a remove em seguida. Nenhuma senha é alterada e o token nunca é registrado. O resultado é salvo em `/data/deployment-check.json`; `/api/health` informa `aiSelfCheck` sem expor informações pessoais. Em uma instalação nova, essa verificação aguarda que a senha inicial seja definida.

A cada versão, `instrumentation.ts` valida o fluxo de utilizações no PostgreSQL dentro de uma transação revertida: vínculos, quilômetros, odômetro, etapas de reparo, bloqueios, idempotência, atualização concorrente, reabertura e preservação dos registros legados. Usuário, veículos, fotos e registros temporários são removidos. A verificação não altera dados da frota nem senhas. O resumo fica em `/data/workflow-check.json`, e `/api/health` expõe somente `workflowSelfCheck`. Uma falha impede a nova instância de atender.

Configure as variáveis do `.env.example` no serviço do EasyPanel. O `APP_URL` deve coincidir com o domínio HTTPS. `DATABASE_URL` e `OPENROUTER_API_KEY` permanecem no servidor. Não use prefixo `NEXT_PUBLIC_` para segredos.

O administrador inicial é criado com `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME` e `INITIAL_ADMIN_PASSWORD`. Alterar essas variáveis depois da criação não redefine a senha. A redefinição é feita em Configurações > Gerenciar acessos.

Para implantar por repositório, selecione a origem Git e o build por Dockerfile. Para implantação inline, execute `node scripts/package-inline.mjs` no checkout com Node.js e tar disponíveis e copie o conteúdo do arquivo gerado para a origem Dockerfile do EasyPanel. Esse arquivo contém código compactado, sem segredos nem dados operacionais. A implantação atual usa esse modo para não depender de um repositório externo.

O serviço deve manter o volume `/data`. Migrações têm bloqueio no PostgreSQL para evitar execução concorrente. A primeira inicialização exige que o PostgreSQL já esteja disponível.

## Importação inicial e backup

`POST /api/admin/migrate` recebe multipart com `data` (JSON com `vehicles`, `drivers`, `inspections`), `demo` (imagem ilustrativa opcional) e `media:<id>` (fotos opcionais). Exige `Authorization: Bearer <MIGRATION_TOKEN>`, banco sem registros e ausência da marca de importação. Depois de concluída, a importação é bloqueada e tentativas posteriores não alteram os dados. O projeto implantado já foi importado.

O EasyPanel tem backup diário do PostgreSQL configurado em `0 3 * * *`, com sete cópias e destino `Local Disk`, caminho `rota-frota/postgres`. O horário é interpretado pelo agendador do painel.

A aplicação verifica a cada hora a existência de um backup do dia em America/Sao_Paulo e mantém sete arquivos `rota-photos-AAAA-MM-DD.tar.gz`. Cada arquivo contém uploads, imagem de demonstração, registros de frota, conclusões legadas, eventos das ocorrências e vínculos das utilizações. Configurações > Baixar backup permite retirar a cópia mais recente. O backup completo de usuários, senhas cifradas, sessões e auditoria é o do PostgreSQL.

Para restaurar completamente, pare a aplicação, restaure o dump do PostgreSQL no banco `rota` e o diretório de fotos no volume `/data`, mantendo os mesmos IDs. Conserve permissões de acesso do usuário UID/GID 1000 para os arquivos. Inicie a aplicação e confira `/api/health`, login e fotos. O JSON do backup de fotos permite recuperação dos registros, mas não substitui o dump completo do banco.

Os backups configurados estão no próprio servidor. Para proteção contra perda total do servidor, configure um destino externo no EasyPanel e uma cópia externa do volume de fotos.

## Validação de entrega

Foram verificados no domínio implantado: HTTPS, conexão com PostgreSQL, login, troca da senha inicial, proteção dos endpoints, carga inicial, upload e download íntegro de foto, reenvio idempotente de foto, rejeição de vistoria incompleta, consulta real ao OpenRouter, manifesto offline, geração e download de backup, gestão administrativa, relatório PDF e persistência após reinício do contêiner.

O PDF foi baixado pelo navegador e suas três páginas foram renderizadas e conferidas. A interface confirmou que o cache offline estava preparado. Câmera, microfone, instalação PWA e operação sem sinal ainda precisam de homologação nos celulares efetivamente usados pela equipe. Não foi realizada uma vistoria física real de veículo durante a implantação.

## Atualização de utilizações e reparos

A interface foi verificada com dados fictícios em desktop e largura de 390 px: filtros, vínculo histórico, comparativo, acesso pelo relatório, encaminhamento, execução, conferência obrigatória e consulta da conclusão no histórico individual. Os novos campos mantêm 16 px em dispositivos móveis. O relatório consolidado de exemplo tem cinco páginas; foi gerado, renderizado e conferido com fotos e quatro assinaturas. A homologação física de Safari/PWA continua dependendo dos aparelhos da equipe.
