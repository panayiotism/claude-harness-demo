import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
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
      // Try API first
      const apiNotes = await notesApi.getAll();
      setNotes(apiNotes);
      setUseLocalStorage(false);
    } catch (error) {
      // Fallback to localStorage
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
      <WidgetCard title="Notes">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No notes yet. Click the button below to add one!
            </div>
          ) : (
            notes.map((note, index) => (
              <div
                key={note.id}
                className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all duration-200 animate-slide-in border border-white/10"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-white">{note.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(note)}
                      className="text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-red-300 hover:text-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-white/80">
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
                <div className="text-xs text-white/50 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
        <Button onClick={openAddModal} className="w-full mt-4">
          <Plus className="w-5 h-5" />
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
        title={editingNote ? 'Edit Note' : 'Add Note'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Note title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Content (Markdown supported)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
              placeholder="Write your note here..."
            />
          </div>
          <div className="flex gap-3">
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
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NotesWidget;
