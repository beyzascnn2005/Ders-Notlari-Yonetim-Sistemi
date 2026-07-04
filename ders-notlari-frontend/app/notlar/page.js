"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Paperclip,
  Search,
  ArrowDownWideNarrow,
  NotebookText,
  Archive as ArchiveIcon,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RequireAuth from "@/components/RequireAuth";
import NoteFormModal from "@/components/NoteFormModal";
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

function formatRelative(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin} dakika önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} saat önce`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} gün önce`;
}

const SORT_OPTIONS = [
  { value: "guncel", label: "Son güncellenen" },
  { value: "eski", label: "En eski" },
  { value: "ad-az", label: "Ders adı (A-Z)" },
  { value: "ad-za", label: "Ders adı (Z-A)" },
];

function NotesContent() {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [archiveCount, setArchiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("guncel");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [activeNotes, archived] = await Promise.all([
        notesApi.list(auth.token),
        notesApi.archive(auth.token),
      ]);
      setNotes(activeNotes);
      setArchiveCount(archived.length);
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

  const visibleNotes = useMemo(() => {
    let result = notes.filter((n) =>
      n.dersAdi.toLowerCase().includes(search.trim().toLowerCase())
    );
    switch (sort) {
      case "eski":
        result = [...result].sort(
          (a, b) => new Date(a.guncellemeTarihi) - new Date(b.guncellemeTarihi)
        );
        break;
      case "ad-az":
        result = [...result].sort((a, b) => a.dersAdi.localeCompare(b.dersAdi, "tr"));
        break;
      case "ad-za":
        result = [...result].sort((a, b) => b.dersAdi.localeCompare(a.dersAdi, "tr"));
        break;
      default: // guncel
        result = [...result].sort(
          (a, b) => new Date(b.guncellemeTarihi) - new Date(a.guncellemeTarihi)
        );
    }
    return result;
  }, [notes, search, sort]);

  const lastUpdated = notes[0]
    ? notes.reduce((latest, n) =>
        new Date(n.guncellemeTarihi) > new Date(latest.guncellemeTarihi) ? n : latest
      )
    : null;

  const handleCreate = () => {
    setEditingNote(null);
    setModalOpen(true);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (editingNote) {
      await notesApi.update(auth.token, editingNote.id, formData);
      showToast("Not güncellendi.");
    } else {
      await notesApi.create(auth.token, formData);
      showToast("Not eklendi.");
    }
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await notesApi.softDelete(auth.token, deleteTarget.id);
      showToast(`"${deleteTarget.dersAdi}" arşive taşındı.`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Notlarım</h1>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          <Plus size={16} />
          Yeni not
        </button>
      </div>

      {/* İstatistik şeridi */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="rounded-md bg-primary/10 text-primary p-2">
            <NotebookText size={18} />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">{notes.length}</p>
            <p className="text-xs text-muted mt-1">Aktif not</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="rounded-md bg-accent/10 text-accent p-2">
            <ArchiveIcon size={18} />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">{archiveCount}</p>
            <p className="text-xs text-muted mt-1">Arşivde</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="rounded-md bg-success/10 text-success p-2">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate">
              {lastUpdated ? formatRelative(lastUpdated.guncellemeTarihi) : "—"}
            </p>
            <p className="text-xs text-muted mt-1">Son güncelleme</p>
          </div>
        </div>
      </div>

      {/* Arama + sıralama */}
      {notes.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
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
          <div className="relative">
            <ArrowDownWideNarrow
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-md border border-border pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-surface appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <p className="text-muted text-sm mb-3">
            İlk ders notunu ekleyerek başla.
          </p>
          <button
            onClick={handleCreate}
            className="text-primary text-sm font-medium hover:underline"
          >
            + Yeni not ekle
          </button>
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
              className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <h3 className="font-display font-bold text-base">
                {note.dersAdi}
              </h3>

              {note.aciklama && (
                <p className="text-sm text-muted line-clamp-3">
                  {note.aciklama}
                </p>
              )}

              {note.dosyaUrl && (
                <a
                  href={note.dosyaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1 w-fit"
                >
                  <Paperclip size={14} /> {note.dosyaAdi}
                </a>
              )}

              <p className="text-xs text-muted mt-1">
                Güncellendi: {formatDate(note.guncellemeTarihi)}
              </p>

              <div className="flex gap-4 mt-2 pt-2 border-t border-border">
                <button
                  onClick={() => handleEdit(note)}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Pencil size={14} />
                  Düzenle
                </button>
                <button
                  onClick={() => setDeleteTarget(note)}
                  className="flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                >
                  <Trash2 size={14} />
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <NoteFormModal
          initialData={editingNote}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Notu arşive taşı"
        message={
          deleteTarget
            ? `"${deleteTarget.dersAdi}" notunu arşive taşımak istediğine emin misin? İstersen daha sonra arşivden geri alabilirsin.`
            : ""
        }
        confirmLabel="Arşive taşı"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}

export default function NotlarPage() {
  return (
    <RequireAuth>
      <Navbar />
      <NotesContent />
    </RequireAuth>
  );
}
