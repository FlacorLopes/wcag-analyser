# WCAG Analyser

Uma aplicação full-stack para análise automatizada de acessibilidade web (WCAG), construída com Vue 3, NestJS e MongoDB em uma estrutura de monorepo.

## 🚀 Funcionalidades

- **Análise de URL:** Verifica a presença de `<title>`, atributos `alt` em imagens e associação de `label` em inputs.
- **Feedback em Tempo Real:** Utiliza WebSockets para informar o progresso da análise (fetch do html, processamento, conclusão).
- **Histórico de Análises:** Persistência dos resultados no MongoDB com listagem paginada.
- **Interface Acessível:** Frontend desenvolvido seguindo práticas de acessibilidade.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Vue 3, TypeScript, Vite, Vue Router, Tailwind CSS.
- **Backend:** NestJS, TypeScript, Mongoose, JSDOM, WebSockets (ws).
- **Banco de Dados:** MongoDB.
- **Infraestrutura/Tooling:** Docker, Docker Compose, Turbo Repo, PNPM Workspaces, GitHub Actions (CI/CD), Playwright (E2E), Vitest (Unit). Husky + lint-staged (pre-commit hooks).

---

## Como Executar

### Pré-requisitos

- **Node.js** (v20+)
- **Docker** e **Docker Compose**
- _Opcional:_ PNPM (o script de setup instala automaticamente caso não tenha)

### Opção 1: Docker Compose (Caso deseje apenas rodar a aplicação)

```bash
docker compose up --build
```

Acesse:

- Frontend: http://localhost:8080
  Você verá a interface para inserir URLs e visualizar resultados.

Caso deseje alterar as portas padrão (api: 3000, frontend: 8080), crie um arquivo `.env` na raiz com as variáveis definidas no .env.example da raiz.

### Opção 2: Via Script Automatizado (caso deseje rodar testes ou executar fora do Docker)

Execute o script de setup que instala dependências (incluindo o pnpm se necessário), sobe o banco de dados via Docker e realiza o build dos pacotes:

```bash
chmod +x setup.sh #para garantir permissão de execução
./setup.sh
```

## Decisões Arquiteturais

O app foi desenvolvido seguindo o conceito de Functional Core/Imperative Shell, separando a lógica de negócio (core) da infraestrutura (shell) para facilitar testes, manutenção e extensibilidade.

No core da aplicação, existem as regras de análise de acessibilidade, classes que implementam a interface `WCAGRule` , testáveis e independentes do framework.
O `WCAGAnalyser` atua como um orquestrador de regras, analisando um documento html com as regras fornecidas e devolvendo uma composição dos resultados.

Para manter a separação de responsabilidades, o documento HTML foi abstraído em duas interfaces: `DomDocument` e `DomElement`, permitindo que o core se preocupe apenas da lógica de análise, sem se importar com a implementação específica do parse _cru_.
Isso fica a cargo de qualquer implementação de um `DomParser`, que converte o HTML bruto em objetos que implementam essas interfaces.

Já o shell lida com requisições HTTP, WebSockets, persistência no banco e interação com o DOM via JSDOM.

Implementar essa separação trouxe alguns benefícios:

- Testabilidade: O core pode ser testado isoladamente com mocks das interfaces de DOM, sem necessidade de um servidor ou banco real.
- Manutenção: Regras de negócio e infraestrutura são desacopladas, facilitando mudanças em qualquer uma das partes sem impactar a outra.
- Extensibilidade: Futuras melhorias (ex: suporte a outros parsers como Puppeteer) podem ser adicionadas sem alterar o core.

#### Comunicação entre os componentes

- REST API (NestJS): Endpoints para iniciar análises e consultar histórico.
- WebSockets: Feedback em tempo real do progresso de uma análise.

#### Monorepo (Turbo Repo & PNPM Workspaces)

A estrutura de monorepo facilita o compartilhamento de código e configurações.

- packages/shared: Contém interfaces TypeScript (DTOs, Detalhes de Resultado de análise de cada regra) compartilhadas entre o Backend (apps/api) e o Frontend (apps/web) para melhorar a experiência de desenvolvimento.

#### Frontend

- Vue 3 com roteamento simples via Vue Router.
- Aplicação SPA, já que não há necessidade de SEO ou questões de performance críticas que justifiquem SSR.

### Filosofia de Testes

- Testes Unitários e integração com mock (Vitest): Foco no core da aplicação, testando regras de acessibilidade e o orquestrador WCAGAnalyser isoladamente. Usar mock nos testes de integração permite estressar diversos cenários sem depender de um servidor real ou banco de dados. Aumentando a velocidade dos testes.
- Testes E2E do backend (Supertest + Testcontainers): Validação dos endpoints REST e fluxo completo de análise, incluindo persistência no MongoDB real via container Docker.
- Testes E2E do frontend (Playwright): Cobertura das principais jornadas do usuário, garantindo que a aplicação funcione como esperado do ponto de vista do usuário final.
- Cobertura de testes: Foco maior no core (regras e orquestrador) com cobertura próxima a 100%. Testes de integração e E2E com cobertura menor, focando nos fluxos principais.
- Testes isolados: Evito deliberadamente que um teste dependa de estado criado por outro teste para garantir independência e confiabilidade.

## Trade-offs e Melhorias

- Parser HTML (JSDOM): Optei pelo JSDOM por ser leve e rápido para análises estáticas.
  - Limitação: Não executa javascript. Sites construídos inteiramente como SPAs que renderizam conteúdo apenas no cliente podem não ser analisados corretamente.

- Processamento em memória: A análise ocorre em memória. Mesmo sendo feita em background, não bloqueante, ela consome recursos do servidor principal. Sob carga extrema, isso poderia travar a API.

- Análise assíncrona não retorna resultados imediatamente no endpoint /analyze. O cliente deve usar WebSockets para receber atualizações de progresso e resultados ou consultar a análise via GET /analyses posteriormente.
- Optei por um modelo anêmico da "entidade" UrlAnalysis para simplificar a persistência com Mongoose, ganhando tempo para lidar com persistência e focar na lógica de análise. Como não existe lógica de negócio atrelada a ela, é um trade-off aceitável e até positivo, evitando complexidade desnecessária.
- A implementação do gateway WebSocket foi feita com a biblioteca 'ws' para manter a leveza e simplicidade. Alternativas como Socket.io oferecem mais recursos, mas adicionam complexidade e peso desnecessários para o caso de uso atual. Além disso, da forma que está implementado, não é possível ter multiplas instâncias da API compartilhando o mesmo canal WebSocket sem um broker (Redis, RabbitMQ etc). Isso pode ser uma limitação para escalabilidade horizontal.

#### Melhorias Futuras

- Adicionaria um cache de urls analisadas recentemente ( Redis) para evitar tráfego e reprocessamento desnecessário.
- Utilizaria uma fila (BullMq, SQS) para registrar pedidos de análise e processá-los sob demanda, aliviando a carga da API principal.
- configuraria rate limiting para evitar abuso do endpoint de análise.
- implementaria limites de tamanho de HTML para evitar sobrecarga.
- melhor tratamento de erros e timeouts nas análises.
- faria um ajuste fino das configurações de typescript para diminuir arquivos com alertas que só aumentam a carga cognitiva.

### Estratégia de Deploy na AWS

Eu faria o deploy da aplicação na AWS utilizando os seguintes serviços:

**Frontend**:

- Hospedagem estática num bucket do S3.
- Distribuição via Amazon CloudFront (CDN) para baixa latência e cache.
- Pipeline de CI/CD (GitHub Actions) para build e deploy automático no S3 com autenticação via OIDC e invalidação automática do cache do CloudFront.

**Backend**:

Containerização da API via Amazon ECS com AWS Fargate. Para não haver a necessidade de gerenciar servidores EC2 manualmente, além de permitir auto-scaling baseado em uso de CPU/Memória.

Application Load Balancer (ALB) à frente dos containers para distribuir tráfego e gerenciar conexões WebSocket com Sticky Sessions para manter a persistência da conexão.

**Banco de Dados:**
Considerando os critérios de alta disponibilidade e escalabilidade, utilizaria o Amazon DocumentDB. O Atlas apesar de rodar na aws é um serviço externo, o que pode gerar custos adicionais e latência. O DocumentDB é totalmente gerenciado pela AWS, facilitando a integração com outros serviços.

### Desafios de Escalabilidade (100k análises/dia)

Se a demanda subir para 100.000 análises/dia, a arquitetura atual se tornaria um gargalo porque o processamento está todo concentrado na api. Parsing de HTML é custoso para a CPU. Além disso, gerenciar tantas conexões WebSocket simultâneas seria um problema.

Nesse cenário, uma abordagem orientada a eventos seria mais adequada:

**Evolução da Arquitetura:**

Arquitetura Orientada a Eventos (Assíncrona):

- O endpoint POST /analyze deixaria de processar a análise. Ele apenas salvaria o pedido no banco com status PENDING e publicaria uma mensagem em uma fila (Amazon SQS).

- A API retornaria imediatamente o ID da análise para o cliente.

**Workers Dedicados:**

Criar um serviço separado que consome a fila.
Esse worker baixa o HTML, processa as regras pesadas e atualiza o banco.

Isso permite escalar os Workers independentemente da API. Se a fila encher, subimos mais Workers (Lambda Functions dariam conta).

**Pub/Sub para Notificações:**
Ao terminar o processamento, o Worker publicaria um evento em um tópico de Pub/Sub do Redis que a API escutaria para notificar os clientes via WebSockets.

**Cache:**
Implementar Redis (Amazon ElastiCache) para cachear resultados de URLs analisadas recentemente, evitando reprocessamento desnecessário.
