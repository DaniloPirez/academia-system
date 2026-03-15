import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

LOCAL_API = os.getenv("LOCAL_API_URL", "http://127.0.0.1:8000").rstrip("/")
CLOUD_API = os.getenv("CLOUD_API_URL", "").rstrip("/")
SYNC_TOKEN = os.getenv("SYNC_TOKEN", "")
INTERVAL = int(os.getenv("SYNC_INTERVAL_SECONDS", "60"))

HEADERS = {"X-SYNC-TOKEN": SYNC_TOKEN}


def cloud_online() -> bool:
    if not CLOUD_API:
        return False
    try:
        r = requests.get(f"{CLOUD_API}/health", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def exportar_local(path: str):
    r = requests.get(f"{LOCAL_API}{path}", timeout=30)
    r.raise_for_status()
    return r.json()


def importar_nuvem(path: str, payload):
    r = requests.post(f"{CLOUD_API}{path}", json=payload, headers=HEADERS, timeout=60)
    r.raise_for_status()
    return r.json()


def marcar_sincronizado(tabela: str, registro_id: str):
    r = requests.post(f"{LOCAL_API}/sync/marcar-sincronizado/{tabela}/{registro_id}", timeout=20)
    r.raise_for_status()


def sync_tabela(nome: str, export_path: str, import_path: str) -> int:
    itens = exportar_local(export_path)
    if not itens:
        return 0

    importar_nuvem(import_path, itens)

    for item in itens:
        marcar_sincronizado(nome, item["id"])

    return len(itens)


def main():
    print("✅ Sync Worker iniciado (clientes + acessos).")
    while True:
        try:
            if not cloud_online():
                print("🌐 Nuvem ainda não disponível. Aguardando...")
                time.sleep(INTERVAL)
                continue

            total = 0
            total += sync_tabela("clientes", "/sync/clientes", "/sync/importar/clientes")
            total += sync_tabela("acessos", "/sync/acessos", "/sync/importar/acessos")

            print(f"🔁 Sincronização concluída. Registros enviados: {total}")

        except Exception as e:
            print(f"⚠️ Erro no sync: {e}")

        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()