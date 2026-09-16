import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  Dumbbell, TrendingUp, Plus, Trash2, Calendar, Target, 
  Activity, ChevronDown, ChevronUp, Scale, Ruler, LogOut, User,
  Download, Upload, FileJson, Check
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
  arms: number;
  thighs: number;
}

interface ExerciseRecord {
  id: string;
  exercise: string;
  date: string;
  weight: number;
  reps: number;
  sets: number;
}

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

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
];

export default function App() {
  const { user, logout } = useAuth();
  const userId = user?.id || 'default';

  const [activeTab, setActiveTab] = useState<'body' | 'exercises' | 'progress'>('body');
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Body measurement form
  const [bodyForm, setBodyForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
  });

  // Exercise form
  const [exerciseForm, setExerciseForm] = useState({
    exercise: exercisePresets[0],
    customExercise: '',
    date: new Date().toISOString().split('T')[0],
    weight: '',
    reps: '',
    sets: '',
  });
  const [useCustomExercise, setUseCustomExercise] = useState(false);

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
      // Load body measurements
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
          arms: m.arms || 0,
          thighs: m.thighs || 0,
        })));
      }

      // Load exercise records
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

      setDataLoaded(true);
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
      chest: parseFloat(bodyForm.chest) || 0,
      waist: parseFloat(bodyForm.waist) || 0,
      hips: parseFloat(bodyForm.hips) || 0,
      arms: parseFloat(bodyForm.arms) || 0,
      thighs: parseFloat(bodyForm.thighs) || 0,
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
        arms: data.arms || 0,
        thighs: data.thighs || 0,
      };
      setBodyMeasurements(prev => [...prev, newMeasurement].sort((a, b) => a.date.localeCompare(b.date)));
    }

    setBodyForm({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: '',
    });
  };

  const addExerciseRecord = async () => {
    if (!exerciseForm.weight || !exerciseForm.reps) return;
    const exerciseName = useCustomExercise ? exerciseForm.customExercise : exerciseForm.exercise;
    if (!exerciseName) return;
    
    const recordData = {
      user_id: userId,
      exercise: exerciseName,
      date: exerciseForm.date,
      weight: parseFloat(exerciseForm.weight) || 0,
      reps: parseInt(exerciseForm.reps) || 0,
      sets: parseInt(exerciseForm.sets) || 1,
    };

    const { data, error } = await supabase
      .from('exercise_records')
      .insert(recordData)
      .select()
      .single();

    if (error) {
      console.error('Error adding exercise record:', error);
      return;
    }

    if (data) {
      const newRecord: ExerciseRecord = {
        id: data.id,
        exercise: data.exercise,
        date: data.date,
        weight: data.weight,
        reps: data.reps,
        sets: data.sets || 1,
      };
      setExerciseRecords(prev => [...prev, newRecord].sort((a, b) => a.date.localeCompare(b.date)));
    }

    setExerciseForm({
      ...exerciseForm,
      weight: '',
      reps: '',
      sets: '',
    });
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
      version: 1,
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

        // Insert body measurements to Supabase
        const bodyToInsert = fileData.bodyMeasurements.map((m: BodyMeasurement) => ({
          user_id: userId,
          date: m.date,
          weight: m.weight,
          chest: m.chest || null,
          waist: m.waist || null,
          hips: m.hips || null,
          arms: m.arms || null,
          thighs: m.thighs || null,
        }));

        const { error: bodyError } = await supabase
          .from('body_measurements')
          .insert(bodyToInsert);

        // Insert exercise records to Supabase
        const exercisesToInsert = fileData.exerciseRecords.map((r: ExerciseRecord) => ({
          user_id: userId,
          exercise: r.exercise,
          date: r.date,
          weight: r.weight,
          reps: r.reps,
          sets: r.sets || 1,
        }));

        const { error: exerciseError } = await supabase
          .from('exercise_records')
          .insert(exercisesToInsert);

        if (bodyError || exerciseError) {
          throw new Error('Ошибка загрузки в облако');
        }

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
            arms: m.arms || 0,
            thighs: m.thighs || 0,
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
    arms: m.arms || undefined,
    thighs: m.thighs || undefined,
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
          {/* Add measurement form */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Новый замер
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Руки (см)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="30"
                  value={bodyForm.arms}
                  onChange={e => setBodyForm({ ...bodyForm, arms: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Ноги (см)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="55"
                  value={bodyForm.thighs}
                  onChange={e => setBodyForm({ ...bodyForm, thighs: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
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
                    {bodyChartData.some(d => d.chest) && (
                      <Area type="monotone" dataKey="chest" stroke="#f472b6" fill="#f472b6" fillOpacity={0.1} name="Грудь (см)" />
                    )}
                    {bodyChartData.some(d => d.waist) && (
                      <Area type="monotone" dataKey="waist" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} name="Талия (см)" />
                    )}
                    {bodyChartData.some(d => d.hips) && (
                      <Area type="monotone" dataKey="hips" stroke="#34d399" fill="#34d399" fillOpacity={0.1} name="Бёдра (см)" />
                    )}
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
                      <th className="text-center py-2 px-2">Руки</th>
                      <th className="text-center py-2 px-2">Ноги</th>
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
                        <td className="text-center py-2.5 px-2">{m.arms || '—'}</td>
                        <td className="text-center py-2.5 px-2">{m.thighs || '—'}</td>
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
          {/* Add exercise form */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-purple-500/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Новая тренировка
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Упражнение</label>
                {!useCustomExercise ? (
                  <select
                    value={exerciseForm.exercise}
                    onChange={e => setExerciseForm({ ...exerciseForm, exercise: e.target.value })}
                    className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    {exercisePresets.map(ex => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Название упражнения"
                    value={exerciseForm.customExercise}
                    onChange={e => setExerciseForm({ ...exerciseForm, customExercise: e.target.value })}
                    className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                  />
                )}
                <button
                  onClick={() => setUseCustomExercise(!useCustomExercise)}
                  className="text-xs text-purple-400 mt-1 hover:text-purple-300"
                >
                  {useCustomExercise ? '← Выбрать из списка' : '✏️ Своё название'}
                </button>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Дата</label>
                <input
                  type="date"
                  value={exerciseForm.date}
                  onChange={e => setExerciseForm({ ...exerciseForm, date: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Вес (кг) *</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="50"
                  value={exerciseForm.weight}
                  onChange={e => setExerciseForm({ ...exerciseForm, weight: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Повторения *</label>
                <input
                  type="number"
                  placeholder="12"
                  value={exerciseForm.reps}
                  onChange={e => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Подходы</label>
                <input
                  type="number"
                  placeholder="3"
                  value={exerciseForm.sets}
                  onChange={e => setExerciseForm({ ...exerciseForm, sets: e.target.value })}
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
            <button
              onClick={addExerciseRecord}
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-purple-500/25"
            >
              Записать результат
            </button>
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
                        {/* Mini chart */}
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
                        
                        {/* Records list */}
                        <div className="space-y-1.5">
                          {records.map(record => (
                            <div key={record.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-surface-light)]/50 hover:bg-[var(--color-surface-light)]">
                              <div className="flex items-center gap-3">
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
                    {bodyChartData.some(d => d.chest) && (
                      <Line type="monotone" dataKey="chest" stroke="#f472b6" strokeWidth={2} dot={{ r: 3 }} name="Грудь" />
                    )}
                    {bodyChartData.some(d => d.waist) && (
                      <Line type="monotone" dataKey="waist" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} name="Талия" />
                    )}
                    {bodyChartData.some(d => d.hips) && (
                      <Line type="monotone" dataKey="hips" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} name="Бёдра" />
                    )}
                    {bodyChartData.some(d => d.arms) && (
                      <Line type="monotone" dataKey="arms" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} name="Руки" />
                    )}
                    {bodyChartData.some(d => d.thighs) && (
                      <Line type="monotone" dataKey="thighs" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} name="Ноги" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {bodyChartData.some(d => d.chest) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-pink-400"></span>Грудь</span>}
                {bodyChartData.some(d => d.waist) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-blue-400"></span>Талия</span>}
                {bodyChartData.some(d => d.hips) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-green-400"></span>Бёдра</span>}
                {bodyChartData.some(d => d.arms) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-yellow-400"></span>Руки</span>}
                {bodyChartData.some(d => d.thighs) && <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-orange-400"></span>Ноги</span>}
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

      {/* Export Modal */}
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
              Скачай файл с твоими данными. Ты сможешь загрузить его на другом устройстве.
            </p>
            <div className="bg-[var(--color-surface-light)] rounded-xl p-4 mb-4 text-sm">
              <p className="text-[var(--color-text-muted)] mb-2">Будут сохранены:</p>
              <ul className="space-y-1 text-white">
                <li>• {bodyMeasurements.length} замеров тела</li>
                <li>• {exerciseRecords.length} записей упражнений</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-purple-500/30 text-sm font-medium hover:bg-[var(--color-surface-light)] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => { exportData(); setShowExportModal(false); }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium shadow-lg shadow-purple-500/25"
              >
                Скачать файл
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-md w-full border border-purple-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Импорт данных</h3>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Загрузи файл, который ранее экспортировала. Данные будут добавлены к существующим.
            </p>
            
            {importStatus === 'idle' && (
              <label className="block w-full border-2 border-dashed border-purple-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="text-sm font-medium">Нажми чтобы выбрать файл</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Формат: .json</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
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

            <button
              onClick={() => { setShowImportModal(false); setImportStatus('idle'); }}
              className="w-full mt-4 py-2.5 px-4 rounded-xl border border-purple-500/30 text-sm font-medium hover:bg-[var(--color-surface-light)] transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal */}
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
                  Вноси вес и объёмы (грудь, талия, бёдра, руки, ноги). Можно заполнять не все поля — только то, что ты замеряешь.
                </p>
              </div>

              <div className="bg-[var(--color-surface-light)] rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">🏋️ Упражнения</h4>
                <p className="text-[var(--color-text-muted)]">
                  Записывай рабочие веса, повторения и подходы. Выбирай из списка или пиши своё название. Нажми на упражнение чтобы увидеть график прогресса.
                </p>
              </div>

              <div className="bg-[var(--color-surface-light)] rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">📈 Прогресс</h4>
                <p className="text-[var(--color-text-muted)]">
                  Здесь графики динамики веса, объёмов и прогрессии в каждом упражнении. Показывает сколько кг ты добавила с первого раза.
                </p>
              </div>

              <div className="bg-[var(--color-surface-light)] rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">💾 Перенос данных</h4>
                <p className="text-[var(--color-text-muted)] mb-2">
                  Данные хранятся в этом браузере. Чтобы перенести на другое устройство:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[var(--color-text-muted)]">
                  <li>Нажми <span className="text-white">«Экспорт данных»</span> в меню</li>
                  <li>Скачай JSON файл</li>
                  <li>На новом устройстве войди в аккаунт</li>
                  <li>Нажми <span className="text-white">«Импорт данных»</span> и выбери файл</li>
                </ol>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">💡 Совет</h4>
                <p className="text-[var(--color-text-muted)]">
                  Делай замеры раз в неделю в одно и то же время (утром натощак). Для упражнений записывай лучший подход с максимальным весом.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium shadow-lg shadow-purple-500/25"
            >
              Понятно!
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center mt-10 pb-6 text-xs text-[var(--color-text-muted)]">
        <p>☁️ Данные синхронизируются в облаке</p>
      </footer>
    </div>
  );
}
