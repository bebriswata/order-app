const API_BASE = 'https://app.tablecrm.com/api/v1';

const normalize = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.result)) return data.result; // сервер отдаёт именно так
  return [];
};

/**
 * Универсальная функция запросов с токеном
 * Возвращает массив данных (или пустой массив при ошибке)
 */
const fetchData = async (endpoint, token) => {
  try {
    const url = `${API_BASE}/${endpoint}/?token=${token}`;
    console.log("📡 Запрос:", url);

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("📨 Ответ:", endpoint, data);

    return normalize(data);
  } catch (err) {
    console.error(`Ошибка запроса к ${endpoint}:`, err);
    return [];
  }
};

export const searchClient = async (phone, token) => {
  try {
    const url = `${API_BASE}/contragents/?phone=${phone}&token=${token}`;
    console.log("📡 Запрос:", url);

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    console.log("📨 Ответ: contragents", data);
    return data;
  } catch (err) {
    console.error("Ошибка поиска клиента:", err);
    return { result: [] };
  }
};

export const getOrganizations = (token) => fetchData("organizations", token);
export const getWarehouses = (token) => fetchData("warehouses", token);
export const getBills = (token) => fetchData("payboxes", token);
export const getPriceTypes = (token) => fetchData("price_types", token);
export const getNomenclature = (token) => fetchData("nomenclature", token);

export const createSale = async (payload, token) => {
  try {
    const url = `${API_BASE}/docs_sales/?token=${token}`;
    console.log("📡 POST:", url, payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Ошибка создания продажи:", err);
    throw err;
  }
};
