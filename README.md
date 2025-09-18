# BeTalent Checkout API

API RESTful construída com AdonisJS para gerenciar um fluxo completo de vendas multi-gateway, incluindo autenticação, controle de acesso por _roles_, checkout com _failover_ entre gateways, reembolso e relatórios de clientes.

## 🧱 Stack

- [AdonisJS 6](https://docs.adonisjs.com/) (Node.js)
- MySQL (via Lucid ORM)
- Japa + @japa/api-client para testes (unitários e e2e)
- Docker Compose (MySQL + mocks dos gateways)

## ⚙️ Requisitos

- Node.js 20+
- pnpm ou npm (o projeto usa npm)
- Docker e Docker Compose (opcional, mas recomendado para subir banco e mocks)

## 🚀 Como executar

1. Clone o repositório e instale as dependências:

   ```bash
   git clone git@github.com:CMScofield7/betalent-backend-test.git
   cd betalent-backend-test
   npm install
   ```

2. Crie o arquivo de ambiente (há um `.env.example` com valores padrão):

   ```bash
   cp .env.example .env
   ```

3. Suba a infraestrutura via Docker (MySQL + mocks):

   ```bash
   docker compose up -d
   ```

4. Inicie ou Resete o banco (wipe → migrations → seeders de gateways e admin):

   ```bash
   npm run db:reset
   ```

5. Rode a aplicação:

   ```bash
   npm run dev
   ```

   O servidor sobe por padrão em `http://localhost:3333`.

## 🔐 Usuário Padrão

O seed `user_seeder.ts` cria um admin para facilitar o primeiro login:

| Email            | Senha     | Role  |
| ---------------- | ---------- | ----- |
| `x@y.com`        | `admin123` | admin |

## 📡 Rotas principais

| Método/rota                       | Descrição                                                         | Autorização                              |
| --------------------------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| `POST /login`                     | Autentica e retorna token                                         | Pública                                   |
| `POST /checkout`                  | Processa compra multi-gateway com failover                        | Pública                                   |
| `GET /gateways`                   | Lista gateways                                                    | `admin`                                   |
| `PATCH /gateways/:id/priority`    | Ajusta prioridade de um gateway                                   | `admin`                                   |
| `PATCH /gateways/:id/active`      | Ativa/desativa um gateway                                         | `admin`                                   |
| `POST /products` / `GET /products`| CRUD básico de produtos                                           | `admin` e `finance`                       |
| `GET /clients` / `GET /clients/:id`| Lista clientes e detalha compras de um cliente                    | Qualquer usuário autenticado              |
| `GET /users/me`                   | Dados do usuário autenticado                                      | Qualquer usuário autenticado              |
| `POST /users` / `PATCH /users/:id`/`DELETE /users/:id` | Gerenciamento de usuários com regras por nível              | `admin` e `manager` (delete apenas `admin`)|
| `POST /transactions/:id/refund`   | Reembolso junto ao gateway e atualização do status da transação   | `admin` e `finance`                       |

### Payloads de exemplo

#### Autenticação

```http
POST /login
```

```json
{
  "email": "x@y.com",
  "password": "admin123"
}
```

#### Checkout

```http
POST /checkout
```

```json
{
  "client": {
    "name": "Zé Cliente",
    "email": "cliente@example.com"
  },
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "card": {
    "number": "5569000000006063",
    "cvv": "123"
  }
}
```

#### Usuários

```http
POST /users
Authorization: Bearer <token>
```

```json
{
  "fullName": "Manager Jane",
  "email": "manager@example.com",
  "password": "secret123",
  "role": "manager"
}
```

```http
PATCH /users/:id
Authorization: Bearer <token>
```

```json
{
  "fullName": "Manager Jane Doe",
  "password": "new-secret",
  "role": "finance"
}
```

#### Produtos

```http
POST /products
Authorization: Bearer <token>
```

```json
{
  "name": "Notebook",
  "amount": 329900
}
```

#### Gateways

```http
PATCH /gateways/:id/priority
Authorization: Bearer <token>
```

```json
{
  "priority": 2
}
```

```http
PATCH /gateways/:id/active
Authorization: Bearer <token>
```

```json
{
  "isActive": false
}
```

#### Reembolso

```http
POST /transactions/:id/refund
Authorization: Bearer <token>
```

Body vazio `{}`.

## 🧪 Testes

O projeto segue TDD com testes unitários, e2e e um fluxo completo de checkout → reembolso.

- **Unitários:** `npm run test:unit`
- **E2E:** `npm run test:e2e` (usa _stubs_ de gateways; não depende do mock externo)
- **Todos:** `npm test`


## 📜 Scripts

| Script                 | Descrição                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `npm run db:reset`     | Wipe/Start do banco, migrations e seeders (gateways + admin)                        |
| `npm run dev`          | Inicia o servidor em modo desenvolvimento com HMR                                   |
| `npm run test:unit`    | Executa apenas a suíte de testes unitários                                          |
| `npm run test:e2e`     | Executa os testes end-to-end (login → checkout → reembolso)                         |
| `npm run lint`         | Lint com ESLint                                                                     |
| `npm run format`       | Ajusta formatação com Prettier                                                      |
| `npm run typecheck`    | Verifica tipagem com TypeScript                                                     |
| `npm run build`        | Compila o projeto com o Assembler                                                   |

## 🧩 Regras Implementadas

### Nível 1

- Checkout multi-gateway com failover automático e persistência de transações.
- Cadastro básico de produtos e clientes, retornos 100% JSON.

### Nível 2

- Gateways com autenticação (Bearer ou headers fixos) e endpoints para definir prioridade/ativação.
- Produtos gerenciados via API (criação/listagem) respeitando permissões.
- Clientes listados e detalhados junto de todas as compras.

### Nível 3

- Autenticação JWT e controle fino por roles (`admin`, `manager`, `finance`, `user`) com regras de negócio (manager não altera/deleta pares/admins; delete só para admin).
- Reembolso integrado ao gateway com validações de status/externalId e atualização para `refunded`.
- Testes unitários e e2e (checkout → reembolso) garantindo TDD.
- Docker Compose para subir banco + mocks dos gateways e scripts de reset/testes.

## 📦 Estrutura de Pastas (Highlights)

```
app/
  clients/gateways          -> Clients HTTP para os gateways externos
  controllers               -> Camada HTTP (Users, Clients, Transactions, Checkout, Gateways, Auth)
  services                  -> Regras de negócio (CheckoutService, UserService, TransactionService, ClientService, GatewayService)
  interfaces                -> Contratos compartilhados/utilitários
database/
  migrations                -> Esquema das tabelas
  seeders                   -> Gateways e usuário admin
tests/
  unit                      -> Testes unitários (serviços)
  e2e                       -> Fluxos ponta-a-ponta com stubs

```

## 🧰 Gateways mockados

Se quiser exercitar a integração real com os mocks, use a imagem disponibilizada pelo desafio:

```bash
docker run -p 3001:3001 -p 3002:3002 matheusprotzen/gateways-mock
# ou com auth removida
docker run -p 3001:3001 -p 3002:3002 -e REMOVE_AUTH='true' matheusprotzen/gateways-mock
```

Os clients (`GatewayOneClient` e `GatewayTwoClient`) já esperam os contratos descritos no enunciado.

## 🧠 Minhas considerações sobre o desafio

O fato d'eu não conhecer o framework me fez ter de pesquisar bastante pra aplicar o que usualmente eu faria no NestJS, que é o framework que eu conheço um pouco mais. Ter de adaptar soluções de frameworks diferentes me fez fritar alguns neurônios, mas o desafio foi recompensador (ao menos essa é a minha sensação).

---

