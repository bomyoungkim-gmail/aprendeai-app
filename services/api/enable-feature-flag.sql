-- Ativar feature flag auth.context_role_v2 globalmente
-- Este script habilita o novo sistema de dual-role (systemRole + contextRole)
INSERT INTO
  feature_flags (id, key, enabled, scope_type, updated_at)
VALUES
  (
    gen_random_uuid (),
    'auth.context_role_v2',
    true,
    'GLOBAL',
    NOW ()
  ) ON CONFLICT (key) DO
UPDATE
SET
  enabled = true,
  updated_at = NOW ();

-- Verificar que foi criado
SELECT
  *
FROM
  feature_flags
WHERE
  key = 'auth.context_role_v2';