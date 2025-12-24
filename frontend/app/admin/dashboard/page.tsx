"use client";

import { useEffect, useState } from 'react';

type ClassInfo = {
  class_id: string;
  name: string;
  student_count: number;
  grade_level: string;
};

type Student = {
  user_id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  avg_score: number;
  last_active: string;
};

export default function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classOverview, setClassOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock teacher ID - in production, get from auth context
  const teacherId = "teacher_123";
import { urls } from '@/lib/config/urls';
  const API_URL = urls.ai.base + "/api"; // Update as needed

  useEffect(() => {
    // Fetch teacher's classes
    fetch(`${API_URL}/admin/classes/my-classes/${teacherId}`)
      .then(res => res.json())
      .then(data => {
        setClasses(data.classes || []);
        if (data.classes?.length > 0) {
          setSelectedClassId(data.classes[0].class_id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching classes:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;

    // Fetch class overview and students
    Promise.all([
      fetch(`${API_URL}/admin/class/${selectedClassId}/overview`).then(r => r.json()),
      fetch(`${API_URL}/admin/class/${selectedClassId}/students`).then(r => r.json())
    ])
      .then(([overview, studentsData]) => {
        setClassOverview(overview);
        setStudents(studentsData.students || []);
      })
      .catch(err => console.error("Error fetching class data:", err));
  }, [selectedClassId]);

  if (loading) {
    return <div className="p-8 text-center">Carregando dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-indigo-900">Dashboard do Professor</h1>

      {/* Class Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione uma Turma
        </label>
        <select
          value={selectedClassId || ""}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          {classes.map(cls => (
            <key={cls.class_id} value={cls.class_id}>
              {cls.name} ({cls.student_count} alunos)
            </option>
          ))}
        </select>
      </div>

      {classOverview && (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total de Alunos</h3>
            <p className="text-3xl font-bold text-gray-900">{classOverview.student_count}</p>
            <p className="text-sm text-green-600 mt-1">{classOverview.active_students} ativos</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Média de Engajamento</h3>
            <p className="text-3xl font-bold text-gray-900">{classOverview.avg_daily_minutes} min/dia</p>
            <p className="text-sm text-gray-500 mt-1">Tempo médio diário</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Ofensiva Média</h3>
            <p className="text-3xl font-bold text-gray-900">{classOverview.avg_streak} dias</p>
            <p className="text-sm text-gray-500 mt-1">Streak da turma</p>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Alunos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  XP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ofensiva
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Média
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Atividade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(student => (
                <tr key={student.user_id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      Nível {student.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.xp.toLocaleString()} XP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-orange-600">
                      🔥 {student.streak} dias
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${student.avg_score >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {student.avg_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.last_active}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
