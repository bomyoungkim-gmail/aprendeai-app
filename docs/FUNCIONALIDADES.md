# Funcionalidades do AprendeAI

## 1. Autenticação e Usuários

- **Login/Registro**: Sistema completo com JWT.
- **Tipos de Usuário**: Suporte a Estudantes, Professores e Administradores.
- **Proteção de Rotas**: Frontend protegido por `AuthGuard`.

## 2. Gestão de Conteúdo e Instituições

- **CRUD de Instituições**: Gestão de escolas/universidades.
- **CRUD de Turmas**: Organização de alunos por turmas.
- **Biblioteca de Conteúdos**:
  - Ingestão automática de **Notícias** (RSS).
  - Ingestão automática de Artigos Científicos (**Arxiv**).
  - Upload/Criação manual (preparado na API).

## 3. Inteligência Artificial (AI Service)

- **Simplificação de Texto**: API dedicada para simplificar textos complexos para níveis escolares (EF, EM).
- **Tradução**: Suporte a tradução contextual (preparado).
- **Geração de Avaliações**: Criação automática de questões (múltipla escolha, V/F) baseada no conteúdo lido.
- **Processamento em Background**: Uso de RabbitMQ para filas de processamento pesado.

## 4. Experiência de Leitura (Frontend)

- **Dashboard**: Visão geral do aluno.
- **Leitor Imersivo**:
  - Visualização limpa do texto.
  - Alternância entre abas "Original" e "Simplificado".
  - Botão "Simplificar" (gera nova versão via IA).
  - Botão "Gerar Questões" (gera avaliação via IA).

## 5. Gamificação e Hábitos (Novo 🚀)

- **Metas Diárias**: Definição de metas de estudo (ex: 20 minutos/dia ou 1 lição/dia).
- **Rastreamento de Tempo**: O leitor contabiliza automaticamente o tempo de estudo ativo.
- **Streaks (Sequência)**:
  - Contador de dias consecutivos de estudo.
  - Lógica de "Gelo" (Freeze Token) para perdoar falhas (backend preparado).
- **Feedback Visual**:
  - Cards de progresso no Dashboard.
  - Ícone de "Fogo" para indicar sequência.
  - Botão "Concluir Leitura" para registrar progresso.

## 6. Próximos Passos (Roadmap)

- Sistema completo de **realização de provas** (interface para responder as questões geradas).
- Editor de notas **Cornell** aprimorado.
- Dashboards de Analytics para professores.
