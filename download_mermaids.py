import base64; import urllib.request

def dl_mermaid(code, filename):
    encoded = base64.b64encode(code.encode('utf-8')).decode('utf-8')
    req = urllib.request.Request(f'https://mermaid.ink/img/{encoded}?type=png&bgColor=!white', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response, open(filename, 'wb') as out_file:
            out_file.write(response.read())
        print('Downloaded', filename)
    except Exception as e:
        print('Error downloading', filename, e)

# 1. Flowchart (Activity Diagram-like)
flowchart = '''graph TD
A([Mulai]) --> B[Registrasi / Login]
B --> C[Eksplorasi Kampanye Infaq]
C --> D[Pilih Kampanye & Nominal]
D --> E{Pilih Metode}
E -->|Midtrans| F[Checkout Pop-up Snap]
F --> G{Status Pembayaran}
G -->|Success| H[Terima Notifikasi Webhook]
G -->|Pending/Gagal| I[Batal / Pending]
H --> J[Saldo Kampanye Bertambah & Riwayat Muncul]
J --> K([Selesai])
I --> K'''
dl_mermaid(flowchart, 'flowchart.png')

# 2. Use Case
usecase = '''flowchart LR
    Donatur((Donatur))
    Admin((Admin))
    
    subgraph Sistem InfaqLy
    UC1(Melihat Kampanye)
    UC2(Melakukan Donasi)
    UC3(Mencetak Sertifikat)
    UC4(Kelola Kampanye)
    UC5(Verifikasi Penarikan)
    UC6(Kelola Settings)
    end
    
    Donatur --> UC1
    Donatur --> UC2
    Donatur --> UC3
    
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC1
'''
dl_mermaid(usecase, 'usecase.png')

# 3. Class Diagram / ERD
erd = '''classDiagram
class Users {
  +id: int
  +name: string
  +email: string
  +role: string
}
class Campaigns {
  +id: int
  +title: string
  +target: decimal
  +collected: decimal
}
class Donations {
  +id: int
  +campaignId: int
  +amount: decimal
  +status: string
}
class Withdrawals {
  +id: int
  +campaignId: int
  +amount: decimal
  +status: string
}
Users "1" --> "*" Donations : Melakukan
Campaigns "1" --> "*" Donations : Menerima
Campaigns "1" --> "*" Withdrawals : Ditarik
'''
dl_mermaid(erd, 'class.png')
