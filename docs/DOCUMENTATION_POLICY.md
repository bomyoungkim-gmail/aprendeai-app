# Política de Documentação

No AprendeAI, a documentação é parte integrante do código ("Documentation as Code"). Código sem docs ou com docs desatualizados é considerado **incompleto**.

## Definition of Done (DoD)

Uma feature ou fix só está "Pronta" quando:

1.  Código implementado e testado.
2.  **Documentação atualizada** para refletir as mudanças.

## O Que Exige Atualização?

| Tipo de Mudança                   | Docs Impactados (Provavelmente)                   |
| --------------------------------- | ------------------------------------------------- |
| Novo Endpoint API                 | `docs/REFERENCE/api.md`, `docs/APP.md`            |
| Novo Worker/Fila                  | `docs/CORE.md`, `docs/REFERENCE/messages.md`      |
| Mudança de Infra (ex: Redis novo) | `docs/ARCHITECTURE.md`, `docs/GETTING_STARTED.md` |
| Nova Variável de Ambiente         | `docs/APP.md` (ou `RUNBOOK` se operacional)       |
| Decisão Arquitetural              | Criar novo ADR em `docs/ADRs/`                    |

## Checklist de PR

Antes de mergear, verifique:

- [ ] Diagramas de arquitetura ainda são válidos?
- [ ] README principal aponta para links quebrados?
- [ ] Passos de instalação mudaram?

## Ownership

- **Backend/API Docs**: Time de Backend.
- **Frontend Docs**: Time de Frontend.
- **Core/Workers**: Time de Engenharia de Dados/ML.
- **Runbook/Infra**: DevOps/SRE.

## Anti-Duplicação

Não copie explicações. Se `RUNBOOK.md` precisa explicar como configurar a fila, aponte para `CORE.md` onde a fila é definida, ou vice-versa. Mantenha a "Single Source of Truth".
