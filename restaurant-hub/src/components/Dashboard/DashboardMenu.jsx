import { useState } from "react";
import { IconSearch, IconPlus, IconTrash, IconX, IconStar } from "../Icons";

const PRESET_FOOD_IMAGES = [
  {
    label: "Classic Burger",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  },
  {
    label: "Zinger Crunch",
    url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80",
  },
  {
    label: "BBQ Smash",
    url: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80",
  },
  {
    label: "Shawarma Wrap",
    url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&q=80",
  },
  {
    label: "Fajita Pizza",
    url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&q=80",
  },
  {
    label: "Pepperoni Pizza",
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  },
  {
    label: "Loaded Fries",
    url: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&q=80",
  },
  {
    label: "Peri Wings",
    url: "https://images.unsplash.com/photo-1527477378408-1bc0b9856f67?w=800&q=80",
  },
  {
    label: "Choc Shake",
    url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80",
  },
  {
    label: "Lotus Shake",
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80",
  },
  {
    label: "Mega Deal Box",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  },
];

export default function DashboardMenu({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onShowToast,
  isAddModalOpen,
  setIsAddModalOpen,
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Burgers",
    price: "",
    description: "",
    image: PRESET_FOOD_IMAGES[0].url,
    badge: "New",
    isSpicy: false,
    isVeg: false,
    prepTime: "15 min",
    calories: "650 kcal",
  });

  const categories = ["All", "Burgers", "Shawarma", "Pizza", "Sides", "Drinks", "Deals"];

  const filteredProducts = products.filter((product) => {
    const catMatch = categoryFilter === "All" || product.category === categoryFilter;
    let searchMatch = true;
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      searchMatch =
        product.title.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q);
    }
    return catMatch && searchMatch;
  });

  const handleOpenAdd = () => {
    setFormData({
      title: "",
      category: "Burgers",
      price: "",
      description: "",
      image: PRESET_FOOD_IMAGES[0].url,
      badge: "New",
      isSpicy: false,
      isVeg: false,
      prepTime: "15 min",
      calories: "650 kcal",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setFormData({
      title: product.title,
      category: product.category,
      price: String(product.price),
      description: product.description || "",
      image: product.image || PRESET_FOOD_IMAGES[0].url,
      badge: product.badge || "",
      isSpicy: Boolean(product.isSpicy),
      isVeg: Boolean(product.isVeg),
      prepTime: product.prepTime || "15 min",
      calories: product.calories || "650 kcal",
    });
    setEditingProduct(product);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.price) {
      alert("Please provide dish title and price.");
      return;
    }

    if (editingProduct) {
      // Update
      await onUpdateProduct(editingProduct.id, {
        ...formData,
        price: Number(formData.price),
      });
      if (onShowToast) onShowToast(`Updated "${formData.title}" successfully!`);
      setEditingProduct(null);
    } else {
      // Add
      await onAddProduct({
        ...formData,
        price: Number(formData.price),
        rating: 5.0,
      });
      if (onShowToast) onShowToast(`Added "${formData.title}" to menu! `);
      setIsAddModalOpen(false);
    }
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}" from the menu?`)) {
      onDeleteProduct(id);
      if (onShowToast) onShowToast(`Deleted "${title}"`);
    }
  };

  const handleToggleStock = (product) => {
    const updated = !product.inStock;
    onUpdateProduct(product.id, { inStock: updated });
    if (onShowToast) {
      onShowToast(`"${product.title}" is now ${updated ? "In Stock ✓" : "Out of Stock ✕"}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="bg-[#2A211B] p-5 rounded-3xl border border-[#F5EBDD]/10 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl text-[#F5EBDD]">
            Menu Dishes & Pricing Catalog
          </h2>
          <p className="text-xs text-[#C19A6B]">
            {filteredProducts.length} dishes displayed • Add, edit, or adjust pricing & stock
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C19A6B]">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#2A211B]/70 border border-[#F5EBDD]/10 text-xs font-medium focus:outline-none focus:border-[#D4A017]"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-[#D4A017] hover:bg-[#B98B12] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#D4A017]/30 flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
          >
            <IconPlus className="w-4 h-4" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              categoryFilter === cat
                ? "bg-[#171513] text-white shadow"
                : "bg-[#2A211B] text-[#F5EBDD]/70 hover:bg-[#2A211B] border border-[#F5EBDD]/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Catalog Table */}
      <div className="bg-[#2A211B] rounded-3xl border border-[#F5EBDD]/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2A211B]/60 border-b border-[#F5EBDD]/10 text-[#C19A6B] uppercase text-[10px] font-extrabold">
              <tr>
                <th className="py-3.5 px-4">Dish Info</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Stock Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EBDD]/5">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#171513] transition-colors">
                  {/* Dish Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded-xl shrink-0 bg-[#2A211B]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-[#F5EBDD] text-xs sm:text-sm">
                            {product.title}
                          </p>
                          {product.isSpicy && <span title="Spicy"></span>}
                          {product.badge && (
                            <span className="bg-[#3B3020] text-[#D4A017] text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#C19A6B] line-clamp-1 max-w-xs">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="bg-[#2A211B] text-[#F5EBDD] px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                      {product.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <span className="font-display font-extrabold text-sm text-[#D4A017]">
                      Rs. {product.price.toLocaleString()}
                    </span>
                  </td>

                  {/* Rating */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-bold text-[#F5EBDD]">
                      <IconStar className="w-3.5 h-3.5 text-[#C19A6B] fill-[#C19A6B]" />
                      <span>{product.rating}</span>
                    </div>
                  </td>

                  {/* Stock Toggle */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStock(product)}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-colors ${
                        product.inStock !== false
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                      }`}
                    >
                      {product.inStock !== false ? "✓ In Stock" : "✕ Out of Stock"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="bg-[#2A211B] hover:bg-[#171513] hover:text-white text-[#F5EBDD] px-3 py-1.5 rounded-xl font-bold text-xs transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(product.id, product.title)}
                        className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                        aria-label="Delete dish"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT DISH MODAL */}
      {(isAddModalOpen || editingProduct) && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-fade-in"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
        >
          <div
            className="relative w-full max-w-2xl bg-[#2A211B] rounded-3xl shadow-2xl overflow-hidden animate-pop-in max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#171513] text-white p-6 flex items-center justify-between">
              <h3 className="font-display font-extrabold text-xl text-white">
                {editingProduct ? `Edit "${editingProduct.title}"` : "Add New Dish to Menu"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveProduct}
              className="p-6 overflow-y-auto scroll-thin flex-1 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#F5EBDD] mb-1">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Smoky Truffle Beef Burger"
                    className="w-full p-2.5 rounded-xl bg-[#2A211B]/70 border border-[#F5EBDD]/10 text-xs focus:bg-[#2A211B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#F5EBDD] mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#2A211B]/70 border border-[#F5EBDD]/10 text-xs focus:bg-[#2A211B] focus:outline-none"
                  >
                    {categories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#F5EBDD] mb-1">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 799"
                    className="w-full p-2.5 rounded-xl bg-[#2A211B]/70 border border-[#F5EBDD]/10 text-xs focus:bg-[#2A211B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#F5EBDD] mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Bestseller / 20% OFF"
                    className="w-full p-2.5 rounded-xl bg-[#2A211B]/70 border border-[#F5EBDD]/10 text-xs focus:bg-[#2A211B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#F5EBDD] mb-1">Prep Time</label>
                  <input
                    type="text"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    placeholder="e.g. 15-20 min"
                    className="w-full p-2.5 rounded-xl bg-[#2A211B]/70 border border-[#F5EBDD]/10 text-xs focus:bg-[#2A211B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-[#F5EBDD] mb-1">
                  Mouth-watering Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe ingredients, meat cut, crust, sauce flavors..."
                  className="w-full p-2.5 rounded-xl bg-[#2A211B]/70 border border-[#F5EBDD]/10 text-xs focus:bg-[#2A211B] focus:outline-none resize-none"
                />
              </div>

              {/* Image URL & Quick Presets */}
              <div>
                <label className="block font-bold text-[#F5EBDD] mb-1">Food Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl bg-[#2A211B]/70 border border-[#F5EBDD]/10 text-xs focus:bg-[#2A211B] focus:outline-none mb-2"
                />

                <p className="text-[10px] text-[#C19A6B] mb-1.5 font-semibold uppercase">
                  Or pick a high-res food photo preset:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_FOOD_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.url })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        formData.image === preset.url
                          ? "bg-[#D4A017] text-white border-[#D4A017]"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Toggles */}
              <div className="flex gap-4 pt-2 border-t border-[#F5EBDD]/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSpicy}
                    onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                    className="w-4 h-4 text-[#D4A017] accent-[#D4A017]"
                  />
                  <span className="font-bold text-[#F5EBDD]"> Spicy Flavor</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="w-4 h-4 text-[#D4A017] accent-[#D4A017]"
                  />
                  <span className="font-bold text-[#F5EBDD]"> Vegetarian Friendly</span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-3 border border-[#F5EBDD]/20 text-[#F5EBDD] font-bold rounded-xl hover:bg-[#2A211B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#D4A017] hover:bg-[#B98B12] text-white font-extrabold rounded-xl shadow-lg shadow-[#D4A017]/30"
                >
                  {editingProduct ? "Save Changes" : "Publish to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
