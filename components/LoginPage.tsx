
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RobotMascot } from './RobotMascot';
import { Loader2, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, login, register } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        if (name.trim().length < 2) throw new Error("Por favor, insira um nome válido.");
        if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
        await register(name, email, password);
      }
    } catch (err: any) {
      // Simplifica mensagens de erro comuns do Firebase para o usuário final
      let message = err.message;
      if (err.code === 'auth/invalid-credential') message = "Email ou senha incorretos.";
      if (err.code === 'auth/email-already-in-use') message = "Este email já está sendo utilizado.";
      setError(message || "Ocorreu um erro na autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError('Erro ao autenticar com Google. Verifique se o domínio está autorizado no console do Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Define o estado do mascote baseado na interação atual
  const getRobotState = () => {
    if (error) return 'ERROR';
    if (isLoading) return 'SEARCHING';
    return 'IDLE';
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-green-400/20 rounded-full blur-[100px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-emerald-400/20 rounded-full blur-[100px] opacity-40 animate-pulse delay-1000" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.3 }}></div>
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <div className="scale-75 -mb-8 pointer-events-none select-none">
           <RobotMascot state={getRobotState()} />
        </div>

        <div className="w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white p-8 relative overflow-hidden">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">{isLoginMode ? 'Bem-vindo!' : 'Crie sua conta'}</h1>
            <p className="text-gray-500 text-sm">Seus leads e histórico são salvos automaticamente na nuvem.</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 relative">
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${isLoginMode ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
            <button onClick={() => !isLoading && setIsLoginMode(true)} className={`flex-1 relative z-10 py-2 text-sm font-bold text-center ${isLoginMode ? 'text-blue-600' : 'text-gray-500'}`}>Entrar</button>
            <button onClick={() => !isLoading && setIsLoginMode(false)} className={`flex-1 relative z-10 py-2 text-sm font-bold text-center ${!isLoginMode ? 'text-blue-600' : 'text-gray-500'}`}>Criar Conta</button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Seu nome" required={!isLoginMode} />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="seu@email.com" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{isLoginMode ? 'Entrar' : 'Começar Agora'}</span>}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs text-gray-400 font-medium">OU</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full bg-white border border-gray-200 font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-70">
             <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continuar com Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};