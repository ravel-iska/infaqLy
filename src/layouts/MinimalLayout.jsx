import { Outlet, Link } from 'react-router-dom';

export default function MinimalLayout() {
  return (
    <div className="min-h-screen bg-surface font-body flex flex-col">
      {/* Simplified Navbar — logo only */}
      <header className="py-6 px-8 absolute top-0 left-0 w-full z-10 w-full flex justify-center md:justify-start">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold font-headline text-primary hover:text-primary/80 transition-colors">
          <span className="material-symbols-outlined text-3xl">volunteer_activism</span>
          <span className="tracking-tight text-emerald-800">Infaqly</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-24 relative overflow-hidden">
        {/* Subtle Background Blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-fixed/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
