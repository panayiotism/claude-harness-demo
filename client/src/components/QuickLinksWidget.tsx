import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ExternalLink, Edit2, Link } from 'lucide-react';
import WidgetCard from './WidgetCard';
import Button from './Button';
import Modal from './Modal';
import { QuickLink } from '../types';
import { linksApi } from '../api/links';

const QuickLinksWidget: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', icon: '' });
  const [useLocalStorage, setUseLocalStorage] = useState(true);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const apiLinks = await linksApi.getAll();
      setLinks(apiLinks);
      setUseLocalStorage(false);
    } catch (error) {
      const stored = localStorage.getItem('quickLinks');
      if (stored) {
        setLinks(JSON.parse(stored));
      } else {
        const defaultLinks: QuickLink[] = [
          {
            id: '1',
            title: 'GitHub',
            url: 'https://github.com',
            icon: '🐙',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Gmail',
            url: 'https://gmail.com',
            icon: '📧',
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'Calendar',
            url: 'https://calendar.google.com',
            icon: '📅',
            createdAt: new Date().toISOString(),
          },
        ];
        setLinks(defaultLinks);
        localStorage.setItem('quickLinks', JSON.stringify(defaultLinks));
      }
      setUseLocalStorage(true);
    }
  };

  const saveToStorage = (updatedLinks: QuickLink[]) => {
    if (useLocalStorage) {
      localStorage.setItem('quickLinks', JSON.stringify(updatedLinks));
    }
  };

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.url.trim()) return;

    let url = formData.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const newLink: QuickLink = {
      id: Date.now().toString(),
      title: formData.title,
      url,
      icon: formData.icon || '🔗',
      createdAt: new Date().toISOString(),
    };

    try {
      if (useLocalStorage) {
        const updatedLinks = [...links, newLink];
        setLinks(updatedLinks);
        saveToStorage(updatedLinks);
      } else {
        const created = await linksApi.create({ title: newLink.title, url: newLink.url, icon: newLink.icon });
        setLinks([...links, created]);
      }
      setFormData({ title: '', url: '', icon: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingLink || !formData.title.trim() || !formData.url.trim()) return;

    let url = formData.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      if (useLocalStorage) {
        const updatedLinks = links.map((link) =>
          link.id === editingLink.id
            ? { ...link, title: formData.title, url, icon: formData.icon || '🔗' }
            : link
        );
        setLinks(updatedLinks);
        saveToStorage(updatedLinks);
      } else {
        const updated = await linksApi.update(editingLink.id, { title: formData.title, url, icon: formData.icon });
        setLinks(links.map((link) => (link.id === editingLink.id ? updated : link)));
      }
      setFormData({ title: '', url: '', icon: '' });
      setEditingLink(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (useLocalStorage) {
        const updatedLinks = links.filter((link) => link.id !== id);
        setLinks(updatedLinks);
        saveToStorage(updatedLinks);
      } else {
        await linksApi.delete(id);
        setLinks(links.filter((link) => link.id !== id));
      }
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const openAddModal = () => {
    setFormData({ title: '', url: '', icon: '' });
    setEditingLink(null);
    setIsModalOpen(true);
  };

  const openEditModal = (link: QuickLink) => {
    setFormData({ title: link.title, url: link.url, icon: link.icon || '' });
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  };

  return (
    <>
      <WidgetCard title="Quick Links" delay={4}>
        {links.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Link className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No links yet</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <AnimatePresence mode="popLayout">
              {links.map((link, index) => (
                <motion.div
                  key={link.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.05
                  }}
                  whileHover={{ y: -2 }}
                  className="group relative"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-noir-800/50 hover:bg-noir-700/50 rounded-xl p-4 border border-white/[0.04] hover:border-amber-400/20 transition-all"
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <motion.span
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl"
                      >
                        {link.icon || (
                          <img
                            src={getFavicon(link.url)}
                            alt=""
                            className="w-6 h-6"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </motion.span>
                      <span className="text-sm font-medium text-white truncate w-full">
                        {link.title}
                      </span>
                    </div>
                  </a>

                  {/* Hover actions */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.preventDefault();
                        openEditModal(link);
                      }}
                      className="p-1 rounded-md bg-noir-900/80 hover:bg-amber-400/20 text-white/40 hover:text-amber-400 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(link.id);
                      }}
                      className="p-1 rounded-md bg-noir-900/80 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <Button onClick={openAddModal} className="w-full">
          <Plus className="w-4 h-4" />
          Add Link
        </Button>
      </WidgetCard>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLink(null);
          setFormData({ title: '', url: '', icon: '' });
        }}
        title={editingLink ? 'Edit Link' : 'New Link'}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-colors"
              placeholder="e.g., GitHub"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-colors"
              placeholder="e.g., github.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Icon <span className="text-white/40">(emoji or leave empty)</span>
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-colors"
              placeholder="e.g., 🚀"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingLink(null);
                setFormData({ title: '', url: '', icon: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingLink ? handleUpdate : handleAdd}>
              <ExternalLink className="w-4 h-4" />
              {editingLink ? 'Update' : 'Add'} Link
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default QuickLinksWidget;
