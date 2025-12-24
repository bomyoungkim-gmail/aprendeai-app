"""
AI Study Buddy - Personalized Chat Tutor

Provides 24/7 tutoring assistance with conversation memory and student context awareness.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import defaultdict
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from llm_factory import LLMFactory

logger = logging.getLogger(__name__)

class StudyBuddy:
    """
    AI-powered study companion that provides personalized tutoring.
    """
    
    def __init__(self):
        self.llm_factory = LLMFactory()
        # Use TIER_SMART for quality tutoring
        self.llm = self.llm_factory.get_smart_llm(temperature=0.7)
        
        # In-memory chat history (use Redis/DB in production)
        self.chat_histories: Dict[str, List[Dict[str, str]]] = defaultdict(list)
    
    def _build_system_prompt(self, student_context: Optional[Dict[str, Any]] = None) -> str:
        """Build personalized system prompt based on student context."""
        base_prompt = """Você é um tutor de IA amigável e paciente chamado "Buddy". 
        
Seu papel:
- Ajudar estudantes a entender conceitos difíceis
- Encorajar aprendizado independente (não dar respostas diretas)
- Usar analogias e exemplos do dia-a-dia
- Adaptar explicações ao nível do aluno
- Ser encorajador e motivador

Método de ensino:
1. Fazer perguntas socráticas para guiar o raciocínio
2. Quebrar problemas complexos em passos simples
3. Celebrar acertos e guiar suavemente em erros
4. Sugerir recursos e práticas adicionais quando relevante
"""
        
        if student_context:
            level = student_context.get("grade_level", "desconhecido")
            strengths = student_context.get("strengths", [])
            struggles = student_context.get("struggles", [])
            
            context_info = f"\n\nContexto do Aluno:\n"
            context_info += f"- Nível: {level}\n"
            if strengths:
                context_info += f"- Pontos Fortes: {', '.join(strengths)}\n"
            if struggles:
                context_info += f"- Dificuldades: {', '.join(struggles)}\n"
            
            base_prompt += context_info
        
        return base_prompt
    
    async def chat(
        self,
        user_id: str,
        message: str,
        student_context: Optional[Dict[str, Any]] = None,
        reset_history: bool = False
    ) -> Dict[str, Any]:
        """
        Process a chat message from student.
        
        Args:
            user_id: Student identifier
            message: Student's question/message
            student_context: Optional context (grade, strengths, struggles)
            reset_history: Clear conversation history
            
        Returns:
            Tutor's response with metadata
        """
        if reset_history:
            self.chat_histories[user_id] = []
        
        # Build conversation history
        history = self.chat_histories[user_id]
        
        # Create messages list
        messages = [
            SystemMessage(content=self._build_system_prompt(student_context))
        ]
        
        # Add chat history
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current message
        messages.append(HumanMessage(content=message))
        
        try:
            # Get response
            response = await self.llm.ainvoke(messages)
            response_text = response.content
            
            # Store in history
            self.chat_histories[user_id].append({"role": "user", "content": message})
            self.chat_histories[user_id].append({"role": "assistant", "content": response_text})
            
            # Limit history to last 20 messages
            if len(self.chat_histories[user_id]) > 20:
                self.chat_histories[user_id] = self.chat_histories[user_id][-20:]
            
            return {
                "response": response_text,
                "conversation_length": len(self.chat_histories[user_id]) // 2,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return {
                "response": "Desculpe, tive um problema técnico. Pode reformular sua pergunta?",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def suggest_practice(
        self,
        user_id: str,
        topic: str,
        difficulty: int = 3
    ) -> Dict[str, Any]:
        """
        Generate practice problems for a topic.
        
        Args:
            user_id: Student identifier
            topic: Subject to practice
            difficulty: 1-5
            
        Returns:
            Practice problems with solutions
        """
        prompt = ChatPromptTemplate.from_template(
            """Crie 3 problemas práticos sobre {topic} para um aluno de nível {difficulty}/5.
            
            Para cada problema:
            1. Enunciado claro
            2. Dica sutil (sem revelar a resposta)
            3. Solução passo-a-passo (separada)
            
            Formato JSON:
            {{
                "problems": [
                    {{
                        "question": "...",
                        "hint": "...",
                        "solution": "..."
                    }}
                ]
            }}
            """
        )
        
        try:
            from langchain_core.output_parsers import JsonOutputParser
            chain = prompt | self.llm | JsonOutputParser()
            
            result = await chain.ainvoke({
                "topic": topic,
                "difficulty": difficulty
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating practice: {e}")
            return {"problems": []}
    
    def get_conversation_summary(self, user_id: str) -> Dict[str, Any]:
        """Get summary of student's conversation history."""
        history = self.chat_histories.get(user_id, [])
        
        if not history:
            return {"total_messages": 0, "topics_discussed": []}
        
        # Simple analysis
        user_messages = [msg["content"] for msg in history if msg["role"] == "user"]
        
        return {
            "total_messages": len(history) // 2,
            "last_interaction": "recent",  # Mock
            "engagement_level": "alto" if len(history) > 10 else "médio",
            "sample_questions": user_messages[-3:] if len(user_messages) >= 3 else user_messages
        }
    
    def clear_history(self, user_id: str):
        """Clear conversation history for a user."""
        if user_id in self.chat_histories:
            del self.chat_histories[user_id]


# Singleton
study_buddy = StudyBuddy()
