"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Trash2, Search, Inbox } from "lucide-react";
import Navbar from "@/components/Navbar";
import RequireAuth from "@/components/RequireAuth";
import ConfirmModal from "@/components/ConfirmModal";
import { notesApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ArchiveContent() {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await notesApi.archive(auth.token);
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleNotes = useMemo(
    () =>
      notes.filter((n) =>
        n.dersAdi.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [notes, search]
  );

  const handleRestore = async (note) => {
    try {
      await notesApi.restore(auth.token, note.id);
      showToast(`"${note.dersAdi}" geri alındı.`);
      await load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const confirmHardDelete = async () => {
    if (!hardDeleteTarget) return;
    try {
      await notesApi.hardDelete(auth.token, hardDeleteTarget.id);
      showToast(`"${hardDeleteTarget.dersAdi}" kalıcı olarak silindi.`);
      setHardDeleteTarget(null);
      await load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Arşiv</h1>
        <p className="text-muted text-sm mt-1">
          Silinen notlar burada tutulur. İstersen geri alabilir, istersen
          kalıcı olarak silebilirsin.
        </p>
      </div>

      {notes.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ders adına göre ara..."
            className="w-full rounded-md border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-surface"
          />
        </div>
      )}

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted text-sm">Yükleniyor...</p>
      ) : notes.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center flex flex-col items-center gap-2">
          <Inbox size={28} className="text-muted" />
          <p className="text-muted text-sm">Arşiv boş.</p>
        </div>
      ) : visibleNotes.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <p className="text-muted text-sm">
            "{search}" ile eşleşen bir not bulunamadı.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visibleNotes.map((note) => (
            <div
              key={note.id}
              className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 opacity-90"
            >
              <h3 className="font-display font-bold text-base">
                {note.dersAdi}
              </h3>

              {note.aciklama && (
                <p className="text-sm text-muted line-clamp-3">
                  {note.aciklama}
                </p>
              )}

              <p className="text-xs text-muted mt-1">
                Silindi: {formatDate(note.deletedAt)}
              </p>

              <div className="flex gap-4 mt-2 pt-2 border-t border-border">
                <button
                  onClick={() => handleRestore(note)}
                  className="flex items-center gap-1 text-sm font-medium text-success hover:underline"
                >
                  <RotateCcw size={14} />
                  Geri al
                </button>
                <button
                  onClick={() => setHardDeleteTarget(note)}
                  className="flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                >
                  <Trash2 size={14} />
                  Kalıcı sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(hardDeleteTarget)}
        title="Kalıcı olarak sil"
        message={
          hardDeleteTarget
            ? `"${hardDeleteTarget.dersAdi}" notunu kalıcı olarak silmek üzeresin. Bu işlem GERİ ALINAMAZ.`
            : ""
        }
        confirmLabel="Evet, kalıcı sil"
        danger
        onConfirm={confirmHardDelete}
        onCancel={() => setHardDeleteTarget(null)}
      />
    </main>
  );
}

export default function ArsivPage() {
  return (
    <RequireAuth>
      <Navbar />
      <ArchiveContent />
    </RequireAuth>
  );
}
