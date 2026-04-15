import { Outlet, Link } from 'react-router-dom';

export default function MinimalLayout() {
  return (
    <div className="min-h-screen user-bg flex flex-col">
      {/* Simplified Navbar — logo only */}
      <header className="py-4 px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold font-heading text-user-text hover:text-user-accent transition-colors">
          <span className="text-2xl">🕌</span>
          <span>infaqLy</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
