import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Edit2 } from 'lucide-react';
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
        // Set default links
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

    // Ensure URL has protocol
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
      <WidgetCard title="Quick Links">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {links.map((link, index) => (
            <div
              key={link.id}
              className="group relative bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-200 border border-white/10 hover:scale-105 cursor-pointer animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="text-3xl">
                  {link.icon || (
                    <img src={getFavicon(link.url)} alt="" className="w-8 h-8" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} />
                  )}
                </div>
                <div className="text-sm font-medium text-white truncate w-full">{link.title}</div>
              </a>

              {/* Action buttons on hover */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    openEditModal(link);
                  }}
                  className="p-1 bg-blue-500/80 hover:bg-blue-500 rounded text-white"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(link.id);
                  }}
                  className="p-1 bg-red-500/80 hover:bg-red-500 rounded text-white"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={openAddModal} className="w-full">
          <Plus className="w-5 h-5" />
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
        title={editingLink ? 'Edit Link' : 'Add Link'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., GitHub"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., github.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Icon (emoji or leave empty for favicon)
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., 🚀"
            />
          </div>
          <Button onClick={editingLink ? handleUpdate : handleAdd} className="w-full">
            <ExternalLink className="w-4 h-4" />
            {editingLink ? 'Update' : 'Add'} Link
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default QuickLinksWidget;
