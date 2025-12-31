"use client";

import { useEffect, useState } from 'react';
import { useMyClassrooms } from '@/hooks/content/use-classrooms';
import { CreateClassroomModal } from '@/components/classroom/CreateClassroomModal';
import { StudyItemManager } from '@/components/classroom/StudyItemManager';
import { GradebookGrid } from '@/components/classroom/GradebookGrid';
import { ApprovalList } from '@/components/institution/ApprovalList';
import { Plus, Download, Users, LayoutDashboard, BookOpen, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

type Student = {
  user_id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  avg_score: number;
  last_active: string;
};

type Tab = 'overview' | 'students' | 'gradebook' | 'approvals';

export default function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { data: classes = [], isLoading: classesLoading } = useMyClassrooms();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStudyItemModalOpen, setIsStudyItemModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const user = useAuthStore((state) => state.user);

  const [students, setStudents] = useState<Student[]>([]);
  const [classOverview, setClassOverview] = useState<any>(null);

  const isInstitutionAdmin = user?.contextRole === 'INSTITUTION_EDUCATION_ADMIN' || user?.systemRole === 'ADMIN';

  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Mock data for students and overview
  useEffect(() => {
    if (selectedClassId) {
      setStudents([
        {
          user_id: "s1",
          name: "João Silva",
          email: "joao@example.com",
          level: 5,
          xp: 2500,
          streak: 12,
          avg_score: 85,
          last_active: "Hoje, 10:30"
        },
        {
          user_id: "s2",
          name: "Maria Oliveira",
          email: "maria@example.com",
          level: 4,
          xp: 1800,
          streak: 5,
          avg_score: 72,
          last_active: "Ontem"
        }
      ]);
      setClassOverview({
        student_count: 24,
        active_students: 18,
        avg_daily_minutes: 42,
        avg_streak: 8.5
      });
    }
  }, [selectedClassId]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selecione uma Turma
            </label>
            {user?.contextRole === 'TEACHER' && (
              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">
                <CheckCircle className="w-3 h-3 mr-1" /> VERIFICADO
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedClassId || ""}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full md:w-72 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              disabled={classesLoading}
            >
              {classesLoading ? (
                <option>Carregando turmas...</option>
              ) : classes.length === 0 ? (
                <option>Nenhuma turma encontrada</option>
              ) : (
                classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.gradeLevel ? `(${cls.gradeLevel})` : ''}
                  </option>
                ))
              )}
            </select>
            
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              title="Nova Turma"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button 
            onClick={() => setIsStudyItemModalOpen(true)}
            disabled={!selectedClassId}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl mb-8 w-fit">
        <TabButton 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
          icon={<LayoutDashboard className="w-4 h-4" />}
          label="Resumo" 
        />
        <TabButton 
          active={activeTab === 'students'} 
          onClick={() => setActiveTab('students')} 
          icon={<Users className="w-4 h-4" />}
          label="Alunos" 
        />
        <TabButton 
          active={activeTab === 'gradebook'} 
          onClick={() => setActiveTab('gradebook')} 
          icon={<FileText className="w-4 h-4" />}
          label="Diário" 
        />
        {isInstitutionAdmin && (
          <TabButton 
            active={activeTab === 'approvals'} 
            onClick={() => setActiveTab('approvals')} 
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Verificações" 
          />
        )}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && classOverview && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Alunos</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{classOverview.student_count}</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">{classOverview.active_students} ativos</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Engajamento Médio</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{classOverview.avg_daily_minutes} min</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Média diária por aluno</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <LayoutDashboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ofensiva da Turma</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{classOverview.avg_streak} dias</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consistência média</p>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Alunos Matriculados
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {students.length} alunos
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nível</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">XP</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ofensiva</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Média</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Atividade</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {students.map(student => (
                    <tr key={student.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-white">{student.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                          Nível {student.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {student.xp.toLocaleString()} XP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          🔥 {student.streak}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${student.avg_score >= 80 ? 'text-green-600' : student.avg_score >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {student.avg_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {student.last_active}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gradebook' && selectedClassId && (
          <GradebookGrid classroomId={selectedClassId} />
        )}

        {activeTab === 'approvals' && user?.activeInstitutionId && (
          <ApprovalList institutionId={user.activeInstitutionId} />
        )}
      </div>

      <CreateClassroomModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <StudyItemManager 
        classroomId={selectedClassId || ''} 
        isOpen={isStudyItemModalOpen} 
        onClose={() => setIsStudyItemModalOpen(false)} 
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${active 
          ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}
