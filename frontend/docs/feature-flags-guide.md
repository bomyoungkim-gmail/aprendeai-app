# Feature Flags - Guia de Uso

## 📋 Overview

Sistema de feature flags para permitir rollback instantâneo durante a refatoração arquitetural.

## 🎯 Como Usar

### 1. Configuração Inicial

**Copiar template:**

```bash
cp .env.example .env.local
```

**Editar `.env.local`:**

```bash
# Todas as flags começam como 'false' (seguro)
NEXT_PUBLIC_USE_SERVICES=false
NEXT_PUBLIC_USE_NEW_HOOKS=false
NEXT_PUBLIC_USE_STORAGE=false
# ...
```

### 2. No Código

**Import:**

```typescript
import { features, useFeature } from "@/lib/config/features";
```

**Uso direto:**

```typescript
// Verificar flag diretamente
if (features.useServices) {
  // Usar nova implementação
  return serviceLayer.fetch();
} else {
  // Usar implementação antiga (fallback)
  return legacyFetch();
}
```

**Com helper:**

```typescript
// Usando helper function
const useNewArchitecture = useFeature("useServices");

if (useNewArchitecture) {
  // código novo
} else {
  // código legado
}
```

**Em hooks:**

```typescript
export function useGameProgress() {
  const useNewVersion = useFeature("useNewHooks");

  return useQuery({
    queryKey: ["game-progress"],
    queryFn: useNewVersion
      ? () => progressService.fetch() // NOVO
      : () => legacyFetchProgress(), // LEGADO
  });
}
```

### 3. Debugging

**Ver flags ativas (dev):**

```typescript
import { getEnabledFeatures, getAllFeatures } from "@/lib/config/features";

// Console log automático em development
// Output: 🚩 Feature Flags Enabled: useServices, useStorage

// Programaticamente
console.log(getAllFeatures());
// { useServices: true, useNewHooks: false, ... }
```

## 🚀 Deployment Strategy

### Canary Deployment (Recomendado)

**Step 1: Deploy com flag OFF**

```bash
# .env.production
NEXT_PUBLIC_USE_SERVICES=false
```

✅ Deploy em produção  
✅ 100% usuários com código legado

**Step 2: Enable para 10% usuários**

```bash
# Alterar .env.production
NEXT_PUBLIC_USE_SERVICES=true
```

✅ Rebuild & redeploy  
✅ Monitor Sentry por 24h

**Step 3: Scale up se OK**

- 10% → 50% (monitor 24h)
- 50% → 100% (monitor 1 semana)

**Step 4: Rollback se necessário**

```bash
# Instantâneo: mudar .env
NEXT_PUBLIC_USE_SERVICES=false
```

✅ Rebuild & redeploy (~5 min)

### Feature Flags por Fase

**Fase 1 (Fundação):**

```bash
NEXT_PUBLIC_USE_STORAGE=true
```

**Fase 2 (Services):**

```bash
NEXT_PUBLIC_USE_SERVICES=true
NEXT_PUBLIC_USE_OFFLINE_QUEUE=true
NEXT_PUBLIC_USE_WS_SERVICE=true
```

**Fase 3 (Hooks):**

```bash
NEXT_PUBLIC_USE_NEW_HOOKS=true
```

## ⚠️ Importante

### Regras

1. **Nunca remover flag antes de 2 semanas em prod**
2. **Sempre ter fallback (código legado)**
3. **Monitor Sentry após enable**
4. **Documentar quando flag removida**

### Quando Remover Flags

**Critérios:**

- ✅ Flag em prod (100%) por 2+ semanas
- ✅ Zero bugs relacionados
- ✅ Performance OK
- ✅ Código legado não é mais necessário

**Como remover:**

```typescript
// ❌ Antes (com flag)
const data = useFeature("useServices") ? service.fetch() : legacyFetch();

// ✅ Depois (sem flag)
const data = service.fetch();
```

## 📝 Listagem de Flags

| Flag                     | Propósito         | Fase | Status       |
| ------------------------ | ----------------- | ---- | ------------ |
| `useServices`            | Services layer    | 2    | 🟡 Planejada |
| `useNewHooks`            | Hooks refatorados | 3    | 🟡 Planejada |
| `useStorageService`      | Storage abstração | 1    | 🟡 Planejada |
| `useWebSocketService`    | WS singleton      | 2    | 🟡 Planejada |
| `useOfflineQueueService` | Offline queue     | 2    | 🟡 Planejada |

**Status:**

- 🟡 Planejada - Flag criada, feature não implementada
- 🟢 Ativa - Feature implementada, em uso
- 🔴 Depreciada - Flag será removida em breve
- ✅ Removida - Flag não existe mais

## 🔧 Troubleshooting

**Flag não funciona:**

```bash
# 1. Verificar .env.local existe
ls .env.local

# 2. Verificar valor (deve ser string 'true')
cat .env.local | grep NEXT_PUBLIC_USE_SERVICES

# 3. Restart dev server
npm run dev
```

**Console não mostra flags:**

```typescript
// Apenas em NODE_ENV=development
// Em production, não há log automático
```

---

**Criado:** Fase 0.3  
**Última atualização:** 2025-12-27
