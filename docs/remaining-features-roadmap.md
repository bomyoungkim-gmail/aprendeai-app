# AprendeAI - Roadmap de Funcionalidades Pendentes

**Data de Criação**: 23 de Dezembro de 2025  
**Versão**: 1.1  
**Status Atual**: 28+ funcionalidades implementadas

---

## ✅ Funcionalidades JÁ Implementadas

### Core System

1. ✅ **20+ Game Modes** (Solo & Multiplayer)
2. ✅ **Google Gemini Integration** (TIER_CHEAP para economia)
3. ✅ **LangChain/LangGraph Educator Agent**
4. ✅ **A/B Testing Framework**
5. ✅ **User Preference Learning** (Personalização de jogos)
6. ✅ **Dataset Collection** (Fine-tuning preparado)

### Advanced Features

7. ✅ **Gamification Engine** (XP, Levels, Badges, Streaks)
8. ✅ **Content Ingestion Pipeline** (PDF + YouTube)
9. ✅ **Adaptive Learning Path** (Skill modeling, difficulty adjustment)
10. ✅ **Social Features** (Friends, Challenges, Leaderboards)
11. ✅ **Admin Dashboard** (Gestão escolar/turmas)

### AI-Powered Features

12. ✅ **Multiplayer Real-Time Games** (WebSocket, room manager)
13. ✅ **AI Content Generator** (Lesson/Unit generation)
14. ✅ **Parent Dashboard** (Progress reports, safety metrics)
15. ✅ **Offline Mode & PWA** (Cache versionado)
16. ✅ **AI Study Buddy** (Chat tutor 24/7)
17. ✅ **Automated Grading** (Rubric-based, essays)
18. ✅ **Advanced Analytics Dashboard** (Learning curves, heatmaps, predictive insights)
19. ✅ **Whiteboard Collaboration** (Real-time drawing, WebSocket sync)
20. ✅ **Spaced Repetition System (SRS)** (SM-2 algorithm, retenção científica)

---

## 📋 Funcionalidades PENDENTES (Prioridade Alta)

### Opção 12: Gemini Live API (Conversação por Voz em Tempo Real) 🎙️

**Descrição**: Integração com Gemini Multimodal Live API para conversação por voz em tempo real.

**Valor de Negócio**:

- Prática de idiomas com pronúncia real
- Feedback imediato em conversação oral
- Experiência imersiva (especialmente para Roleplay)

**Requisitos Técnicos**:

- **Frontend**: MediaRecorder API, WebSocket para áudio streaming
- **Backend**: Gemini Live API endpoint, audio processing
- **Latência**: < 500ms round-trip para naturalidade

**Complexidade**: Média-Alta  
**Estimativa**: 2-3 dias  
**Dependências**: Gemini API key com acesso ao Live API

**Implementação Sugerida**:

```python
# services/ai/voice/live_session.py
class GeminiLiveSession:
    async def start_voice_session(user_id, mode="roleplay"):
        # Initialize Gemini Live WebSocket
        # Stream audio bidirectionally
        # Apply game context (e.g., roleplay character)
        pass
```

**Endpoints**:

- `WS /ws/voice/live/{user_id}?mode={game_mode}`

**Frontend Integration**:

- Botão "Modo Voz" em jogos suportados (Roleplay, Tutor)
- Visualização de onda sonora durante fala
- Transcrição em tempo real

---

### Opção 20: Pronunciation Feedback (Avaliação de Pronúncia) 🗣️

**Descrição**: Sistema de avaliação de pronúncia usando Web Speech API ou Whisper.

**Valor de Negócio**:

- Feedback específico sobre erros de pronúncia
- Comparação com pronúncia correta
- Gamificação da prática oral

**Requisitos Técnicos**:

- **API**: OpenAI Whisper ou Google Speech-to-Text
- **Processamento**: Phoneme matching, acoustic scoring
- **Frontend**: MediaRecorder, waveform visualization

**Complexidade**: Média  
**Estimativa**: 1-2 dias

**Implementação Sugerida**:

```python
# services/ai/voice/pronunciation.py
class PronunciationEvaluator:
    async def evaluate_pronunciation(audio_file, expected_text, lang="pt-BR"):
        # Transcribe audio
        # Compare with expected text
        # Phonetic analysis
        # Return score + specific errors
        pass
```

**Métricas Retornadas**:

- **Overall Score**: 0-100
- **Phoneme Errors**: Lista de sons incorretos
- **Fluency**: Velocidade de fala
- **Intonation**: Entonação apropriada

---

### Opção 22: Certification System (Diplomas Digitais) 🎓

**Descrição**: Sistema de certificação formal ao completar trilhas/cursos.

**Valor de Negócio**:

- Validação social (compartilhar conquistas)
- Motivação para completar cursos
- Portfólio do aluno (currículo)

**Requisitos Técnicos**:

- **PDF Generation**: jsPDF ou Puppeteer
- **Template Design**: Certificado visual atraente
- **Blockchain (Opcional)**: Hash do certificado na blockchain para verificação
- **Storage**: Armazenar PDF gerado (S3 ou equivalente)

**Complexidade**: Baixa-Média  
**Estimativa**: 1 dia

**Implementação Sugerida**:

```python
# services/ai/certification/generator.py
class CertificateGenerator:
    async def generate_certificate(user_id, course_id, completion_data):
        # Fetch user info + course info
        # Render template with data
        # Generate PDF
        # Optionally: Hash + blockchain
        # Store and return URL
        pass
```

**Template Sugerido**:

- Logo AprendeAI
- Nome do aluno
- Nome do curso/trilha
- Data de conclusão
- Score final
- QR code para verificação online

---

---

## 📋 Funcionalidades Pendenestres (Prioridade Média)

### Opção 25: React Native Mobile App 📱

**Descrição**: App nativo iOS/Android usando React Native.

**Valor de Negócio**:

- Push notifications nativas (lembrar streak)
- Melhor performance em mobile
- Acesso a recursos nativos (câmera, microfone)
- App stores visibility

**Requisitos Técnicos**:

- **Framework**: React Native with Expo
- **State Management**: Redux ou Zustand
- **Sync**: Sincronização cross-device (Redux Persist)
- **APIs**: Reutilizar todas as APIs existentes

**Complexidade**: Alta  
**Estimativa**: 2-3 semanas

**Nota**: PWA atual já oferece boa experiência mobile. RN é para nível enterprise.

---

### Opção 27 (Extensão): Advanced Whiteboard Features

**Descrição**: Adicionar recursos avançados ao whiteboard já implementado.

**Recursos Adicionais**:

- **LaTeX Rendering**: Escrever equações matemáticas
- **Image Upload**: Colar imagens no whiteboard
- **Recording**: Gravar sessão de whiteboard como vídeo
- **OCR**: Converter handwriting em texto digital
- **Templates**: Templates pré-definidos (gráfico cartesiano, tabela periódica, etc.)

**Complexidade**: Média  
**Estimativa**: 1-2 dias

---

### Opção 29: AR/VR Learning Experiences 🥽

**Descrição**: Experiências imersivas em realidade aumentada/virtual.

use cases\*\*:

- **Química**: Visualizar moléculas 3D interativas
- **Astronomia**: Explorar sistema solar em VR
- **História**: Tours virtuais em sites históricos
- **Anatomia**: Dissecar corpo humano virtual

**Requisitos Técnicos**:

- **Frontend**: WebXR API ou Unity WebGL
- **Modelos 3D**: Biblioteca de assets 3D educacionais
- **Hardware**: Suporte para Meta Quest, VR headsets

**Complexidade**: Muito Alta  
**Estimativa**: 1-2 meses

**Nota**: Nicho muito específico. Priorizar apenas se alvo é adoção institucional com recursos VR.

---

## 📋 Funcionalidades Pendentes (Prioridade Baixa / Nice-to-Have)

### Opção 30: Live Classes Platform (Videoconferência)

**Descrição**: Plataforma de aulas ao vivo com videoconferência integrada.

**Recursos**:

- Vídeo/áudio professor + alunos
- Screen sharing
- Chat ao vivo
- Polls/Quizzes durante aula
- Gravação automática

**Stack Sugerida**: Agora, Jitsi, ou Zoom API

**Complexidade**: Alta  
**Nota**: Mercado muito competitivo (Zoom, Teams, Google Meet). Focar em diferenciação (IA tutora assiste aula).

---

### Opção 31: Marketplace de Conteúdo

**Descrição**: Marketplace para professores venderem lições/cursos criados.

**Modelo de Negócio**:

- Professores criam conteúdo via AI Generator
- Publicam no marketplace (grátis ou pago)
- AprendeAI fica com comissão (15-30%)

**Requisitos**:

- Sistema de pagamentos (Stripe)
- Review/Rating system
- Content moderation (manual ou IA)
- Royalties tracking

**Complexidade**: Alta  
**Estimativa**: 2-3 semanas

---

### Opção 32: Integration with Google Classroom / Canvas LMS

**Descrição**: Integração com sistemas LMS existentes.

**Valor**:

- Sync alunos/turmas automaticamente
- Single Sign-On (SSO)
- Sync notas de volta para LMS

**APIs**:

- Google Classroom API
- Canvas LMS API
- Moodle API

**Complexidade**: Média-Alta  
**Estimativa**: 1 semana por LMS

---

### Opção 33: Accessibility Features (WCAG 2.1 AA)

**Descrição**: Conformidade total com WCAG para acessibilidade.

**Recursos**:

- Screen reader support
- High contrast mode
- Keyboard navigation
- Closed captions em vídeos
- Texto alternativo em imagens
- Dyslexia-friendly fonts

**Complexidade**: Média  
**Estimativa**: 1 semana

**Valor**: Inclusão + requirement para contratos governamentais.

---

## 🎯 Recomendações de Priorização

### Para MVP de Lançamento (B2C)

1. **Opção 22**: Certification (validação social)
2. **Opção 12**: Gemini Live (experiência wow)

### Para Adoção Escolar (B2B2C)

1. **Opção 32**: LMS Integrations (reduz fricção)
2. **Opção 30**: Live Classes (substituir Zoom)
3. **Opção 33**: Accessibility (compliance)

### Para Escala & Retenção

1. **Opção 25**: React Native App (push notifications)
2. **Opção 31**: Marketplace (efeito rede)

---

## 📊 Matriz de Priorização

| Funcionalidade       | Valor de Negócio | Complexidade | Prioridade |
| -------------------- | ---------------- | ------------ | ---------- |
| Certification (22)   | Alta             | Baixa        | 🔴 ALTA    |
| Gemini Live (12)     | Muito Alta       | Alta         | 🟡 MÉDIA   |
| Pronunciation (20)   | Média            | Média        | 🟡 MÉDIA   |
| React Native (25)    | Alta             | Muito Alta   | 🟢 BAIXA   |
| LMS Integration (32) | Alta (B2B)       | Alta         | 🟡 MÉDIA   |
| AR/VR (29)           | Baixa            | Muito Alta   | 🟢 BAIXA   |
| Live Classes (30)    | Média            | Alta         | 🟢 BAIXA   |
| Marketplace (31)     | Média            | Alta         | 🟢 BAIXA   |

---

## 💡 Próximos Passos Sugeridos

1. **Implementar Opção 22** (Certification) para motivação social
2. **Implementar Opção 12** (Gemini Live) para experiência wow de voz
3. **Testar MVP com Beta users** (100-500 alunos)
4. **Coletar métricas de retenção D1/D7/D30**
5. **Iterar baseado em feedback** antes de features complexas

---

**Documento mantido em**: `docs/remaining-features-roadmap.md`  
**Última atualização**: Automática a cada nova implementação
