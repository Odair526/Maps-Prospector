import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RobotMascot } from './RobotMascot';
import { GoogleLoginModal } from './GoogleLoginModal';
import { Loader2, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, login, register } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Form State
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginConfirm = async (googleEmail: string) => {
    try {
      await loginWithGoogle(googleEmail);
      // Success triggers AuthContext change, which unmounts this page
    } catch (err) {
      setError('Erro ao autenticar com Google. Tente novamente.');
      setShowGoogleModal(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Google Login Modal */}
      <GoogleLoginModal 
        isOpen={showGoogleModal} 
        onClose={() => setShowGoogleModal(false)} 
        onConfirm={handleGoogleLoginConfirm} 
      />

      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-blue-400/20 rounded-full blur-[100px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-purple-400/20 rounded-full blur-[100px] opacity-40 animate-pulse delay-1000" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.3 }}></div>
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Robot Mascot Area */}
        <div className="scale-75 -mb-8 pointer-events-none select-none">
           <RobotMascot state="IDLE" />
        </div>

        <div className="w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
              {isLoginMode ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isLoginMode 
                ? 'Acesse sua ferramenta de prospecção inteligente.' 
                : 'Comece a prospectar leads com inteligência artificial.'}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 relative">
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out ${isLoginMode ? 'left-1' : 'left-[calc(50%+2px)]'}`}
            ></div>
            <button 
              onClick={() => !isLoading && setIsLoginMode(true)}
              className={`flex-1 relative z-10 py-2 text-sm font-bold text-center transition-colors ${isLoginMode ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => !isLoading && toggleMode()}
              className={`flex-1 relative z-10 py-2 text-sm font-bold text-center transition-colors ${!isLoginMode ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Criar Conta
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in zoom-in-95">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLoginMode && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-700"
                    placeholder="Seu nome"
                    required={!isLoginMode}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-700"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{isLoginMode ? 'Entrar na plataforma' : 'Criar minha conta'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs text-gray-400 font-medium">OU CONTINUE COM</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <button
            onClick={() => setShowGoogleModal(true)}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3"
          >
             {/* Google Logo SVG */}
             <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Google</span>
          </button>
          
          <p className="mt-8 text-[10px] text-gray-400 text-center leading-relaxed">
            Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
            Seus dados são armazenados localmente no navegador para demonstração.
          </p>
        </div>
      </div>
    </div>
  );
};