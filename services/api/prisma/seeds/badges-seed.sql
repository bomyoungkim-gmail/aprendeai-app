-- Seed Initial Badges for Gamification System
-- Run this script to populate the badges table with initial achievements

-- Streak Badges
INSERT INTO badges (id, name, description, category, icon_url, created_at)
VALUES 
  ('badge-streak-3', '🔥 Iniciante Dedicado', 'Completou 3 dias consecutivos de estudo', 'streak', NULL, NOW()),
  ('badge-streak-7', '⚡ Semana Completa', 'Manteve uma sequência de 7 dias', 'streak', NULL, NOW()),
  ('badge-streak-30', '💪 Mestre da Consistência', 'Sequência incrível de 30 dias!', 'streak', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Milestone Badges
INSERT INTO badges (id, name, description, category, icon_url, created_at)
VALUES 
  ('badge-sessions-10', '📚 Leitor Ativo', 'Completou 10 sessões de leitura', 'milestone', NULL, NOW()),
  ('badge-sessions-50', '🎓 Estudante Dedicado', 'Completou 50 sessões de leitura', 'milestone', NULL, NOW()),
  ('badge-sessions-100', '🏆 Mestre dos Estudos', 'Completou 100 sessões de leitura!', 'milestone', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Time-based Badges
INSERT INTO badges (id, name, description, category, icon_url, created_at)
VALUES 
  ('badge-hours-10', '⏰ 10 Horas de Estudo', 'Acumulou 10 horas de estudo', 'achievement', NULL, NOW()),
  ('badge-hours-50', '🌟 50 Horas de Estudo', 'Acumulou 50 horas de estudo', 'achievement', NULL, NOW()),
  ('badge-hours-100', '💎 100 Horas de Estudo', 'Acumulou 100 horas de estudo!', 'achievement', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Annotation Badges
INSERT INTO badges (id, name, description, category, icon_url, created_at)
VALUES 
  ('badge-notes-25', '✍️ Anotador Iniciante', 'Criou 25 anotações', 'achievement', NULL, NOW()),
  ('badge-notes-100', '📝 Anotador Expert', 'Criou 100 anotações', 'achievement', NULL, NOW()),
  ('badge-notes-500', '🖊️ Mestre das Anotações', 'Criou 500 anotações!', 'achievement', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Special Badges
INSERT INTO badges (id, name, description, category, icon_url, created_at)
VALUES 
  ('badge-first-session', '🎉 Primeira Sessão', 'Completou sua primeira sessão de estudo', 'milestone', NULL, NOW()),
  ('badge-early-bird', '🌅 Madrugador', 'Estudou antes das 7h da manhã', 'achievement', NULL, NOW()),
  ('badge-night-owl', '🦉 Coruja Noturna', 'Estudou depois das 22h', 'achievement', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as total_badges FROM badges;
