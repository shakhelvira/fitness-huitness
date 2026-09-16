import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  Dumbbell, TrendingUp, Plus, Trash2, Calendar, Target,
  Activity, ChevronDown, ChevronUp, Scale, Ruler, LogOut, User,
  Download, Upload, FileJson, Check, X
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

// Types
interface BodyMeasurement {
  id: string;
  date: string;
  weight: number;
  chest: number;
  waist: number;
  hips: number;
  left_arm: number;
  right_arm: number;
  left_thigh: number;
  right_thigh: number;
}

interface ExerciseRecord {
  id: string;
  exercise: string;
  date: string;
  weight: number;
  reps: number;
  sets: number;
}

interface ExerciseDraft {
  exercise: string;
  customExercise: string;
  useCustom: boolean;
  weight: string;
  reps: string;
  sets: string;
}

// Helper functions
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

// Exercise presets
const exercisePresets = [
  'Жим лёжа',
  'Приседания',
  'Становая тяга',
  'Жим стоя',
  'Тяга в наклоне',
  'Подтягивания',
  'Бицепс (штанга)',
  'Трицепс (блок)',
  'Жим ногами',
  'Выпады',
  'Румынская тяга',
  'Тяга верхнего блока',
  'Разводка гантелей',
  'Сгибания на бицепс',
  'Французский жим',
  'Ягодичный мост',
  'Гиперэкстензия',
  'Планка',
  'Скручивания',
  'Жим гантелей сидя',
  'Тяга гантели в наклоне',
  'Отжимания',
  'Болгарские выпады',
];

const createEmptyDraft = (): ExerciseDraft => ({
  exercise: exercisePresets[0],
  customExercise: '',
  useCustom: false,
  weight: '',
  reps: '',
  sets: '',
});

export default function App() {
  const { user, logout } = useAuth();
  const userId = user?.id || 'default';

  const [activeTab, setActiveTab] = useState<'body' | 'exercises' | 'progress'>('body');
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);

  // Body measurement form
  const [bodyForm, setBodyForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    chest: '',
    waist: '',
    hips: '',
    left_arm: '',
    right_arm: '',
    left_thigh: '',
    right_thigh: '',
  });

  // Exercise form - multiple exercises per session
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraft[]>([createEmptyDraft()]);

  // Expanded records
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Show user menu
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Export/Import modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // Load data from Supabase
  useEffect(() => {
    if (!userId || userId === 'default') return;

    const loadData = async () => {
      const { data: bodyData } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (bodyData) {
        setBodyMeasurements(bodyData.map(m => ({
          id: m.id,
          date: m.date,
          weight: m.weight || 0,
          chest: m.chest || 0,
          waist: m.waist || 0,
          hips: m.hips || 0,
          left_arm: m.left_arm || 0,
          right_arm: m.right_arm || 0,
          left_thigh: m.left_thigh || 0,
          right_thigh: m.right_thigh || 0,
        })));
      }

      const { data: exerciseData } = await supabase
        .from('exercise_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (exerciseData) {
        setExerciseRecords(exerciseData.map(r => ({
          id: r.id,
          exercise: r.exercise,
          date: r.date,
          weight: r.weight,
          reps: r.reps,
          sets: r.sets || 1,
        })));
      }
    };

    loadData();
  }, [userId]);

  // Handlers
  const addBodyMeasurement = async () => {
    if (!bodyForm.weight) return;
    const measurementData = {
      user_id: userId,
      date: bodyForm.date,
      weight: parseFloat(bodyForm.weight) || 0,
      chest: parseFloat(bodyForm.chest) || null,
      waist: parseFloat(bodyForm.waist) || null,
      hips: parseFloat(bodyForm.hips) || null,
      left_arm: parseFloat(bodyForm.left_arm) || null,
      right_arm: parseFloat(bodyForm.right_arm) || null,
      left_thigh: parseFloat(bodyForm.left_thigh) || null,
      right_thigh: parseFloat(bodyForm.right_thigh) || null,
    };

    const { data, error } = await supabase
      .from('body_measurements')
      .insert(measurementData)
      .select()
      .single();

    if (error) {
      console.error('Error adding body measurement:', error);
      return;
    }

    if (data) {
      const newMeasurement: BodyMeasurement = {
        id: data.id,
        date: data.date,
        weight: data.weight || 0,
        chest: data.chest || 0,
        waist: data.waist || 0,
        hips: data.hips || 0,
        left_arm: data.left_arm || 0,
        right_arm: data.right_arm || 0,
        left_thigh: data.left_thigh || 0,
        right_thigh: data.right_thigh || 0,
      };
      setBodyMeasurements(prev => [...prev, newMeasurement].sort((a, b) => a.date.localeCompare(b.date)));
    }

    setBodyForm({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      chest: '',
      waist: '',
      hips: '',
      left_arm: '',
      right_arm: '',
      left_thigh: '',
      right_thigh: '',
    });
  };

  const addExerciseDraft = () => {
    setExerciseDrafts([...exerciseDrafts, createEmptyDraft()]);
  };

  const removeExerciseDraft = (index: number) => {
    if (exerciseDrafts.length === 1) return;
    setExerciseDrafts(exerciseDrafts.filter((_, i) => i !== index));
  };

  const updateExerciseDraft = (index: number, field: keyof ExerciseDraft, value: string | boolean) => {
    setExerciseDrafts(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const saveSession = async () => {
    const validDrafts = exerciseDrafts.filter(d => d.weight && d.reps);
    if (validDrafts.length === 0) return;

    const recordsToInsert = validDrafts.map(d => ({
      user_id: userId,
      exercise: d.useCustom ? d.customExercise : d.exercise,
      date: sessionDate,
      weight: parseFloat(d.weight) || 0,
      reps: parseInt(d.reps) || 0,
      sets: parseInt(d.sets) || 1,
    })).filter(r => r.exercise);

    if (recordsToInsert.length === 0) return;

    const { data, error } = await supabase
      .from('exercise_records')
      .insert(recordsToInsert)
      .select();

    if (error) {
      console.error('Error adding exercise records:', error);
      return;
    }

    if (data) {
      const newRecords: ExerciseRecord[] = data.map(r => ({
        id: r.id,
        exercise: r.exercise,
        date: r.date,
        weight: r.weight,
        reps: r.reps,
        sets: r.sets || 1,
      }));
      setExerciseRecords(prev => [...prev, ...newRecords].sort((a, b) => a.date.localeCompare(b.date)));
    }

    // Reset form
    setExerciseDrafts([createEmptyDraft()]);
  };

  const deleteBodyMeasurement = async (id: string) => {
    const { error } = await supabase
      .from('body_measurements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting body measurement:', error);
      return;
    }

    setBodyMeasurements(prev => prev.filter(m => m.id !== id));
  };

  const deleteExerciseRecord = async (id: string) => {
    const { error } = await supabase
      .from('exercise_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exercise record:', error);
      return;
    }

    setExerciseRecords(prev => prev.filter(r => r.id !== id));
  };

  // Export data to JSON file
  const exportData = () => {
    const exportObj = {
      version: 2,
      exportedAt: new Date().toISOString(),
      user: { name: user?.name, email: user?.email },
      bodyMeasurements,
      exerciseRecords,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-planer-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data from JSON file
  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileData = JSON.parse(e.target?.result as string);

        if (!fileData.bodyMeasurements || !fileData.exerciseRecords) {
          throw new Error('Неверный формат файла');
        }

        setImportStatus('success');
        setImportMessage('Загрузка данных...');

        const bodyToInsert = fileData.bodyMeasurements.map((m: BodyMeasurement) => ({
          user_id: userId,
          date: m.date,
          weight: m.weight,
          chest: m.chest || null,
          waist: m.waist || null,
          hips: m.hips || null,
          left_arm: m.left_arm || null,
          right_arm: m.right_arm || null,
          left_thigh: m.left_thigh || null,
          right_thigh: m.right_thigh || null,
        }));

        await supabase.from('body_measurements').insert(bodyToInsert);

        const exercisesToInsert = fileData.exerciseRecords.map((r: ExerciseRecord) => ({
          user_id: userId,
          exercise: r.exercise,
          date: r.date,
          weight: r.weight,
          reps: r.reps,
          sets: r.sets || 1,
        }));

        await supabase.from('exercise_records').insert(exercisesToInsert);

        // Reload data
        const { data: bodyData } = await supabase
          .from('body_measurements')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: true });

        const { data: exerciseData } = await supabase
          .from('exercise_records')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: true });

        if (bodyData) {
          setBodyMeasurements(bodyData.map(m => ({
            id: m.id,
            date: m.date,
            weight: m.weight || 0,
            chest: m.chest || 0,
            waist: m.waist || 0,
            hips: m.hips || 0,
            left_arm: m.left_arm || 0,
            right_arm: m.right_arm || 0,
            left_thigh: m.left_thigh || 0,
            right_thigh: m.right_thigh || 0,
          })));
        }

        if (exerciseData) {
          setExerciseRecords(exerciseData.map(r => ({
            id: r.id,
            exercise: r.exercise,
            date: r.date,
            weight: r.weight,
            reps: r.reps,
            sets: r.sets || 1,
          })));
        }

        setImportStatus('success');
        setImportMessage(`Импортировано: ${fileData.bodyMeasurements.length} замеров, ${fileData.exerciseRecords.length} упражнений`);
        setTimeout(() => {
          setImportStatus('idle');
          setShowImportModal(false);
        }, 2500);
      } catch {
        setImportStatus('error');
        setImportMessage('Ошибка чтения файла. Убедитесь что файл корректный.');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Get unique exercises
  const uniqueExercises = [...new Set(exerciseRecords.map(r => r.exercise))];

  // Get progress data for an exercise
  const getExerciseProgress = (exerciseName: string) => {
    return exerciseRecords
      .filter(r => r.exercise === exerciseName)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => ({
        date: formatDate(r.date),
        weight: r.weight,
        volume: r.weight * r.reps * r.sets,
      }));
  };

  // Body measurement chart data
  const bodyChartData = bodyMeasurements.map(m => ({
    date: formatDate(m.date),
    weight: m.weight,
    chest: m.chest || undefined,
    waist: m.waist || undefined,
    hips: m.hips || undefined,
    left_arm: m.left_arm || undefined,
    right_arm: m.right_arm || undefined,
    left_thigh: m.left_thigh || undefined,
    right_thigh: m.right_thigh || undefined,
  }));

  // Calculate stats
  const latestWeight = bodyMeasurements.length > 0 ? bodyMeasurements[bodyMeasurements.length - 1].weight : null;
  const previousWeight = bodyMeasurements.length > 1 ? bodyMeasurements[bodyMeasurements.length - 2].weight : null;
  const weightDiff = latestWeight && previousWeight ? (latestWeight - previousWeight).toFixed(1) : null;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Фитнес Планер
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">{getGreeting()}, {user?.name} 👋</p>
          </div>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 bg-[var(--color-surface)] border border-purple-500/20 rounded-xl px-3 py-2 hover:bg-[var(--color-surface-light)] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface)] border border-purple-500/20 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="p-3 border-b border-purple-500/10">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
                </div>
                <div className="p-2">
                  <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                    <User className="w-3 h-3 inline mr-1.5" />
                    Записей: {bodyMeasurements.length + exerciseRecords.length}
                  </div>
                  <button
                    onClick={() => { setShowExportModal(true); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Экспорт данных
                  </button>
                  <button
                    onClick={() => { setShowImportModal(true); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Импорт данных
                  </button>
                  <button
                    onClick={() => { setShowGuideModal(true); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-light)] rounded-lg transition-colors"
                  >
                    <FileJson className="w-4 h-4" />
                    Как пользоваться
                  </button>
                  <div className="border-t border-purple-500/10 my-1"></div>
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти из аккаунта
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Quick Stats */}
      {bodyMeasurements.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-[var(--color-text-muted)]">Текущий вес</span>
            </div>
            <p className="text-xl font-bold">{latestWeight} <span className="text-sm font-normal text-[var(--color-text-muted)]">кг</span></p>
            {weightDiff && (
              <p className={`text-xs mt-1 ${parseFloat(weightDiff) <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} кг
              </p>
            )}
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-pink-400" />
              <span className="text-xs text-[var(--color-text-muted)]">Записей</span>
            </div>
            <p className="text-xl font-bold">{bodyMeasurements.length + exerciseRecords.length}</p>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-[var(--color-text-muted)]">Упражнений</span>
            </div>
            <p className="text-xl font-bold">{uniqueExercises.length}</p>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-[var(--color-text-muted)]">Замеров тела</span>
            </div>
            <p className="text-xl font-bold">{bodyMeasurements.length}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 bg-[var(--color-surface)] rounded-xl p-1.5">
        <button
          onClick={() => setActiveTab('body')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'body'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-[var(--color-text-muted)] hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Ruler className="w-4 h-4" />
            <span className="hidden sm:inline">Параметры тела</span>
            <span className="sm:hidden">Тело</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'exercises'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-[var(--color-text-muted)] hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Dumbbell className="w-4 h-4" />
            <span className="hidden sm:inline">Упражнения</span>
            <span className="sm:hidden">Упр.</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'progress'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-[var(--color-text-muted)] hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Прогресс
          </span>
        </button>
      </div>

      {/* Body Measurements Tab */}
      {activeTab === 'body' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Новый замер
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Дата</label>
                <input
                  type="date"
                  value={bodyForm.date}
                  onChange={e => setBodyForm({ ...bodyForm, date: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Вес (кг) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="65.0"
                  value={bodyForm.weight}
                  onChange={e => setBodyForm({ ...bodyForm, weight: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Грудь (см)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="90"
                  value={bodyForm.chest}
                  onChange={e => setBodyForm({ ...bodyForm, chest: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Талия (см)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="68"
                  value={bodyForm.waist}
                  onChange={e => setBodyForm({ ...bodyForm, waist: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Бёдра (см)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="96"
                  value={bodyForm.hips}
                  onChange={e => setBodyForm({ ...bodyForm, hips: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Arms section */}
            <div className="mb-4">
              <p className="text-xs font-medium text-purple-400 mb-2">🦾 Руки (см)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Левая рука</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="30"
                    value={bodyForm.left_arm}
                    onChange={e => setBodyForm({ ...bodyForm, left_arm: e.target.value })}
                    className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Правая рука</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="30"
                    value={bodyForm.right_arm}
                    onChange={e => setBodyForm({ ...bodyForm, right_arm: e.target.value })}
                    className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Legs section */}
            <div className="mb-4">
              <p className="text-xs font-medium text-purple-400 mb-2">🦵 Ноги (см)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Левая нога</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="55"
                    value={bodyForm.left_thigh}
                    onChange={e => setBodyForm({ ...bodyForm, left_thigh: e.target.value })}
                    className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Правая нога</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="55"
                    value={bodyForm.right_thigh}
                    onChange={e => setBodyForm({ ...bodyForm, right_thigh: e.target.value })}
                    className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={addBodyMeasurement}
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-purple-500/25"
            >
              Сохранить замер
            </button>
          </div>

          {/* Body measurement chart */}
          {bodyMeasurements.length > 1 && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
              <h2 className="text-lg font-semibold mb-4">График изменений</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bodyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d3660" />
                    <XAxis dataKey="date" stroke="#a09bb5" fontSize={12} />
                    <YAxis stroke="#a09bb5" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2d2845',
                        border: '1px solid #7c3aed40',
                        borderRadius: '8px',
                        color: '#f1f0f5',
                      }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} name="Вес (кг)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History table */}
          {bodyMeasurements.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                История замеров
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[var(--color-text-muted)] border-b border-purple-500/20">
                      <th className="text-left py-2 px-2">Дата</th>
                      <th className="text-center py-2 px-2">Вес</th>
                      <th className="text-center py-2 px-2">Грудь</th>
                      <th className="text-center py-2 px-2">Талия</th>
                      <th className="text-center py-2 px-2">Бёдра</th>
                      <th className="text-center py-2 px-2">Л.Р.</th>
                      <th className="text-center py-2 px-2">П.Р.</th>
                      <th className="text-center py-2 px-2">Л.Н.</th>
                      <th className="text-center py-2 px-2">П.Н.</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...bodyMeasurements].reverse().map(m => (
                      <tr key={m.id} className="border-b border-purple-500/10 hover:bg-purple-500/5">
                        <td className="py-2.5 px-2 font-medium">{formatDate(m.date)}</td>
                        <td className="text-center py-2.5 px-2">{m.weight} кг</td>
                        <td className="text-center py-2.5 px-2">{m.chest || '—'}</td>
                        <td className="text-center py-2.5 px-2">{m.waist || '—'}</td>
                        <td className="text-center py-2.5 px-2">{m.hips || '—'}</td>
                        <td className="text-center py-2.5 px-2">{m.left_arm || '—'}</td>
                        <td className="text-center py-2.5 px-2">{m.right_arm || '—'}</td>
                        <td className="text-center py-2.5 px-2">{m.left_thigh || '—'}</td>
                        <td className="text-center py-2.5 px-2">{m.right_thigh || '—'}</td>
                        <td className="py-2.5 px-2">
                          <button
                            onClick={() => deleteBodyMeasurement(m.id)}
                            className="text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">Л.Р. = Левая рука • П.Р. = Правая рука • Л.Н. = Левая нога • П.Н. = Правая нога</p>
            </div>
          )}

          {bodyMeasurements.length === 0 && (
            <div className="text-center py-12 text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-2xl border border-purple-500/20">
              <Ruler className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Пока нет замеров</p>
              <p className="text-sm mt-1">Заполни форму выше, чтобы начать отслеживание 📏</p>
            </div>
          )}
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {/* Multi-exercise session form */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Новая тренировка
            </h2>

            <div className="mb-4">
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Дата тренировки</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="w-full md:w-64 bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Exercise drafts */}
            <div className="space-y-3 mb-4">
              {exerciseDrafts.map((draft, index) => (
                <div key={index} className="bg-[var(--color-surface-light)]/50 rounded-xl p-4 border border-purple-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-purple-400">Упражнение #{index + 1}</span>
                    {exerciseDrafts.length > 1 && (
                      <button
                        onClick={() => removeExerciseDraft(index)}
                        className="text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Название</label>
                      {!draft.useCustom ? (
                        <select
                          value={draft.exercise}
                          onChange={e => updateExerciseDraft(index, 'exercise', e.target.value)}
                          className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                        >
                          {exercisePresets.map(ex => (
                            <option key={ex} value={ex}>{ex}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Название"
                          value={draft.customExercise}
                          onChange={e => updateExerciseDraft(index, 'customExercise', e.target.value)}
                          className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                        />
                      )}
                      <button
                        onClick={() => updateExerciseDraft(index, 'useCustom', !draft.useCustom)}
                        className="text-xs text-purple-400 mt-1 hover:text-purple-300"
                      >
                        {draft.useCustom ? '← Из списка' : '✏️ Своё'}
                      </button>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Вес (кг)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="50"
                        value={draft.weight}
                        onChange={e => updateExerciseDraft(index, 'weight', e.target.value)}
                        className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Повторы</label>
                      <input
                        type="number"
                        placeholder="12"
                        value={draft.reps}
                        onChange={e => updateExerciseDraft(index, 'reps', e.target.value)}
                        className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Подходы</label>
                      <input
                        type="number"
                        placeholder="3"
                        value={draft.sets}
                        onChange={e => updateExerciseDraft(index, 'sets', e.target.value)}
                        className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={addExerciseDraft}
                className="flex-1 py-2.5 px-4 rounded-lg border border-purple-500/30 text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить упражнение
              </button>
              <button
                onClick={saveSession}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-purple-500/25"
              >
                Сохранить тренировку ({exerciseDrafts.filter(d => d.weight && d.reps).length})
              </button>
            </div>
          </div>

          {/* Exercise records grouped */}
          {uniqueExercises.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-400" />
                Мои упражнения
              </h2>
              {uniqueExercises.map(exercise => {
                const records = exerciseRecords
                  .filter(r => r.exercise === exercise)
                  .sort((a, b) => b.date.localeCompare(a.date));
                const latest = records[0];
                const previous = records[1];
                const progress = latest && previous ? latest.weight - previous.weight : 0;
                const isExpanded = expandedExercise === exercise;

                return (
                  <div key={exercise} className="bg-[var(--color-surface)] rounded-2xl border border-purple-500/20 overflow-hidden">
                    <button
                      onClick={() => setExpandedExercise(isExpanded ? null : exercise)}
                      className="w-full p-4 flex items-center justify-between hover:bg-purple-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{exercise}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {latest ? `${latest.weight} кг × ${latest.reps} повт.` : ''} • {records.length} записей
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {progress !== 0 && (
                          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                            progress > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {progress > 0 ? '+' : ''}{progress.toFixed(1)} кг
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        {records.length > 1 && (
                          <div className="h-32 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getExerciseProgress(exercise)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3d3660" />
                                <XAxis dataKey="date" stroke="#a09bb5" fontSize={10} />
                                <YAxis stroke="#a09bb5" fontSize={10} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#2d2845',
                                    border: '1px solid #7c3aed40',
                                    borderRadius: '8px',
                                    color: '#f1f0f5',
                                    fontSize: '12px',
                                  }}
                                />
                                <Line type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} name="Вес (кг)" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {records.map(record => (
                            <div key={record.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-surface-light)]/50 hover:bg-[var(--color-surface-light)]">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs text-[var(--color-text-muted)] w-16">{formatDate(record.date)}</span>
                                <span className="font-medium">{record.weight} кг</span>
                                <span className="text-[var(--color-text-muted)] text-sm">× {record.reps} повт.</span>
                                {record.sets > 1 && <span className="text-[var(--color-text-muted)] text-sm">• {record.sets} подх.</span>}
                              </div>
                              <button
                                onClick={() => deleteExerciseRecord(record.id)}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {exerciseRecords.length === 0 && (
            <div className="text-center py-12 text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-2xl border border-purple-500/20">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Пока нет записей</p>
              <p className="text-sm mt-1">Добавь свою первую тренировку! 💪</p>
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {bodyMeasurements.length > 1 && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-400" />
                Динамика веса
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bodyChartData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d3660" />
                    <XAxis dataKey="date" stroke="#a09bb5" fontSize={12} />
                    <YAxis stroke="#a09bb5" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2d2845',
                        border: '1px solid #7c3aed40',
                        borderRadius: '8px',
                        color: '#f1f0f5',
                      }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={2} fill="url(#weightGradient)" name="Вес (кг)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {bodyMeasurements.length > 1 && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-pink-400" />
                Объёмы тела
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d3660" />
                    <XAxis dataKey="date" stroke="#a09bb5" fontSize={12} />
                    <YAxis stroke="#a09bb5" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2d2845',
                        border: '1px solid #7c3aed40',
                        borderRadius: '8px',
                        color: '#f1f0f5',
                      }}
                    />
                    {bodyChartData.some(d => d.chest) && <Line type="monotone" dataKey="chest" stroke="#f472b6" strokeWidth={2} dot={{ r: 3 }} name="Грудь" />}
                    {bodyChartData.some(d => d.waist) && <Line type="monotone" dataKey="waist" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} name="Талия" />}
                    {bodyChartData.some(d => d.hips) && <Line type="monotone" dataKey="hips" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} name="Бёдра" />}
                    {bodyChartData.some(d => d.left_arm) && <Line type="monotone" dataKey="left_arm" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} name="Левая рука" />}
                    {bodyChartData.some(d => d.right_arm) && <Line type="monotone" dataKey="right_arm" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} name="Правая рука" />}
                    {bodyChartData.some(d => d.left_thigh) && <Line type="monotone" dataKey="left_thigh" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="Левая нога" />}
                    {bodyChartData.some(d => d.right_thigh) && <Line type="monotone" dataKey="right_thigh" stroke="#c084fc" strokeWidth={2} dot={{ r: 3 }} name="Правая нога" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {bodyChartData.some(d => d.chest) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-pink-400"></span>Грудь</span>}
                {bodyChartData.some(d => d.waist) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-blue-400"></span>Талия</span>}
                {bodyChartData.some(d => d.hips) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-green-400"></span>Бёдра</span>}
                {bodyChartData.some(d => d.left_arm) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-yellow-400"></span>Лев. рука</span>}
                {bodyChartData.some(d => d.right_arm) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-orange-400"></span>Пр. рука</span>}
                {bodyChartData.some(d => d.left_thigh) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-purple-400"></span>Лев. нога</span>}
                {bodyChartData.some(d => d.right_thigh) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-fuchsia-400"></span>Пр. нога</span>}
              </div>
            </div>
          )}

          {/* Exercise progress charts */}
          {uniqueExercises.map(exercise => {
            const progressData = getExerciseProgress(exercise);
            if (progressData.length < 2) return null;

            const firstWeight = progressData[0].weight;
            const lastWeight = progressData[progressData.length - 1].weight;
            const totalProgress = lastWeight - firstWeight;

            return (
              <div key={exercise} className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-purple-400" />
                    {exercise}
                  </h2>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    totalProgress > 0 ? 'bg-green-500/20 text-green-400' : totalProgress < 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {totalProgress > 0 ? '+' : ''}{totalProgress.toFixed(1)} кг
                  </span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData}>
                      <defs>
                        <linearGradient id={`grad-${exercise}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3d3660" />
                      <XAxis dataKey="date" stroke="#a09bb5" fontSize={11} />
                      <YAxis stroke="#a09bb5" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2d2845',
                          border: '1px solid #7c3aed40',
                          borderRadius: '8px',
                          color: '#f1f0f5',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={2} fill={`url(#grad-${exercise})`} name="Вес (кг)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[var(--color-surface-light)]/50 rounded-lg p-2">
                    <p className="text-xs text-[var(--color-text-muted)]">Старт</p>
                    <p className="font-bold text-sm">{firstWeight} кг</p>
                  </div>
                  <div className="bg-[var(--color-surface-light)]/50 rounded-lg p-2">
                    <p className="text-xs text-[var(--color-text-muted)]">Текущий</p>
                    <p className="font-bold text-sm">{lastWeight} кг</p>
                  </div>
                  <div className="bg-[var(--color-surface-light)]/50 rounded-lg p-2">
                    <p className="text-xs text-[var(--color-text-muted)]">Тренировок</p>
                    <p className="font-bold text-sm">{progressData.length}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {bodyMeasurements.length <= 1 && uniqueExercises.length === 0 && (
            <div className="text-center py-12 text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-2xl border border-purple-500/20">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Добавь больше данных, чтобы увидеть прогресс!</p>
              <p className="text-sm mt-1">Нужно минимум 2 записи для графика 📈</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-md w-full border border-purple-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Экспорт данных</h3>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Скачай файл с твоими данными.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 px-4 rounded-xl border border-purple-500/30 text-sm font-medium hover:bg-[var(--color-surface-light)] transition-colors">
                Отмена
              </button>
              <button onClick={() => { exportData(); setShowExportModal(false); }} className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium shadow-lg shadow-purple-500/25">
                Скачать файл
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-md w-full border border-purple-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Импорт данных</h3>
            </div>
            {importStatus === 'idle' && (
              <label className="block w-full border-2 border-dashed border-purple-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="text-sm font-medium">Нажми чтобы выбрать файл</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Формат: .json</p>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            )}
            {importStatus === 'success' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <Check className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm text-green-400 font-medium">Успешно!</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{importMessage}</p>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <p className="text-sm text-red-400 font-medium">Ошибка</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{importMessage}</p>
              </div>
            )}
            <button onClick={() => { setShowImportModal(false); setImportStatus('idle'); }} className="w-full mt-4 py-2.5 px-4 rounded-xl border border-purple-500/30 text-sm font-medium hover:bg-[var(--color-surface-light)] transition-colors">
              Закрыть
            </button>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-lg w-full border border-purple-500/20 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Как пользоваться</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div className="bg-[var(--color-surface-light)] rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">📐 Параметры тела</h4>
                <p className="text-[var(--color-text-muted)]">
                  Вноси вес и объёмы. Для рук и ног есть отдельные поля для левой и правой стороны — это поможет отследить дисбаланс.
                </p>
              </div>
              <div className="bg-[var(--color-surface-light)] rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">🏋️ Упражнения</h4>
                <p className="text-[var(--color-text-muted)]">
                  За одну тренировку можно добавить сразу несколько упражнений! Нажми «Добавить упражнение» чтобы добавить ещё одно.
                </p>
              </div>
              <div className="bg-[var(--color-surface-light)] rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">📈 Прогресс</h4>
                <p className="text-[var(--color-text-muted)]">
                  Графики динамики веса, объёмов и прогрессии в каждом упражнении.
                </p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">💡 Совет</h4>
                <p className="text-[var(--color-text-muted)]">
                  Делай замеры раз в неделю в одно и то же время. Для рук и ног замеряй самую широкую часть мышцы.
                </p>
              </div>
            </div>
            <button onClick={() => setShowGuideModal(false)} className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium shadow-lg shadow-purple-500/25">
              Понятно!
            </button>
          </div>
        </div>
      )}

      <footer className="text-center mt-10 pb-6 text-xs text-[var(--color-text-muted)]">
        <p>☁️ Данные синхронизируются в облаке</p>
      </footer>
    </div>
  );
}
