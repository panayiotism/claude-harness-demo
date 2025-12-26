import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Save, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import WidgetCard from './WidgetCard';
import Button from './Button';
import Modal from './Modal';
import { Note } from '../types';
import { notesApi } from '../api/notes';

const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [useLocalStorage, setUseLocalStorage] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const apiNotes = await notesApi.getAll();
      setNotes(apiNotes);
      setUseLocalStorage(false);
    } catch (error) {
      const stored = localStorage.getItem('notes');
      if (stored) {
        setNotes(JSON.parse(stored));
      }
      setUseLocalStorage(true);
    }
  };

  const saveToStorage = (updatedNotes: Note[]) => {
    if (useLocalStorage) {
      localStorage.setItem('notes', JSON.stringify(updatedNotes));
    }
  };

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (useLocalStorage) {
        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        saveToStorage(updatedNotes);
      } else {
        const created = await notesApi.create({ title: newNote.title, content: newNote.content });
        setNotes([...notes, created]);
      }
      setFormData({ title: '', content: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingNote || !formData.title.trim() || !formData.content.trim()) return;

    try {
      if (useLocalStorage) {
        const updatedNotes = notes.map((note) =>
          note.id === editingNote.id
            ? { ...note, title: formData.title, content: formData.content, updatedAt: new Date().toISOString() }
            : note
        );
        setNotes(updatedNotes);
        saveToStorage(updatedNotes);
      } else {
        const updated = await notesApi.update(editingNote.id, { title: formData.title, content: formData.content });
        setNotes(notes.map((note) => (note.id === editingNote.id ? updated : note)));
      }
      setFormData({ title: '', content: '' });
      setEditingNote(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (useLocalStorage) {
        const updatedNotes = notes.filter((note) => note.id !== id);
        setNotes(updatedNotes);
        saveToStorage(updatedNotes);
      } else {
        await notesApi.delete(id);
        setNotes(notes.filter((note) => note.id !== id));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const openAddModal = () => {
    setFormData({ title: '', content: '' });
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setFormData({ title: note.title, content: note.content });
    setEditingNote(note);
    setIsModalOpen(true);
  };

  return (
    <>
      <WidgetCard title="Notes" delay={1}>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No notes yet</p>
              <p className="text-white/30 text-xs mt-1">Click below to add your first note</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.05
                  }}
                  whileHover={{ x: 4 }}
                  className="group relative bg-noir-800/50 rounded-xl p-4 border border-white/[0.04] hover:border-amber-400/20 transition-colors"
                >
                  {/* Left accent */}
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-gradient-to-b from-amber-400/50 via-amber-400/20 to-transparent rounded-full" />

                  <div className="flex justify-between items-start gap-3 pl-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-medium text-white truncate">{note.title}</h3>
                      <div className="prose-noir text-sm mt-2 line-clamp-2">
                        <ReactMarkdown>{note.content}</ReactMarkdown>
                      </div>
                      <p className="text-white/30 text-xs mt-2">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditModal(note)}
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-400/20 text-white/40 hover:text-amber-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        <Button onClick={openAddModal} className="w-full mt-4">
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </WidgetCard>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
          setFormData({ title: '', content: '' });
        }}
        title={editingNote ? 'Edit Note' : 'New Note'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-noir-800 border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-colors"
              placeholder="Note title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Content <span className="text-white/30">(Markdown supported)</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2.5 bg-noir-800 border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-colors min-h-[150px] resize-none"
              placeholder="Write your note here..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={editingNote ? handleUpdate : handleAdd} className="flex-1">
              <Save className="w-4 h-4" />
              {editingNote ? 'Update' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                setEditingNote(null);
                setFormData({ title: '', content: '' });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NotesWidget;
