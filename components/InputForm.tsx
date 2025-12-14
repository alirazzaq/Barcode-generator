import React, { useState } from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';

interface InputFormProps {
  onAdd: (product: Product) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onAdd }) => {
  const [formData, setFormData] = useState({
    articleName: '',
    sku: '',
    price: '',
    size: '',
    color: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.articleName || !formData.sku) return;

    onAdd({
      id: crypto.randomUUID(),
      ...formData
    });

    setFormData({
      articleName: '',
      sku: '',
      price: '',
      size: '',
      color: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Article Name</label>
          <input
            name="articleName"
            value={formData.articleName}
            onChange={handleChange}
            placeholder="e.g. Johnny Collar Cable Knit Polo"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
          <input
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="e.g. SM519T0028"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Price (PKR)</label>
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="e.g. 1999"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
          <input
            name="size"
            value={formData.size}
            onChange={handleChange}
            placeholder="e.g. XL"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
          <input
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="e.g. Echo Gray"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add to Queue
        </button>
      </div>
    </form>
  );
};