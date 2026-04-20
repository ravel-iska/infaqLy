import re

file_path = r'src/pages/admin/DashboardPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all standard STATs cards wrapper
content = content.replace(
    'className="bg-base-100 shadow rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"',
    'className="bg-gradient-to-br from-base-100 to-base-200/30 backdrop-blur-md shadow-xl shadow-base-200/40 rounded-2xl p-6 border border-base-200/60 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden relative group"'
)

old_map = """            ))
          : STATS.map((stat) => (
              <div key={stat.label} className="bg-base-100 shadow rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <span className={`material-symbols-outlined ${stat.color} text-[24px]`}>{stat.icon}</span>
                  </div>
                  <span className={`text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-md ${stat.up ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {stat.up ? 'trending_up' : 'trending_down'}
                    </span>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-sm font-medium text-base-content/60">{stat.label}</p>
                <p className="text-3xl font-bold text-base-content mt-1 font-headline tracking-tight">
                  {typeof stat.value === 'string' ? stat.value : (typeof stat.value === 'number' && stat.value > 9999 ? formatCurrencyShort(stat.value) : (stat.value || 0).toLocaleString('id-ID'))}
                </p>
              </div>"""

new_map = """            ))
          : STATS.map((stat) => (
              <div key={stat.label} className="bg-gradient-to-br from-base-100 to-base-100/50 backdrop-blur-xl shadow-xl shadow-base-200/50 rounded-[1.25rem] p-6 border border-white/10 dark:border-base-content/5 hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group cursor-pointer">
                {/* Decorative Glow */}
                <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${stat.color.replace('text-', 'bg-')}`}></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.bg.replace('/10', '/80')} border border-white/20 dark:border-black/10 shadow-sm`}>
                    <span className={`material-symbols-outlined ${stat.color} text-[26px] drop-shadow-sm`}>{stat.icon}</span>
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 rounded-md ${stat.up ? 'bg-success/15 text-success border border-success/20' : 'bg-error/15 text-error border border-error/20'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {stat.up ? 'trending_up' : 'trending_down'}
                    </span>
                    {stat.trend}
                  </span>
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-semibold text-base-content/60 mb-0.5 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-[2rem] font-black text-base-content font-headline tracking-tight leading-none drop-shadow-sm group-hover:text-primary transition-colors duration-300">
                      {typeof stat.value === 'string' ? stat.value : (typeof stat.value === 'number' && stat.value > 9999 ? formatCurrencyShort(stat.value) : (stat.value || 0).toLocaleString('id-ID'))}
                    </p>
                </div>
              </div>"""

content = content.replace(old_map, new_map)

# Upgrade Recharts components
content = content.replace(
    '<div className="lg:col-span-3 bg-base-100 shadow rounded-2xl p-6 flex flex-col">',
    '<div className="lg:col-span-3 bg-gradient-to-b from-base-100 to-base-200/20 backdrop-blur-md border border-white/10 dark:border-base-content/5 shadow-2xl shadow-base-200/50 rounded-[1.5rem] p-6 sm:p-8 flex flex-col relative overflow-hidden">'
)
content = content.replace(
    '<div className="lg:col-span-2 bg-base-100 shadow rounded-2xl p-6 flex flex-col">',
    '<div className="lg:col-span-2 bg-gradient-to-b from-base-100 to-base-200/20 backdrop-blur-md border border-white/10 dark:border-base-content/5 shadow-2xl shadow-base-200/50 rounded-[1.5rem] p-6 flex flex-col relative overflow-hidden">'
)
content = content.replace(
    '<div className="bg-base-100 shadow rounded-2xl p-6 flex flex-col border border-base-200">',
    '<div className="bg-gradient-to-b from-base-100 to-base-200/20 backdrop-blur-md shadow-2xl shadow-base-200/50 rounded-[1.5rem] p-6 flex flex-col border border-white/10 dark:border-base-content/5">'
)
content = content.replace(
    '<div className="bg-base-100 shadow rounded-2xl p-6 border border-base-200">',
    '<div className="bg-gradient-to-b from-base-100 to-base-200/20 backdrop-blur-md shadow-2xl shadow-base-200/50 rounded-[1.5rem] p-6 border border-white/10 dark:border-base-content/5 overflow-hidden">'
)

# Header Premium
content = content.replace(
    '<div className="flex items-center justify-between mb-6">',
    '<div className="flex items-center justify-between mb-8 pb-4 border-b border-base-content/5 relative">\n        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>'
)
content = content.replace(
    '<span className="material-symbols-outlined text-[28px] text-base-content">dashboard</span>',
    '<div className="p-2.5 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">\n            <span className="material-symbols-outlined text-[24px] text-white drop-shadow-sm">space_dashboard</span>\n          </div>'
)
content = content.replace(
    '<h1 className="text-2xl font-bold text-base-content tracking-tight">Dashboard Overview</h1>',
    '<h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight font-headline">Dashboard Overview</h1>'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Dashboard UI Modernized!')
