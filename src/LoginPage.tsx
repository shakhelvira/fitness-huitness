import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Dumbbell, Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error || 'Ошибка входа');
        }
      } else {
        if (!name.trim()) {
          setError('Введите имя');
          setLoading(false);
          return;
        }
        const result = await register(name, email, password);
        if (!result.success) {
          setError(result.error || 'Ошибка регистрации');
        }
      }
    } catch {
      setError('Произошла ошибка. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/30">
            <Dumbbell className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Фитнес Планер
          </h1>
          <p className="text-[var(--color-text-muted)] mt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Облачная синхронизация • Все устройства
          </p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl p-6 md:p-8 border border-purple-500/20 shadow-xl shadow-purple-500/5">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {isLogin ? 'Вход в аккаунт' : 'Создать аккаунт'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs text-[var(--color-text-muted)] mb-1.5 block">Имя</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Как тебя зовут?"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1.5 block">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isLogin ? 'Введи пароль' : 'Придумай пароль (мин. 4 символа)'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-[var(--color-surface-light)] border border-purple-500/30 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-purple-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Войти' : 'Зарегистрироваться'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-[var(--color-text-muted)] hover:text-purple-400 transition-colors"
            >
              {isLogin ? (
                <>Нет аккаунта? <span className="text-purple-400 font-medium">Зарегистрируйся</span></>
              ) : (
                <>Уже есть аккаунт? <span className="text-purple-400 font-medium">Войти</span></>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="bg-[var(--color-surface)]/50 rounded-xl p-3 border border-purple-500/10">
            <p className="text-lg mb-1">📊</p>
            <p className="text-xs text-[var(--color-text-muted)]">Графики прогресса</p>
          </div>
          <div className="bg-[var(--color-surface)]/50 rounded-xl p-3 border border-purple-500/10">
            <p className="text-lg mb-1">📱</p>
            <p className="text-xs text-[var(--color-text-muted)]">Работает везде</p>
          </div>
          <div className="bg-[var(--color-surface)]/50 rounded-xl p-3 border border-purple-500/10">
            <p className="text-lg mb-1">🔒</p>
            <p className="text-xs text-[var(--color-text-muted)]">Твои данные</p>
          </div>
        </div>
      </div>
    </div>
  );
}
