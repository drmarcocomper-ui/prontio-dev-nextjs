const DB_NAME = "prontio-offline";
const DB_VERSION = 1;

const STORES = ["agenda", "pacientes", "prontuarios", "meta"] as const;
export type StoreName = (typeof STORES)[number];

const TTL: Record<string, number> = {
  agenda: 30 * 60 * 1000, // 30 minutes
  pacientes: 60 * 60 * 1000, // 1 hour
  prontuarios: 60 * 60 * 1000, // 1 hour
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: name === "meta" ? "key" : "id" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheData(
  store: StoreName,
  items: Record<string, unknown>[]
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([store, "meta"], "readwrite");
  const objStore = tx.objectStore(store);
  const metaStore = tx.objectStore("meta");

  // Clear existing data in store
  objStore.clear();

  for (const item of items) {
    objStore.put(item);
  }

  // Save timestamp
  metaStore.put({ key: `${store}_timestamp`, value: Date.now() });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getCachedData(
  store: StoreName
): Promise<Record<string, unknown>[] | null> {
  const db = await openDB();
  const tx = db.transaction([store, "meta"], "readonly");
  const metaStore = tx.objectStore("meta");

  // Check TTL
  const ttl = TTL[store];
  if (ttl) {
    const tsRequest = metaStore.get(`${store}_timestamp`);
    const timestamp = await new Promise<number | null>((resolve) => {
      tsRequest.onsuccess = () => resolve(tsRequest.result?.value ?? null);
      tsRequest.onerror = () => resolve(null);
    });

    if (!timestamp || Date.now() - timestamp > ttl) {
      db.close();
      return null;
    }
  }

  const objStore = tx.objectStore(store);
  const dataRequest = objStore.getAll();

  return new Promise((resolve, reject) => {
    dataRequest.onsuccess = () => {
      db.close();
      resolve(dataRequest.result);
    };
    dataRequest.onerror = () => {
      db.close();
      reject(dataRequest.error);
    };
  });
}

export async function clearAllCaches(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORES as unknown as string[], "readwrite");

  for (const name of STORES) {
    tx.objectStore(name).clear();
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
