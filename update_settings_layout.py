import re

file_path = r'src/pages/admin/SettingsPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the top wrapper
content = re.sub(
    r'(<h1 className=.*?Setelan Sistem</h1>\n\s*</div>)',
    r'\1\n\n      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">\n        {/* KIRI - PAYMENT */}\n        <div className="space-y-6 flex flex-col">',
    content
)

# Put a closing div before Kontak Admin, and start KANAN
content = content.replace(
    '      {/* PUSAT BANTUAN & INFO KONTAK ADMIN */}',
    '        </div>\n\n        {/* KANAN - SISTEM & SECURITY */}\n        <div className="space-y-6 flex flex-col">\n      {/* PUSAT BANTUAN & INFO KONTAK ADMIN */}'
)

# Close the grid at the very end
content = content.replace(
    '    </div>\n  );\n}',
    '        </div>\n      </div>\n    </div>\n  );\n}'
)

# Move PIN QUICK RE-LOGIN to the right side if possible
pin_block = re.search(r'(      {\/\* PIN QUICK RE-LOGIN \*\/}.*?)(?=      {\/\* PAYMENT GATEWAY MASTER SWITCHER \*\/})', content, re.DOTALL)
if pin_block:
    pin_text = pin_block.group(1)
    content = content.replace(pin_text, '')
    content = content.replace('      {/* PUSAT BANTUAN & INFO KONTAK ADMIN */}', pin_text + '      {/* PUSAT BANTUAN & INFO KONTAK ADMIN */}')

# Simplify the spacing
content = content.replace('      {/* DOKU PAYMENT GATEWAY */}\n      <div className={`bg-base-100 shadow rounded-2xl p-6 sm:p-8 border border-base-200 relative overflow-hidden mt-8 transition-all', '      {/* DOKU PAYMENT GATEWAY */}\n      <div className={`bg-base-100 shadow rounded-2xl p-6 sm:p-8 border border-base-200 relative overflow-hidden transition-all')
content = content.replace('mb-8 border border-base-200', 'border border-base-200')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated SettingsPage')
