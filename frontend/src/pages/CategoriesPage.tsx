import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Category } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { ReassignCategoryModal } from '../components/ReassignCategoryModal';
import api from '../api/client';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface CategoriesPageProps {
  categories: Category[];
  onCategoriesUpdated: () => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onCategoriesUpdated,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>('#84CC16');
  const [adding, setAdding] = useState<boolean>(false);

  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('#84CC16');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const paletteColors = [
    '#84CC16', // Lime
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#14B8A6', // Teal
    '#FF2E93', // Hot Coral
  ];

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAdding(true);
    try {
      await api.post('/categories', {
        name: newCatName.trim(),
        color: newCatColor,
      });
      setNewCatName('');
      onCategoriesUpdated();
    } catch (err) {
      console.error('Failed to create category', err);
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditColor(cat.color || '#84CC16');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editName.trim()) return;

    setSavingEdit(true);
    try {
      await api.put(`/categories/${editingCat.id}`, {
        name: editName.trim(),
        color: editColor,
      });
      setEditingCat(null);
      onCategoriesUpdated();
    } catch (err) {
      console.error('Failed to update category', err);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
          Category Management
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Customize category names, color badges, and handle expense reassignments
        </p>
      </div>

      {/* Add Category Form */}
      <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-400 mb-4">
          Add New Category
        </h3>
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name (e.g. Subscriptions, Travel)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50 dark:bg-neutral-850 text-sm focus:outline-none focus:border-stone-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-400 font-medium">Color:</span>
            <div className="flex items-center space-x-1.5">
              {paletteColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCatColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newCatColor === color ? 'scale-125 ring-2 ring-stone-400 dark:ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            type="submit"
            disabled={adding}
            className="px-4 py-2.5 rounded-xl bg-ink-accent hover:bg-ink-accentHover text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>{adding ? 'Adding...' : 'Add Category'}</span>
          </motion.button>
        </form>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isEditing = editingCat?.id === cat.id;

          if (isEditing) {
            return (
              <form
                key={cat.id}
                onSubmit={handleSaveEdit}
                className="bg-white dark:bg-neutral-900 border border-ink-accent dark:border-white rounded-2xl p-4 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-400">Edit Category</span>
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="p-1 text-stone-400 hover:text-stone-600"
                  >
                    <X size={15} />
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50 dark:bg-neutral-850 text-xs font-semibold"
                />

                <div className="flex items-center space-x-1.5">
                  {paletteColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        editColor === color ? 'scale-125 ring-2 ring-stone-400' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-3 py-1.5 rounded-xl bg-ink-accent text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1"
                  >
                    <Check size={13} />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            );
          }

          return (
            <motion.div
              key={cat.id}
              whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <CategoryIcon name={cat.name} color={cat.color} size={16} />
                <div>
                  <h4 className="text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary">
                    {cat.name}
                  </h4>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                    {cat.color}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleStartEdit(cat)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Edit Category"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  onClick={() => setCategoryToDelete(cat)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete Category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Category Reassignment Prompt Modal */}
      <ReassignCategoryModal
        categoryToDelete={categoryToDelete}
        allCategories={categories}
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onCategoryDeleted={onCategoriesUpdated}
      />
    </div>
  );
};
