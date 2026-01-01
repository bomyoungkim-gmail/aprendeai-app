# Hooks Domain Layer

## Propósito

Esta pasta contém **hooks de casos de uso** que orquestram lógica de negócio.

## Responsabilidade

- ✅ Orquestrar múltiplas operações
- ✅ Validação de dados de negócio
- ✅ Navegação após ações
- ✅ Feedback ao usuário (toasts, modals)
- ✅ Transformação de dados
- ✅ Side effects complexos
- ❌ **NÃO** deve fazer chamadas diretas à API (usar hooks/data)

## Padrão

```typescript
// hooks/domain/use-submit-game-result.ts
import { useSubmitGameResultMutation } from "@/hooks/data/use-games-data";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useSubmitGameResult() {
  const router = useRouter();
  const mutation = useSubmitGameResultMutation();

  const submitResult = async (gameId: string, score: number, won: boolean) => {
    // Validação de negócio
    if (score < 0 || score > 100) {
      toast.error("Score inválido");
      return;
    }

    try {
      // Usar hook de data
      await mutation.mutateAsync({
        gameId,
        result: {
          score,
          totalQuestions: 1,
          correctCount: won ? 1 : 0,
          timeSpentSeconds: 0,
        },
      });

      // Side effects
      toast.success("Resultado salvo!");
      router.push("/dashboard/games");
    } catch (error) {
      toast.error("Erro ao salvar resultado");
      console.error(error);
    }
  };

  return {
    submitResult,
    isSubmitting: mutation.isPending,
  };
}
```

## Naming Convention

- `use[Action][Entity]` → `useSubmitGameResult`, `useCreateHighlight`, `useStartGame`
- Verbos de ação: `submit`, `create`, `update`, `delete`, `start`, `finish`

## Imports Permitidos

- ✅ `@/hooks/data/*` (para acessar dados)
- ✅ `@/hooks/ui/*` (para UI utilities)
- ✅ `next/navigation` (para navegação)
- ✅ `sonner` ou `react-hot-toast` (para feedback)
- ✅ `@/lib/schemas/*` (para validação)
- ❌ `@/services/api/*` (usar hooks/data em vez disso)
- ❌ `@/components/*` (evitar circular deps)

## Exemplos

### Caso de Uso Simples

```typescript
export function useStartGame() {
  const router = useRouter();

  const startGame = (gameId: string) => {
    // Validação
    if (!gameId) {
      toast.error("Game ID inválido");
      return;
    }

    // Navegação
    router.push(`/games/${gameId}/play`);
    toast.success("Jogo iniciado!");
  };

  return { startGame };
}
```

### Caso de Uso com Múltiplas Operações

```typescript
export function useCreateHighlight() {
  const createMutation = useCreateHighlightMutation();
  const { refetch: refetchHighlights } = useHighlights(contentId);
  const router = useRouter();

  const createHighlight = async (data: CreateHighlightData) => {
    // Validação
    if (!data.text || data.text.length < 3) {
      toast.error("Texto muito curto");
      return;
    }

    try {
      // Criar
      const highlight = await createMutation.mutateAsync(data);

      // Atualizar cache
      await refetchHighlights();

      // Feedback
      toast.success("Highlight criado!");

      // Navegação opcional
      if (data.navigateAfter) {
        router.push(`/highlights/${highlight.id}`);
      }
    } catch (error) {
      toast.error("Erro ao criar highlight");
    }
  };

  return {
    createHighlight,
    isCreating: createMutation.isPending,
  };
}
```

### Caso de Uso com Validação Complexa

```typescript
export function useFinishSession() {
  const finishMutation = useFinishSessionMutation();
  const { data: session } = useSession(sessionId);

  const finishSession = async () => {
    // Validação de negócio
    if (!session) {
      toast.error("Sessão não encontrada");
      return;
    }

    if (session.status !== "ACTIVE") {
      toast.error("Sessão já finalizada");
      return;
    }

    const duration = Date.now() - new Date(session.startedAt).getTime();
    if (duration < 60000) {
      // < 1 minuto
      toast.warning("Sessão muito curta, continue estudando!");
      return;
    }

    try {
      await finishMutation.mutateAsync(sessionId);
      toast.success("Sessão finalizada!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Erro ao finalizar sessão");
    }
  };

  return {
    finishSession,
    isFinishing: finishMutation.isPending,
  };
}
```

## Quando usar hooks/domain

Use quando você precisa:

- ✅ Validar regras de negócio
- ✅ Orquestrar múltiplas operações
- ✅ Navegar após ação
- ✅ Mostrar feedback ao usuário
- ✅ Transformar dados antes de enviar

## Quando NÃO usar hooks/domain

Se você só precisa:

- ❌ Buscar dados da API → Use `hooks/data/`
- ❌ Comportamento de UI puro → Use `hooks/ui/`

---

_Última atualização: 2026-01-01_
