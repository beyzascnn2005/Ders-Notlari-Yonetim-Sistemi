// Backend adresini .env.local dosyasından okuyoruz.
// Kendi bilgisayarında backend'in çalıştığı portu buraya yazacaksın (bkz. README).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:49377";

// Ortak istek fonksiyonu: token varsa Authorization header'ına ekler,
// hata durumunda backend'in döndürdüğü mesajı okunabilir bir Error olarak fırlatır.
async function request(path, { method = "GET", body, token, isForm = false } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  // 204 No Content gibi gövdesiz cevaplarda .json() patlar, önce kontrol ediyoruz.
  const hasBody = res.status !== 204;
  const data = hasBody ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      data?.message ||
      (data?.errors && Object.values(data.errors).flat().join(" ")) ||
      `İstek başarısız oldu (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const authApi = {
  register: (username, email, password) =>
    request("/api/Auth/register", {
      method: "POST",
      body: { username, email, password },
    }),
  login: (usernameOrEmail, password) =>
    request("/api/Auth/login", {
      method: "POST",
      body: { usernameOrEmail, password },
    }),
};

export const notesApi = {
  list: (token) => request("/api/Notes", { token }),
  archive: (token) => request("/api/Notes/archive", { token }),
  getById: (token, id) => request(`/api/Notes/${id}`, { token }),

  create: (token, { dersAdi, aciklama, dosya }) => {
    const form = new FormData();
    form.append("DersAdi", dersAdi);
    if (aciklama) form.append("Aciklama", aciklama);
    if (dosya) form.append("Dosya", dosya);
    return request("/api/Notes", { method: "POST", token, body: form, isForm: true });
  },

  update: (token, id, { dersAdi, aciklama, dosya }) => {
    const form = new FormData();
    form.append("DersAdi", dersAdi);
    if (aciklama) form.append("Aciklama", aciklama);
    if (dosya) form.append("Dosya", dosya);
    return request(`/api/Notes/${id}`, { method: "PUT", token, body: form, isForm: true });
  },

  softDelete: (token, id) => request(`/api/Notes/${id}`, { method: "DELETE", token }),
  restore: (token, id) => request(`/api/Notes/${id}/restore`, { method: "POST", token }),
  hardDelete: (token, id) => request(`/api/Notes/${id}/hard`, { method: "DELETE", token }),
};
