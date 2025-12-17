# AprendeAI - Plataforma Educacional

Bem-vindo ao monorepo da **AprendeAI**, uma plataforma de leitura, vocabulário e compreensão de textos com suporte a IA.

## 📚 Documentação

- [Tecnologias Utilizadas](./TECNOLOGIA.md)
- [Estrutura do Projeto](./ESTRUTURA.md)
- [Plano de Implementação](./PLANO_IMPLEMENTACAO.md)
- [Funcionalidades](./FUNCIONALIDADES.md)

## 🚀 Como Iniciar

### Pré-requisitos

- **Docker** e **Docker Compose** instalados.
- Node.js (opcional, apenas se quiser rodar comandos npm fora do docker).

### Passo a Passo

1. **Construir os Containers**
   Na raiz do projeto, execute:

   ```bash
   docker-compose build
   ```

2. **Iniciar a Aplicação**

   ```bash
   docker-compose up
   ```

   _A primeira execução pode demorar um pouco para inicializar o banco de dados e instalar dependências._

3. **Aplicar Migrations no Banco de Dados**
   Em outro terminal, com os containers rodando:
   ```bash
   # Rodar migration dentro do container da API
   docker-compose exec api npx prisma migrate dev --name init
   ```

### 🌐 Acessando os Serviços

| Serviço         | URL Local                                                | Descrição                               |
| --------------- | -------------------------------------------------------- | --------------------------------------- |
| **Frontend**    | [http://localhost:3000](http://localhost:3000)           | Interface do Usuário                    |
| **API Backend** | [http://localhost:4000](http://localhost:4000)           | API Principal (NestJS)                  |
| **API AI**      | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger da IA (FastAPI)                 |
| **RabbitMQ**    | [http://localhost:15672](http://localhost:15672)         | Dashboard de Filas (u: guest, p: guest) |

## 🛠 Desenvolvimento

- **Frontend**: Edite em `frontend/`. O Hot Reload está ativo.
- **API**: Edite em `services/api/`. O servidor reinicia ao salvar.
- **IA**: Edite em `services/ai/`. O Uvicorn reinicia ao salvar.
- **Prisma**: Se alterar `db/schema.prisma`, rode `npx prisma generate` e crie uma nova migration.
