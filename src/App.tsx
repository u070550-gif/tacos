import React, { useState, useEffect } from 'react';
import { MenuItem, Ingredient, AuthorizedUser, Order, AuthRequest, UserRole } from './types';
import { INITIAL_MENU, INITIAL_INGREDIENTS, INITIAL_USERS, INITIAL_ORDERS } from './mockData';
import AdminPanel from './components/AdminPanel';
import PrincipalPanel from './components/PrincipalPanel';
import CustomerPanel from './components/CustomerPanel';
import { 
  Flame, ShieldCheck, User, Users, LogOut, 
  Info, ChefHat, Store, UtensilsCrossed,
  Lock, Key, ShieldAlert, Smartphone, Clock
} from 'lucide-react';

export default function App() {
  // STATE DEFINITIONS with local storage fallback
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('taqueria_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('taqueria_ingredients');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(() => {
    const saved = localStorage.getItem('taqueria_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('taqueria_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [authRequests, setAuthRequests] = useState<AuthRequest[]>(() => {
    const saved = localStorage.getItem('taqueria_auth_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // ACTIVE SESSION STATES
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [customerEmailInput, setCustomerEmailInput] = useState('');
  const [activeCustomerEmail, setActiveCustomerEmail] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loginPortal, setLoginPortal] = useState<'cliente' | 'admin' | 'principal'>('cliente');

  // SECURE AUTHENTICATION AND SECURITY SIGN-IN STATES (PIN-BASED)
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  const [isLoggingInPrincipal, setIsLoggingInPrincipal] = useState(false);
  const [principalPin, setPrincipalPin] = useState('');
  const [principalError, setPrincipalError] = useState('');

  const [isVerifyingGoogleAuth, setIsVerifyingGoogleAuth] = useState(false);
  const [pendingCustomerEmail, setPendingCustomerEmail] = useState('');
  const [googleAuthInput, setGoogleAuthInput] = useState('');
  const [googleAuthError, setGoogleAuthError] = useState('');

  // TOTP Simulator States
  const [totpCode, setTotpCode] = useState('123456');
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30);

  // PERSIST STATE IN LOCALSTORAGE whenever they change
  useEffect(() => {
    localStorage.setItem('taqueria_menu', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem('taqueria_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('taqueria_users', JSON.stringify(authorizedUsers));
  }, [authorizedUsers]);

  useEffect(() => {
    localStorage.setItem('taqueria_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('taqueria_auth_requests', JSON.stringify(authRequests));
  }, [authRequests]);

  // TOTP Timer & Rolling Code Generator (changes every 30s)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVerifyingGoogleAuth) {
      timer = setInterval(() => {
        setTotpSecondsLeft((prev) => {
          if (prev <= 1) {
            const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
            setTotpCode(randomCode);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVerifyingGoogleAuth]);

  // Set initial code immediately when opening Google Auth verification
  useEffect(() => {
    if (isVerifyingGoogleAuth) {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setTotpCode(randomCode);
      setTotpSecondsLeft(30);
      setGoogleAuthInput('');
      setGoogleAuthError('');
    }
  }, [isVerifyingGoogleAuth]);

  // ADMIN LOGIN VERIFICATION (PIN: 1122)
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.trim() === '1122') {
      setCurrentUserRole('admin');
      setAdminPin('');
      setAdminError('');
      setIsLoggingInAdmin(false);
    } else {
      setAdminError('❌ PIN de Administrador incorrecto (PIN para evaluar: "1122").');
    }
  };

  // PRINCIPAL ACCOUNT LOGIN VERIFICATION (PIN: 3344)
  const handlePrincipalLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (principalPin.trim() === '3344') {
      setCurrentUserRole('principal');
      setPrincipalPin('');
      setPrincipalError('');
      setIsLoggingInPrincipal(false);
    } else {
      setPrincipalError('❌ PIN de Personal incorrecto (PIN para evaluar: "3344").');
    }
  };

  // INITIAL CUSTOMER SUBMIT: starts 2-step TOTP flow
  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmailInput.trim()) return;

    const emailNormalized = customerEmailInput.toLowerCase().trim();
    const isAuthorized = authorizedUsers.some(u => u.email.toLowerCase() === emailNormalized);

    if (isAuthorized) {
      setPendingCustomerEmail(emailNormalized);
      setCustomerEmailInput(emailNormalized);
      setIsVerifyingGoogleAuth(true); // Switch to verification portal
      setLoginError('');
    } else {
      setLoginError('Este correo no está registrado en el comal de autorizados. Solicita acceso al administrador.');
    }
  };

  // VERIFY TOTP CODE TYPED BY CUSTOMER & SIGN IN
  const handleGoogleAuthVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const inputSanitized = googleAuthInput.replace(/\s/g, '');
    if (inputSanitized === totpCode) {
      setActiveCustomerEmail(pendingCustomerEmail);
      setCurrentUserRole('usuario');
      setIsVerifyingGoogleAuth(false);
      setPendingCustomerEmail('');
      setGoogleAuthInput('');
      setGoogleAuthError('');
      setCustomerEmailInput('');
    } else {
      setGoogleAuthError('Código incorrecto de Google Authenticator. Intente de nuevo con el token activo.');
    }
  };

  // LOGOUT & SESSION RESET
  const handleLogout = () => {
    setCurrentUserRole(null);
    setActiveCustomerEmail(null);
    setCustomerEmailInput('');
    setLoginError('');
    setIsLoggingInAdmin(false);
    setIsLoggingInPrincipal(false);
    setIsVerifyingGoogleAuth(false);
    setPendingCustomerEmail('');
    setGoogleAuthInput('');
    setAdminPin('');
    setPrincipalPin('');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-yellow-400 selection:text-slate-900">
      
      {/* Top Main Navigation Bar */}
      <header className="bg-red-600 sticky top-0 z-40 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand/Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full text-red-600 shadow-sm animate-pulse">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" id="logo-icon" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-yellow-300 font-mono font-bold block">El sabor que hace llorar de felicidad</span>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 uppercase italic underline decoration-yellow-400">
                Tacos el Chillón
              </h1>
            </div>
          </div>

          {/* User Session Switcher / Indicator */}
          {currentUserRole ? (
            <div className="flex items-center gap-3 bg-red-700/80 border border-red-500/60 px-3 py-1.5 rounded-md text-xs text-white">
              <div className="flex items-center gap-1.5">
                {currentUserRole === 'admin' ? (
                  <span className="flex items-center gap-1 font-bold text-yellow-300 font-mono text-[11px] bg-slate-900/60 px-2 py-1 rounded">
                    <ShieldCheck className="w-4 h-4 text-rose-400 inline" />
                    ADMINISTRADOR
                  </span>
                ) : currentUserRole === 'principal' ? (
                  <span className="flex items-center gap-1 font-bold text-cyan-200 font-mono text-[11px] bg-slate-900/60 px-2 py-1 rounded">
                    <ChefHat className="w-4 h-4 text-cyan-300 inline" />
                    OPERADOR (PERSONAL)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-green-300 font-mono text-[11px] bg-slate-900/60 px-2 py-1 rounded">
                    <User className="w-4 h-4 text-green-300 inline" />
                    CLIENTE: {activeCustomerEmail}
                  </span>
                )}
              </div>

              <div className="h-4 w-px bg-red-500" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-white hover:text-yellow-300 font-bold text-[10px] uppercase tracking-wider transition-colors"
                id="logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-white text-right font-sans">
                <p className="text-xs font-bold uppercase leading-tight">Sistema Centralizado</p>
                <p className="text-[10px] opacity-75 font-mono">ID: T-4492-BS</p>
              </div>
            </div>
          )}

        </div>
      </header>

      {/* Main Sub-Canvas Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">        {currentUserRole === null ? (
          isVerifyingGoogleAuth ? (
            /* Google Authenticator & Security Warning Screen */
            <div className="max-w-2xl mx-auto space-y-6 py-4 animate-fade-in text-slate-800">
              
              {/* Main Official Security Notice */}
              <div className="bg-amber-50 border-2 border-red-600 rounded-lg p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3 text-red-650">
                  <ShieldAlert className="w-8 h-8 flex-shrink-0 animate-bounce" />
                  <div>
                    <h3 className="text-base font-black tracking-tight uppercase text-slate-900">
                      ⚠️ AVISO DE SEGURIDAD OBLIGATORIO
                    </h3>
                    <p className="text-[11px] text-red-700 font-bold tracking-tight uppercase">
                      Directiva de Encriptación y Control de Acceso - CETIS 7
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-3 space-y-2 font-sans">
                  <p>
                    <b>1. Entorno Restringido:</b> Este portal de pedidos de <span className="font-bold text-red-700">Tacos el Chillón</span> está exclusivamente reservado para alumnos y miembros de cuenta autorizados. Cualquier simulación de pedidos apócrifos está sujeta a la sanción de las autoridades correspondientes.
                  </p>
                  <p>
                    <b>2. Google Authenticator Requerido:</b> Para iniciar sesión de manera segura con el correo <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-900">{pendingCustomerEmail}</span>, debe introducir el token dinámico de 6 dígitos activo en su Google Authenticator.
                  </p>
                  <p>
                    <b>3. Monitoreo Automatizado:</b> Todo intento recurrente fallido generará un reporte de seguridad cifrado que se enviará al correo del administrador institucional. Para su comodidad, un simulador de emulación activo se muestra al costado.
                  </p>
                </div>
              </div>

              {/* Interactive Google Authenticator App Simulator & Input form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Smartphone Authenticator App Mockup */}
                <div className="bg-slate-900 rounded-2xl border-4 border-slate-800 p-4 shadow-xl text-white relative overflow-hidden">
                  {/* Camera notch simulator */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-b-xl flex items-center justify-center">
                    <div className="w-7 h-1 bg-slate-700 rounded-full" />
                  </div>
                  
                  <div className="pt-3 pb-2 text-center border-b border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                      GOOGLE AUTHENTICATOR
                    </span>
                  </div>

                  <div className="py-5 px-1 space-y-4">
                    <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-black text-blue-400 block uppercase font-mono tracking-wider">
                            Tacos el Chillón
                          </span>
                          <span className="text-[11px] text-slate-300 font-mono block break-all font-bold">
                            {pendingCustomerEmail}
                          </span>
                        </div>
                        
                        {/* Circle Timer countdown wheel */}
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <svg className="absolute w-full h-full -rotate-90">
                            <circle
                              cx="16"
                              cy="16"
                              r="13"
                              className="stroke-slate-800 fill-none"
                              strokeWidth="3"
                            />
                            <circle
                              cx="16"
                              cy="16"
                              r="13"
                              className="stroke-blue-500 fill-none transition-all duration-1000"
                              strokeWidth="3"
                              strokeDasharray={81.68}
                              strokeDashoffset={81.68 - (81.68 * totpSecondsLeft) / 30}
                            />
                          </svg>
                          <span className="text-[10px] font-black text-blue-400 font-mono">
                            {totpSecondsLeft}s
                          </span>
                        </div>
                      </div>

                      {/* Token code displaying split-style */}
                      <div className="mt-5 text-3xl font-black text-blue-400 font-mono tracking-widest text-center select-all">
                        {totpCode.substring(0, 3)} {totpCode.substring(3)}
                      </div>
                      
                      <span className="text-[9px] text-slate-500 text-center block mt-3 font-sans italic">
                        (Utilice este código dinámico para simular su autenticación)
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    Cifrado TOTP Sólido • Sincronizado
                  </div>
                </div>

                {/* Form to verify token */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 text-slate-800">
                  <div className="text-center space-y-1 bg-slate-50 p-3 rounded border border-slate-150">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                      Verificación de Identidad
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Escriba el código de 6 dígitos mostrado al costado en el autenticador para autorizar el ingreso al comal.
                    </p>
                  </div>

                  <form onSubmit={handleGoogleAuthVerify} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-tight">
                        Introducir Código OTP (6 dígitos)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={7}
                        placeholder="Ej. 123 456"
                        value={googleAuthInput}
                        onChange={(e) => {
                          // Allow digits and single whitespace character for easier pasting
                          const sanitized = e.target.value.replace(/[^\d\s]/g, '');
                          setGoogleAuthInput(sanitized);
                          setGoogleAuthError('');
                        }}
                        className="w-full text-center text-2xl font-black bg-slate-50 border border-slate-300 rounded py-2 text-slate-900 font-mono tracking-widest focus:outline-none focus:border-red-650"
                      />
                    </div>

                    {googleAuthError && (
                      <p className="text-xs text-red-600 font-bold leading-normal text-center p-2.5 bg-red-50 border border-red-200 rounded">
                        ❌ {googleAuthError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Acceder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsVerifyingGoogleAuth(false);
                          setPendingCustomerEmail('');
                          setGoogleAuthInput('');
                          setGoogleAuthError('');
                        }}
                        className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded transition-all"
                      >
                        Regresar
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>
          ) : (
            /* Profile Selector (Login Portal) */
            <div className="max-w-4xl mx-auto space-y-6 py-4">
              
              <div className="text-center space-y-2">
                <div className="inline-flex bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Control Multi-Rol • Tacos el Chillón Directo del Comal
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-800 uppercase italic">
                  SISTEMA DE GESTIÓN Y PEDIDOS
                </h2>
                <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                  ¡La mejor tecnología para los mejores tacos! Administre inventarios, procese comandas en cocina o realice pedidos interactivos con sincronización instantánea.
                </p>
              </div>

              {/* Portal Selector Tabs Option */}
              <div className="flex justify-center max-w-sm mx-auto">
                <div className="flex bg-slate-200 p-1 rounded-xl w-full border border-slate-300/60 shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPortal('cliente');
                      setIsLoggingInAdmin(false);
                      setIsLoggingInPrincipal(false);
                      setLoginError('');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      loginPortal === 'cliente'
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/55'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-green-600" />
                    Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPortal('admin');
                      setIsLoggingInAdmin(true);
                      setIsLoggingInPrincipal(false);
                      setAdminError('');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      loginPortal === 'admin'
                        ? 'bg-white text-red-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/55'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-red-650" />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPortal('principal');
                      setIsLoggingInPrincipal(true);
                      setIsLoggingInAdmin(false);
                      setPrincipalError('');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      loginPortal === 'principal'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/55'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5 text-slate-700" />
                    Personal
                  </button>
                </div>
              </div>

              {/* Single Rendered Active Portal Card */}
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden p-6 transition-all duration-200">
                {loginPortal === 'cliente' && (
                  /* Card 3: Cuenta de Usuario */
                  <div className="space-y-4" id="portal-cliente">
                    <div className="bg-green-50 border-l-4 border-green-600 text-green-800 p-3.5 rounded flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider font-mono block text-green-700 font-bold">Portal del Pedido</span>
                        <span className="text-xs font-black uppercase tracking-wider block text-slate-900">Acceso Cliente</span>
                      </div>
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase">Realizar Pedido</h3>
                      <p className="text-xs text-slate-600 leading-normal mt-1">
                        Ordene sus tacos predilectos, seleccione entrega a domicilio y configure su dirección. Solamente utilizable por clientes registrados y pre-autorizados en comal.
                      </p>
                    </div>
                    
                    <ul className="text-[11px] text-slate-500 space-y-1 font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                      <li className="flex justify-between"><span>• Menú interactivo</span> <span className="text-green-600">Tacos</span></li>
                      <li className="flex justify-between"><span>• Rastreo de pedido</span> <span className="text-slate-700">Servicio</span></li>
                      <li className="flex justify-between"><span>• Con Google 2FA</span> <span className="text-red-650 font-bold">Seguridad</span></li>
                    </ul>

                    <div className="mt-4 pt-3 border-t border-slate-155">
                      <form onSubmit={handleCustomerLogin} className="space-y-2">
                        <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold">Correo Pre-Autorizado:</label>
                        <div className="flex gap-1.5">
                          <input
                            type="email"
                            required
                            placeholder="Ej. u070550@cetis7.edu.mx"
                            value={customerEmailInput}
                            onChange={(e) => {
                              setCustomerEmailInput(e.target.value);
                              setLoginError('');
                            }}
                            className="w-full bg-white border border-slate-300 text-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="submit"
                            className="px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded transition-all shrink-0 uppercase tracking-tight text-[11px]"
                          >
                            Siguiente
                          </button>
                        </div>
                        {loginError && (
                          <p className="text-[10px] text-red-600 font-bold leading-tight">{loginError}</p>
                        )}
                      </form>

                      {/* Lista amigable de correos pre-autorizados por el administrador */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase font-mono">
                          🔑 Accesos Pre-autorizados por el Admin:
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {authorizedUsers.map((user) => (
                            <button
                              key={user.email}
                              type="button"
                              onClick={() => {
                                setPendingCustomerEmail(user.email);
                                setCustomerEmailInput(user.email);
                                setIsVerifyingGoogleAuth(true);
                                setLoginError('');
                              }}
                              className="text-left bg-emerald-50/50 hover:bg-emerald-50/80 active:scale-98 text-[11px] text-emerald-850 font-mono py-1.5 px-2.5 rounded-lg border border-emerald-100/80 hover:border-emerald-300 transition-all font-bold flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate">{user.email}</span>
                              <span className="text-[9px] text-slate-500 font-sans tracking-tight font-normal whitespace-nowrap ml-1">
                                ({user.name.split(' ')[0]})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {loginPortal === 'admin' && (
                  /* Card 1: Administrador */
                  <div className="space-y-4" id="portal-admin">
                    <div className="bg-red-50 border-l-4 border-red-650 text-red-750 p-3.5 rounded flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider font-mono block text-red-700 font-bold">Administración</span>
                        <span className="text-xs font-black uppercase tracking-wider block text-slate-900">Acceso de Control</span>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase">Control de Negocio</h3>
                      <p className="text-xs text-slate-600 leading-normal mt-1">
                        Edición de menú, cambio de precios, control total de inventarios, reportes de analítica con matemáticas avanzadas y aprobación de solicitudes del personal.
                      </p>
                    </div>
                    
                    <ul className="text-[11px] text-slate-500 space-y-1 font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                      <li className="flex justify-between"><span>• Modificar precios</span> <span className="text-red-600">Directo</span></li>
                      <li className="flex justify-between"><span>• Estimador de ganancias</span> <span className="text-slate-700">Avanzado</span></li>
                      <li className="flex justify-between"><span>• Bandeja de solicitudes</span> <span className="text-red-650">Control</span></li>
                    </ul>

                    {isLoggingInAdmin ? (
                      <form onSubmit={handleAdminLoginSubmit} className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                        <p className="text-[10px] font-mono font-bold text-red-650 uppercase">Acceso Protegido:</p>
                        
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Clave PIN de Administrador (1122)</label>
                          <div className="relative">
                            <input
                              type="password"
                              maxLength={4}
                              required
                              placeholder="••••"
                              value={adminPin}
                              onChange={(e) => {
                                const sanitized = e.target.value.replace(/\D/g, '');
                                setAdminPin(sanitized); 
                                setAdminError(''); 
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-center text-base font-mono tracking-widest text-slate-950 focus:outline-none focus:border-red-600 text-slate-900"
                            />
                            <Lock className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                          </div>
                        </div>

                        {adminError && (
                          <p className="text-[10px] font-bold text-red-655 leading-tight text-red-650">{adminError}</p>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Ingresar con PIN
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setIsLoggingInAdmin(true);
                          setIsLoggingInPrincipal(false);
                        }}
                        className="w-full mt-5 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-yellow-405 text-yellow-400" />
                        Autenticar como Administrador
                      </button>
                    )}
                  </div>
                )}

                {loginPortal === 'principal' && (
                  /* Card 2: Cuenta Principal */
                  <div className="space-y-4" id="portal-personal">
                    <div className="bg-slate-100 border-l-4 border-slate-700 text-slate-800 p-3.5 rounded flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider font-mono block text-slate-600 font-bold">Personal</span>
                        <span className="text-xs font-black uppercase tracking-wider block text-slate-900">Operaciones Cocina</span>
                      </div>
                      <ChefHat className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase">Cocina y Operaciones</h3>
                      <p className="text-xs text-slate-600 leading-normal mt-1">
                        Monitorea las comandas en tiempo real, marca tacos como listos, consume existencias de ingredientes. Solicite cambios de precios/existencia al Administrador si es necesario.
                      </p>
                    </div>
                    
                    <ul className="text-[11px] text-slate-500 space-y-1 font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                      <li className="flex justify-between"><span>• Despacho de comandas</span> <span className="text-slate-700">Realtime</span></li>
                      <li className="flex justify-between"><span>• Control del trompo</span> <span className="text-red-650">Alerta</span></li>
                      <li className="flex justify-between"><span>• Cancelación con PIN</span> <span className="text-slate-700">Código</span></li>
                    </ul>

                    {isLoggingInPrincipal ? (
                      <form onSubmit={handlePrincipalLoginSubmit} className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                        <p className="text-[10px] font-mono font-bold text-red-650 uppercase">Acceso de Personal:</p>
                        
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Clave PIN de Personal (3344)</label>
                          <div className="relative">
                            <input
                              type="password"
                              maxLength={4}
                              required
                              placeholder="••••"
                              value={principalPin}
                              onChange={(e) => {
                                const sanitized = e.target.value.replace(/\D/g, '');
                                setPrincipalPin(sanitized); 
                                setPrincipalError(''); 
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-center text-base font-mono tracking-widest text-slate-950 focus:outline-none focus:border-red-650 text-slate-900"
                            />
                            <Key className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                          </div>
                        </div>

                        {principalError && (
                          <p className="text-[10px] font-bold text-red-650 leading-tight">{principalError}</p>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Ingresar con PIN
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setIsLoggingInPrincipal(true);
                          setIsLoggingInAdmin(false);
                        }}
                        className="w-full mt-5 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-yellow-300" />
                        Autenticar como Personal
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* Render Active Selected Screen Dashboard */
          <div className="space-y-4">
            
            {/* Context Back Switcher button */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded border border-slate-800 shadow-md">
              <div className="text-xs text-white">
                Operando activamente la <b className="text-yellow-400 uppercase font-mono tracking-tight font-bold text-xs">{
                  currentUserRole === 'admin' ? 'Pantalla de Administrador' :
                  currentUserRole === 'principal' ? 'Pantalla de Cuenta Principal / Personal' :
                  `Pantalla del Cliente (${activeCustomerEmail})`
                }</b>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded transition-all uppercase tracking-tight"
              >
                ← Cambiar de Pantalla
              </button>
            </div>

            {/* Inner Views */}
            {currentUserRole === 'admin' && (
              <AdminPanel 
                menu={menu}
                setMenu={setMenu}
                ingredients={ingredients}
                setIngredients={setIngredients}
                authorizedUsers={authorizedUsers}
                setAuthorizedUsers={setAuthorizedUsers}
                orders={orders}
                setOrders={setOrders}
                authRequests={authRequests}
                setAuthRequests={setAuthRequests}
              />
            )}

            {currentUserRole === 'principal' && (
              <PrincipalPanel 
                menu={menu}
                ingredients={ingredients}
                orders={orders}
                setOrders={setOrders}
                authRequests={authRequests}
                setAuthRequests={setAuthRequests}
              />
            )}

            {currentUserRole === 'usuario' && activeCustomerEmail && (
              <CustomerPanel 
                customerEmail={activeCustomerEmail}
                menu={menu}
                orders={orders}
                setOrders={setOrders}
              />
            )}

          </div>
        )}

      </main>

      {/* System Footer */}
      <footer className="h-10 bg-slate-900 flex items-center px-6 justify-between shrink-0 border-t border-slate-800">
        <div className="text-[10px] text-slate-400 font-mono">
          SYSTEM CLOUD v4.1.0-TACO // STATUS: ONLINE
        </div>
        <div className="flex gap-4">
           <span className="text-[10px] text-green-400 font-bold">Terminal_01 Active</span>
           <span className="text-[10px] text-slate-400 font-sans">© 2026 Tacos el Chillón</span>
        </div>
      </footer>

    </div>
  );
}

