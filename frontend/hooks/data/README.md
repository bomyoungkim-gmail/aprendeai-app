# Hooks Data Layer

## Propósito

Esta pasta contém **hooks de acesso a dados** usando React Query.

## Responsabilidade

- ✅ Queries (GET) - buscar dados da API
- ✅ Mutations (POST/PUT/DELETE) - modificar dados
- ✅ Cache management via React Query
- ✅ Loading/error states
- ❌ **NÃO** deve conter lógica de negócio
- ❌ **NÃO** deve conter navegação ou side effects complexos

## Padrão

```typescript
// hooks/data/use-games-data.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { gamesApi } from "@/services/api/games.api";

// Query - buscar dados
export function useGameQuestions(gameId: string) {
  return useQuery({
    queryKey: ["games", gameId, "questions"],
    queryFn: () => gamesApi.getQuestions(gameId),
    enabled: !!gameId,
  });
}

// Mutation - modificar dados
export function useSubmitGameResultMutation() {
  return useMutation({
    mutationFn: ({ gameId, result }: { gameId: string; result: GameResult }) =>
      gamesApi.submitGameResult(gameId, result),
  });
}
```

## Naming Convention

- Queries: `use[Entity][Action]` → `useGameQuestions`, `useCornellNotes`
- Mutations: `use[Action][Entity]Mutation` → `useSubmitGameResultMutation`, `useCreateHighlightMutation`

## Imports Permitidos

- ✅ `@tanstack/react-query`
- ✅ `@/services/api/*`
- ✅ `@/lib/schemas/*` (para types)
- ❌ `@/hooks/domain/*` (evitar circular deps)
- ❌ `@/components/*` (evitar circular deps)

## Exemplos

### Query Simples

```typescript
export function useGameCatalog() {
  return useQuery({
    queryKey: ["games", "catalog"],
    queryFn: () => gamesApi.getCatalog(),
  });
}
```

### Query com Parâmetros

```typescript
export function useGameProgress(gameId: string) {
  return useQuery({
    queryKey: ["games", gameId, "progress"],
    queryFn: () => gamesApi.fetchGameProgress(gameId),
    enabled: !!gameId,
  });
}
```

### Mutation com Invalidação

```typescript
export function useSubmitGameResultMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, result }: SubmitGameParams) =>
      gamesApi.submitGameResult(gameId, result),
    onSuccess: (_, { gameId }) => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries({
        queryKey: ["games", gameId, "progress"],
      });
      queryClient.invalidateQueries({ queryKey: ["games", "catalog"] });
    },
  });
}
```

## Quando NÃO usar hooks/data

Se você precisa:

- Orquestrar múltiplas mutations
- Adicionar navegação após sucesso
- Validar dados antes de enviar
- Mostrar toasts/notificações

→ Use `hooks/domain/` em vez disso!

---

_Última atualização: 2026-01-01_
