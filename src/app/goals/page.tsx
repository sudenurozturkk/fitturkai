'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type Goal = {
  _id?: string;
  userId: string;
  title: string;
  description: string;
  type: 'weight' | 'fitness' | 'nutrition' | 'lifestyle';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string | Date;
  milestones: any[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  completed?: boolean;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'weight' | 'fitness' | 'nutrition' | 'lifestyle'>('weight');
  const [targetValue, setTargetValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  // Kullanıcıya özel anahtar
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';
  const goalsKey = `goals_${userEmail}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!userEmail) {
        router.push('/auth/login');
        return;
      }
      setChecked(true);
    }
  }, [router, userEmail]);

  const fetchGoals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/goals?userId=${userEmail}`);
      if (!response.ok) throw new Error('Hedefler alınamadı');
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError('Hedefler alınamadı');
    } finally {
    setIsLoading(false);
    }
  };

  useEffect(() => {
    if (checked && userEmail) {
      fetchGoals();
    }
  }, [checked, userEmail]);

  const handleCreateGoal = async () => {
    setError(null);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
      title,
      description,
      type,
      targetValue,
      currentValue,
      unit,
      deadline,
      milestones: [],
        }),
      });
      if (!response.ok) throw new Error('Hedef eklenemedi');
      await fetchGoals();
    resetForm();
    } catch (err) {
      setError('Hedef eklenemedi');
    }
  };

  const handleUpdateGoal = async (goal: Goal) => {
    setError(null);
    try {
      const response = await fetch(`/api/goals?id=${goal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
      title,
      description,
      type,
      targetValue,
      currentValue,
      unit,
      deadline,
          milestones: goal.milestones,
        }),
      });
      if (!response.ok) throw new Error('Hedef güncellenemedi');
      await fetchGoals();
    resetForm();
    } catch (err) {
      setError('Hedef güncellenemedi');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/goals?id=${goalId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Hedef silinemedi');
      await fetchGoals();
    } catch (err) {
      setError('Hedef silinemedi');
    }
  };

  const handleAddMilestone = async (goal: Goal) => {
    if (!milestoneTitle.trim()) return;
    
    const newMilestone = {
      id: Date.now().toString(),
      title: milestoneTitle.trim(),
      completed: false,
    };
    
    const updatedGoal = {
      ...goal,
      milestones: [...goal.milestones, newMilestone],
    };
    
    // Önce UI'yi güncelle
    setGoals(goals.map((g) => (g._id === goal._id ? updatedGoal : g)));
    setMilestoneTitle(''); // Input'u temizle
    
    try {
      const response = await fetch(`/api/goals?id=${goal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          title: updatedGoal.title,
          description: updatedGoal.description,
          type: updatedGoal.type,
          targetValue: updatedGoal.targetValue,
          currentValue: updatedGoal.currentValue,
          unit: updatedGoal.unit,
          deadline: updatedGoal.deadline,
          milestones: updatedGoal.milestones,
        }),
      });
      if (!response.ok) throw new Error('Kilometre taşı eklenemedi');
      await fetchGoals(); // Hedefleri yeniden yükle
    } catch (err) {
      setError('Kilometre taşı eklenemedi');
      // Hata durumunda UI'yi geri al ve input'u geri yükle
      setGoals(goals);
      setMilestoneTitle(newMilestone.title);
    }
  };

  const handleToggleMilestone = async (goal: Goal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map((milestone: any) =>
      milestone.id === milestoneId ? { ...milestone, completed: !milestone.completed } : milestone
    );

    const updatedGoal = {
      ...goal,
      milestones: updatedMilestones,
    };
    
    // Önce UI'yi güncelle
    setGoals(goals.map((g) => (g._id === goal._id ? updatedGoal : g)));
    
    // Sonra API'ye kaydet
    try {
      const response = await fetch(`/api/goals?id=${goal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          title: updatedGoal.title,
          description: updatedGoal.description,
          type: updatedGoal.type,
          targetValue: updatedGoal.targetValue,
          currentValue: updatedGoal.currentValue,
          unit: updatedGoal.unit,
          deadline: updatedGoal.deadline,
          milestones: updatedGoal.milestones,
        }),
      });
      if (!response.ok) throw new Error('Kilometre taşı durumu kaydedilemedi');
      await fetchGoals(); // Hedefleri yeniden yükle
    } catch (err) {
      setError('Kilometre taşı durumu kaydedilemedi');
      // Hata durumunda UI'yi geri al
      setGoals(goals);
    }
  };

  const handleToggleGoalCompleted = async (goalId: string) => {
    const goal = goals.find((g) => String(g._id) === goalId);
    if (!goal) return;

    // Eğer tamamlanacaksa ve ilerleme %100 değilse, izin verme
    const progress = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
    if (!goal.completed && progress < 100) {
      setError('Hedefi tamamlanmış olarak işaretlemek için ilerlemenin %100 olması gerekir!');
      return;
    }

    const isCompleted = !goal.completed;
    let updatedMilestones = goal.milestones;
    if (goal.milestones && goal.milestones.length > 0) {
      updatedMilestones = goal.milestones.map((milestone: any) => ({
        ...milestone,
        completed: isCompleted
      }));
    }

    const updatedGoal = {
      ...goal,
      completed: isCompleted,
      milestones: updatedMilestones
    };

    setGoals(goals.map((g) =>
      String(g._id) === goalId ? updatedGoal : g
    ));

    try {
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedGoal,
          userId: userEmail,
          milestones: updatedGoal.milestones,
        }),
      });
      if (!response.ok) throw new Error('Hedef tamamlanma durumu kaydedilemedi');
      await fetchGoals();
    } catch (err) {
      setError('Hedef tamamlanma durumu kaydedilemedi');
      setGoals(goals);
    }
  };

  const handleDeleteMilestone = async (goal: Goal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.filter((milestone: any) => milestone.id !== milestoneId);
    
    const updatedGoal = {
      ...goal,
      milestones: updatedMilestones,
    };
    
    // Önce UI'yi güncelle
    setGoals(goals.map((g) => (g._id === goal._id ? updatedGoal : g)));
    
    try {
      const response = await fetch(`/api/goals?id=${goal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          title: updatedGoal.title,
          description: updatedGoal.description,
          type: updatedGoal.type,
          targetValue: updatedGoal.targetValue,
          currentValue: updatedGoal.currentValue,
          unit: updatedGoal.unit,
          deadline: updatedGoal.deadline,
          milestones: updatedGoal.milestones,
        }),
      });
      if (!response.ok) throw new Error('Kilometre taşı silinemedi');
      await fetchGoals(); // Hedefleri yeniden yükle
    } catch (err) {
      setError('Kilometre taşı silinemedi');
      // Hata durumunda UI'yi geri al
      setGoals(goals);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('weight');
    setTargetValue(0);
    setCurrentValue(0);
    setUnit('');
    setDeadline('');
    setIsCreating(false);
    setEditingGoal(null);
  };

  const calculateProgress = (goal: Goal) => {
    if (goal.completed) return 100;
    return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
  };

  // Tamamlanan hedef sayısı kadar meyve/sebze göster
  const completedGoals = goals.filter((g) => g.completed);

  // Meyve ve sebze emojileri
  const foodEmojis = ['🍎', '🥕', '🍇', '🥦', '🍓', '🥬', '🍊', '🥒', '🍐', '🌽'];

  if (!checked) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light dark:bg-neutral-dark">
        <main className="md:ml-64 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-red-50 dark:from-blue-900 dark:via-green-900 dark:to-red-900">
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-fitness-blue via-fitness-green to-fitness-orange bg-clip-text text-transparent mb-4 text-center drop-shadow-lg">
            Hedefler
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto">
              Hedeflerini belirle, ilerlemeni takip et ve başarıya ulaş! Her hedef için kilometre
              taşları ekleyebilirsin.
            </p>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Hedef Oluşturma/Düzenleme Formu */}
          <AnimatePresence>
            {(isCreating || editingGoal) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card mb-8 bg-white/95 dark:bg-neutral-900/90 rounded-2xl shadow-2xl p-8 border border-fitness-blue/30"
              >
                <h2 className="text-2xl font-heading font-bold mb-4 text-fitness-blue dark:text-fitness-green">
                  {editingGoal ? 'Hedefi Düzenle' : 'Yeni Hedef'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Başlık
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                      placeholder="Hedef başlığı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                      rows={3}
                      placeholder="Hedef açıklaması"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hedef Tipi
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as Goal['type'])}
                        className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                      >
                        <option value="weight">Kilo</option>
                        <option value="fitness">Fitness</option>
                        <option value="nutrition">Beslenme</option>
                        <option value="lifestyle">Yaşam Tarzı</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Birim
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                        placeholder="kg, km, adet, vb."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hedef Değer
                      </label>
                      <input
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                        className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mevcut Değer
                      </label>
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => setCurrentValue(parseFloat(e.target.value))}
                        className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button onClick={resetForm} className="btn-secondary rounded-xl">
                      İptal
                    </button>
                    <button
                      onClick={() =>
                        editingGoal ? handleUpdateGoal(editingGoal) : handleCreateGoal()
                      }
                      className="btn-primary rounded-xl"
                    >
                      {editingGoal ? 'Güncelle' : 'Oluştur'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hedef Listesi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 opacity-60">
                <img src="/empty-goals.svg" alt="Boş Hedefler" className="w-32 h-32 mb-4" />
                <p className="text-lg font-semibold">
                  Henüz hiç hedefin yok. Hemen bir hedef ekle!
                </p>
              </div>
            )}
            {goals.map((goal) => (
              <motion.div
                key={String(goal._id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.12)' }}
                className={`card bg-white/90 dark:bg-neutral-900/80 rounded-2xl shadow-xl p-6 transition-all duration-200 border-2 border-fitness-blue/40 hover:border-fitness-green ${goal.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-lg font-bold flex-1 truncate ${goal.completed ? 'line-through text-green-600 dark:text-green-400' : 'text-fitness-blue dark:text-fitness-green'}`}>{goal.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {goal.type === 'weight' && 'Kilo'}
                      {goal.type === 'fitness' && 'Fitness'}
                      {goal.type === 'nutrition' && 'Beslenme'}
                      {goal.type === 'lifestyle' && 'Yaşam Tarzı'}
                    </p>
                  </div>
                  <div className="flex space-x-2 items-center">
                    <button
                      onClick={() => handleToggleGoalCompleted(String(goal._id))}
                      className={`p-2 rounded-full border-2 transition-all duration-200 ${goal.completed ? 'bg-gradient-to-r from-fitness-green to-green-400 text-white border-fitness-green scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-700 hover:scale-105'}`}
                      title={goal.completed ? 'Tamamlandı' : 'Tamamla'}
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setTitle(goal.title);
                        setDescription(goal.description);
                        setType(goal.type);
                        setTargetValue(goal.targetValue);
                        setCurrentValue(goal.currentValue);
                        setUnit(goal.unit);
                        setDeadline(new Date(goal.deadline).toISOString().split('T')[0]);
                      }}
                      className="p-2 text-gray-500 hover:text-primary"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(String(goal._id))}
                      className="p-2 text-gray-500 hover:text-red-500"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-200 mb-4 min-h-[40px]">
                  {goal.description}
                </p>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>İlerleme</span>
                    <span>{calculateProgress(goal)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={`h-3 rounded-full ${goal.completed ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-fitness-blue to-fitness-green'}`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${calculateProgress(goal)}%`,
                      }}
                      transition={{ duration: 0.8 }}
                      style={{
                        width: `${calculateProgress(goal)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>
                      {goal.currentValue} {goal.unit}
                    </span>
                    <span>
                      {goal.targetValue} {goal.unit}
                    </span>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">
                    Kilometre Taşları 
                    {goal.milestones.length > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({goal.milestones.filter((m: any) => m.completed).length}/{goal.milestones.length})
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {goal.milestones.map((milestone: any, idx: number) => (
                      <div key={milestone.id || idx} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <button
                            onClick={() => handleToggleMilestone(goal, milestone.id)}
                            className={`p-1 rounded-full border-2 transition-all duration-200 ${milestone.completed ? 'bg-gradient-to-r from-fitness-blue to-fitness-green text-white border-fitness-blue scale-110' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-700 hover:scale-105'}`}
                            title={milestone.completed ? 'Tamamlandı' : 'Tamamla'}
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <span className={`text-sm ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                            {milestone.title}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteMilestone(goal, milestone.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Kilometre taşını sil"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    placeholder="Yeni kilometre taşı ekle..."
                    className="input flex-1 rounded-xl shadow focus:ring-2 focus:ring-fitness-blue text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && milestoneTitle.trim()) {
                        handleAddMilestone(goal);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddMilestone(goal)}
                    disabled={!milestoneTitle.trim()}
                    className="btn-secondary rounded-xl text-sm px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ekle
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Meyve/Sebze Animasyonu */}
          {completedGoals.length > 0 && (
            <div className="flex justify-center items-end mt-12 gap-6">
              {completedGoals.map((goal, idx) => {
                const foodEmoji = foodEmojis[idx % foodEmojis.length];
                return (
                  <div
                    key={goal._id || idx}
                    className="relative flex flex-col items-center"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  >
                    <motion.div
                      initial={{ scale: 0, y: 50 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: idx * 0.2
                      }}
                      className="text-6xl transform hover:scale-110 transition-transform duration-300"
                    >
                      {foodEmoji}
                    </motion.div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {goal.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Yeni Hedef Ekleme Butonu */}
          {!isCreating && !editingGoal && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsCreating(true)}
              className="fixed bottom-8 right-8 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
            >
              <PlusIcon className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </main>
    </div>
  );
}
