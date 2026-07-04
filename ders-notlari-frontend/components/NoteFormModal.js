"use client";

import { useState } from "react";
import { X, Paperclip } from "lucide-react";

export default function NoteFormModal({ initialData, onClose, onSubmit }) {
  const isEdit = Boolean(initialData);
  const [dersAdi, setDersAdi] = useState(initialData?.dersAdi || "");
  const [aciklama, setAciklama] = useState(initialData?.aciklama || "");
  const [dosya, setDosya] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit({ dersAdi, aciklama, dosya });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-xl shadow-lg w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">
            {isEdit ? "Notu düzenle" : "Yeni not ekle"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground p-1 rounded-md hover:bg-black/5 transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Ders adı</label>
            <input
              type="text"
              required
              value={dersAdi}
              onChange={(e) => setDersAdi(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Örn: Veri Yapıları"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Açıklama <span className="text-muted font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Kısa bir not..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Dosya{" "}
              <span className="text-muted font-normal">
                (PDF, Word, TXT — opsiyonel{isEdit ? ", yüklenmezse mevcut dosya korunur" : ""})
              </span>
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setDosya(e.target.files?.[0] || null)}
              className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:text-sm file:font-medium"
            />
            {isEdit && initialData?.dosyaAdi && !dosya && (
              <p className="text-xs text-muted mt-1 flex items-center gap-1">
                <Paperclip size={12} /> Mevcut dosya: {initialData.dosyaAdi}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-black/5 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary hover:bg-primary-hover disabled:opacity-60 text-white transition-colors"
            >
              {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
