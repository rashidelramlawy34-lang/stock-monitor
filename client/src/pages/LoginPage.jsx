export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020810]">
      <div className="text-center space-y-8">
        {/* Arc reactor decoration */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-cyan-400 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.5)]">
            <div className="w-10 h-10 rounded-full bg-cyan-400/20 border-2 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]">
            Stark Market Intelligence
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            Advanced Portfolio Analytics System
          </p>
        </div>

        <div className="w-px h-12 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent mx-auto" />

        <a href="/auth/google">
          <button className="group relative inline-flex items-center gap-3 px-8 py-3 border border-cyan-400/60 text-cyan-300 bg-cyan-400/5 hover:bg-cyan-400/15 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-200 rounded font-medium tracking-widest uppercase text-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </a>

        <p className="text-slate-600 text-xs tracking-wide">
          Secure authentication via Google OAuth 2.0
        </p>
      </div>
    </div>
  );
}
