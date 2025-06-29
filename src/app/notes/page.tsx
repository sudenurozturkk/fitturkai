'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type Note = {
  _id?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  completed?: boolean;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const router = useRouter();

  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';
  const notesKey = `notes_${userEmail}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!userEmail) {
        router.push('/auth/login');
        return;
      }
      setChecked(true);
    }
  }, [router, userEmail]);

  useEffect(() => {
    if (!checked) return;
    const stored = localStorage.getItem(notesKey);
    let parsed = [];
    try {
      parsed = stored ? JSON.parse(stored) : [];
    } catch {
      parsed = [];
    }
    setNotes(parsed);
    setIsLoading(false);
  }, [checked, notesKey]);

  useEffect(() => {
    if (!checked) return;
    localStorage.setItem(notesKey, JSON.stringify(notes));
  }, [notes, checked, notesKey]);

  // Arama ve etiket filtreleme işlemleri localde yapılacak
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags =
      activeTags.length === 0 || activeTags.every((tag) => note.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  // Not oluşturma işlemi
  const handleCreateNote = async () => {
    setError(null);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) {
        setError('Oturum açmanız gerekiyor');
        return;
      }

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
      title,
      content,
      tags,
          userId: 'user123' // Bu kısmı gerçek kullanıcı ID'si ile değiştirin
        })
      });

      if (!response.ok) {
        throw new Error('Not oluşturulamadı');
      }

      const newNote = await response.json();
    setNotes([newNote, ...notes]);
    resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    }
  };

  const handleUpdateNote = (note: Note) => {
    setError(null);
    const updatedNote: Note = {
      ...note,
      title,
      content,
      tags,
      updatedAt: new Date(),
    };
    setNotes(notes.map((n) => (n._id === note._id ? updatedNote : n)));
    resetForm();
  };

  const handleDeleteNote = (noteId: string) => {
    setError(null);
    setNotes(notes.filter((n) => n._id !== noteId));
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return;
    setTags([...tags, tagInput.trim()]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleToggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleToggleNoteCompleted = (noteId: string) => {
    setNotes(notes.map((n) =>
      n._id === noteId ? { ...n, completed: !n.completed } : n
    ));
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setIsCreating(false);
    setEditingNote(null);
  };

  if (!checked) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light dark:bg-neutral-dark">
        <main className="md:ml-64 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-red-50 dark:from-blue-900 dark:via-green-900 dark:to-red-900">
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-fitness-blue via-fitness-green to-fitness-orange bg-clip-text text-transparent mb-4 text-center drop-shadow-lg">
            Notlar
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto">
              Sağlık ve fitness yolculuğunda önemli notlarını burada saklayabilirsin. Kategorilere
              ayır, etiketle ve istediğin zaman geri dön!
            </p>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Arama ve Filtreleme */}
          <div className="flex flex-col md:flex-row md:space-x-4 mb-4 gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Notlarda ara..."
              className="input flex-1 rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from(new Set(notes.flatMap((note) => note.tags))).map((tag) => (
              <button
                key={tag}
                onClick={() => handleToggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 shadow transition-all duration-200 border-2 ${
                  activeTags.includes(tag)
                    ? 'bg-gradient-to-r from-fitness-blue to-fitness-green text-white border-fitness-blue scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:scale-105'
                }`}
              >
                <TagIcon className="w-4 h-4" />
                <span>{tag}</span>
              </button>
            ))}
          </div>

          {/* Not Oluşturma/Düzenleme Formu */}
          <AnimatePresence>
            {(isCreating || editingNote) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card mb-8 bg-white/95 dark:bg-neutral-900/90 rounded-2xl shadow-2xl p-8 border border-fitness-blue/30"
              >
                <h2 className="text-2xl font-heading font-bold mb-4 text-fitness-blue dark:text-fitness-green">
                  {editingNote ? 'Notu Düzenle' : 'Yeni Not'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Başlık
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                      placeholder="Not başlığı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      İçerik
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="input w-full rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                      rows={5}
                      placeholder="Not içeriği"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Etiketler
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gradient-to-r from-fitness-blue to-fitness-green text-white rounded-full text-xs flex items-center shadow"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-white/70 hover:text-red-300"
                            title="Etiketi kaldır"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Etiket ekle..."
                        className="input flex-1 rounded-xl shadow focus:ring-2 focus:ring-fitness-blue"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && tagInput.trim()) {
                            handleAddTag();
                          }
                        }}
                      />
                      <button onClick={handleAddTag} className="btn-secondary rounded-xl">
                        Ekle
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button onClick={resetForm} className="btn-secondary rounded-xl">
                      İptal
                    </button>
                    <button
                      onClick={() =>
                        editingNote ? handleUpdateNote(editingNote) : handleCreateNote()
                      }
                      className="btn-primary rounded-xl"
                    >
                      {editingNote ? 'Güncelle' : 'Oluştur'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Not Listesi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 opacity-60">
                <img src="/empty-notes.svg" alt="Boş Notlar" className="w-32 h-32 mb-4" />
                <p className="text-lg font-semibold">Henüz hiç notun yok. Hemen bir not ekle!</p>
              </div>
            )}
            {filteredNotes.map((note) => (
              <motion.div
                key={note._id?.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.12)' }}
                className={`card bg-white/90 dark:bg-neutral-900/80 rounded-2xl shadow-xl p-6 transition-all duration-200 border border-gray-100 dark:border-gray-800 hover:border-fitness-blue ${note.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`text-lg font-bold text-fitness-blue dark:text-fitness-green flex-1 truncate ${note.completed ? 'line-through text-green-600 dark:text-green-400' : ''}`}>{note.title}</h3>
                  <div className="flex space-x-2 items-center">
                    <button
                      onClick={() => handleToggleNoteCompleted(note._id?.toString() || '')}
                      className={`p-2 rounded-full border-2 transition-all duration-200 ${note.completed ? 'bg-gradient-to-r from-fitness-green to-green-400 text-white border-fitness-green scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-700 hover:scale-105'}`}
                      title={note.completed ? 'Tamamlandı' : 'Tamamla'}
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingNote(note);
                        setTitle(note.title);
                        setContent(note.content);
                        setTags(note.tags);
                      }}
                      className="p-2 text-gray-500 hover:text-primary"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note._id?.toString() || '')}
                      className="p-2 text-gray-500 hover:text-red-500"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-200 mb-4 whitespace-pre-wrap min-h-[60px]">
                  {note.content}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {note.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gradient-to-r from-fitness-blue to-fitness-green text-white rounded-full text-xs flex items-center shadow"
                    >
                      <TagIcon className="w-4 h-4 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                  <span>
                    Oluşturulma:{' '}
                    {note.createdAt ? new Date(note.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </span>
                  <span>
                    Son Güncelleme:{' '}
                    {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Yeni Not Ekleme Butonu */}
          {!isCreating && !editingNote && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsCreating(true)}
              className="fixed bottom-8 right-8 p-5 bg-gradient-to-br from-fitness-blue to-fitness-green text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-fitness-blue/40 transition-all z-50 border-4 border-white dark:border-neutral-900"
              title="Yeni Not Ekle"
            >
              <PlusIcon className="w-7 h-7" />
            </motion.button>
          )}
        </div>
      </main>
    </div>
  );
}
