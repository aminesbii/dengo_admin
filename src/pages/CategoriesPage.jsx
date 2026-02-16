import { useState, useCallback, useMemo } from "react";
import { useQuery } from "../hooks/useQuery";
import { categoryApi } from "../lib/api";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Package,
  Eye,
  ShoppingCart,
  GripVertical,
  X,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";

const CategoriesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    category: null,
    action: "cascade", // "cascade" or "move"
    targetCategoryId: ""
  });
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    image: "",
    parent: "",
    isActive: true,
  });

  // Fetch categories (hierarchical structure with inactive included for admin)
  const {
    data: categoriesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: () => categoryApi.getAll({ includeInactive: true }),
  });

  // Fetch flat list for parent selection (include inactive)
  const { data: flatCategoriesData, refetch: refetchFlat } = useQuery({
    queryKey: ["categories-flat-admin"],
    queryFn: () => categoryApi.getAll({ flat: true, includeInactive: true }),
  });

  const categories = categoriesData?.categories || [];
  const flatCategories = flatCategoriesData?.categories || [];

  // Filter categories based on search
  const filterCategories = useCallback((cats, query) => {
    if (!query) return cats;

    const searchLower = query.toLowerCase();
    const filterRecursive = (items) => {
      return items.reduce((acc, cat) => {
        const matchesSearch = cat.name.toLowerCase().includes(searchLower);
        const filteredChildren = cat.subcategories ? filterRecursive(cat.subcategories) : [];

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...cat,
            subcategories: filteredChildren,
          });
        }
        return acc;
      }, []);
    };

    return filterRecursive(cats);
  }, []);

  const filteredCategories = useMemo(
    () => filterCategories(categories, searchQuery),
    [categories, searchQuery, filterCategories]
  );

  // Toggle category expansion
  const toggleExpand = (categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Expand all when searching
  useMemo(() => {
    if (searchQuery) {
      const getAllIds = (cats) => {
        return cats.reduce((acc, cat) => {
          acc.push(cat._id);
          if (cat.subcategories) {
            acc.push(...getAllIds(cat.subcategories));
          }
          return acc;
        }, []);
      };
      setExpandedCategories(new Set(getAllIds(categories)));
    }
  }, [searchQuery, categories]);

  // Open modal for create/edit
  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        description: category.description || "",
        icon: category.icon || "",
        image: category.image || "",
        parent: category.parent || "",
        isActive: category.isActive ?? true,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        icon: "",
        image: "",
        parent: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        parent: formData.parent || null,
      };

      console.log("Submitting category:", submitData);

      let result;
      if (editingCategory) {
        result = await categoryApi.update({ id: editingCategory._id, ...submitData });
      } else {
        result = await categoryApi.create(submitData);
      }

      console.log("Category saved successfully:", result);
      setShowModal(false);
      refetch();
      refetchFlat();
    } catch (error) {
      console.error("Error saving category:", error);
      console.error("Error details:", error.response?.data);
      alert(error.response?.data?.error || error.response?.data?.message || error.message || "Error saving category");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteModal.category) return;
    setIsSubmitting(true);

    try {
      const payload = {};
      if (deleteModal.action === "cascade") {
        payload.cascade = true;
      } else if (deleteModal.targetCategoryId) {
        payload.moveProductsTo = deleteModal.targetCategoryId;
        payload.moveSubcategoriesTo = deleteModal.targetCategoryId;
      }

      await categoryApi.delete(deleteModal.category._id, payload);
      setDeleteModal({ show: false, category: null, action: "cascade", targetCategoryId: "" });
      refetch();
      refetchFlat();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(error.response?.data?.error || error.response?.data?.message || "Error deleting category");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recursive category row component
  const CategoryRow = ({ category, level = 0 }) => {
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category._id);

    return (
      <>
        <tr className="hover:bg-base-300 cursor-pointer bg-base-100 transition-colors">
          <td className="py-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(category._id)}
                  className="btn btn-ghost btn-xs btn-square"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <div className="flex items-center gap-3">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center">
                    {category.icon ? (
                      <span className="text-lg">{category.icon}</span>
                    ) : (
                      <FolderTree className="w-5 h-5 text-base-content/50" />
                    )}
                  </div>
                )}
                <div>
                  <p className="font-medium">{category.name}</p>
                  {category.description && (
                    <p className="text-xs text-base-content/60 line-clamp-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </td>
          <td>
            <span className={`badge badge-sm ${level === 0 ? "badge-primary" : level === 1 ? "badge-secondary" : "badge-accent"}`}>
              Level {level}
            </span>
          </td>
          <td>
            <div className="flex items-center gap-1 text-sm">
              <Package className="w-4 h-4 text-base-content/50" />
              <span>{category.stats?.totalProducts || 0}</span>
              <span className="text-success text-xs">({category.stats?.activeProducts || 0} active)</span>
            </div>
          </td>
          <td>
            <div className="flex items-center gap-3 text-sm text-base-content/70">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {category.stats?.totalViews || 0}
              </span>
              <span className="flex items-center gap-1">
                <ShoppingCart className="w-3 h-3" />
                {category.stats?.totalSales || 0}
              </span>
            </div>
          </td>
          <td>
            <span className={`badge badge-sm ${category.isActive ? "badge-success" : "badge-error"}`}>
              {category.isActive ? "Active" : "Inactive"}
            </span>
          </td>
          <td>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openModal(category)}
                className="btn btn-ghost btn-sm btn-square"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteModal({ show: true, category, action: "cascade", targetCategoryId: "" })}
                className="btn btn-ghost btn-sm btn-square text-error"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded &&
          category.subcategories.map((child) => (
            <CategoryRow key={child._id} category={child} level={level + 1} />
          ))}
      </>
    );
  };

  // Get available parent options (exclude self and descendants when editing)
  const getParentOptions = () => {
    if (!editingCategory) return flatCategories.filter((c) => c.level < 2);

    const excludeIds = new Set([editingCategory._id]);
    const getDescendantIds = (cats, parentId) => {
      cats.forEach((cat) => {
        if (cat.parent === parentId) {
          excludeIds.add(cat._id);
          getDescendantIds(cats, cat._id);
        }
      });
    };
    getDescendantIds(flatCategories, editingCategory._id);

    return flatCategories.filter((c) => !excludeIds.has(c._id) && c.level < 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    console.error("Categories page error:", error);
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-error" />
        <p className="text-error">Error loading categories</p>
        <p className="text-sm text-base-content/60">{error?.message || "Unknown error"}</p>
        <button onClick={refetch} className="btn btn-primary btn-sm">
          Retry
        </button>
      </div>
    );
  }

  // Debug log
  console.log("Categories loaded:", categories.length, categories);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="w-7 h-7" />
            Categories
          </h1>
          <p className="text-base-content/70 mt-1">
            Manage product categories and subcategories
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10"
            />
          </div>


          {/* Add Button */}
          <button onClick={() => openModal()} className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>
      </div>


      {/* Categories Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Level</th>
                  <th>Products</th>
                  <th >Stats</th>
                  <th>Status</th>
                  <th >Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 cursor-pointer">
                      <FolderTree className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                      <p className="text-base-content/60">
                        {searchQuery ? "No categories match your search" : "No categories yet"}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => openModal()}
                          className="btn btn-primary btn-sm mt-4"
                        >
                          Create First Category
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => {
                    return <CategoryRow key={category._id} category={category} />;
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg mb-4">
              {editingCategory ? "Edit Category" : "Create Category"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name *</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-bordered"
                  placeholder="Category name"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered"
                  placeholder="Category description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Icon (Emoji)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="input input-bordered"
                    placeholder="📦"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Image URL</span>
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="input input-bordered"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Parent Category</span>
                </label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                  className="select select-bordered"
                >
                  <option value="">None (Root Category)</option>
                  {getParentOptions().map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.level > 0 ? "— " : ""}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">Active</span>
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingCategory ? (
                    <>
                      <Check className="w-4 h-4" /> Update
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg flex items-center gap-2 text-error">
              <AlertCircle className="w-5 h-5" />
              Delete Category
            </h3>
            <div className="py-4 space-y-4">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteModal.category?.name}</span>?
              </p>

              {(deleteModal.category?.stats?.totalProducts > 0 || deleteModal.category?.subcategories?.length > 0) && (
                <div className="bg-base-200 p-4 rounded-lg space-y-4">
                  <p className="text-sm font-medium text-warning flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    This category has dependencies:
                  </p>
                  <ul className="text-xs list-disc list-inside opacity-70">
                    {deleteModal.category?.stats?.totalProducts > 0 && (
                      <li>{deleteModal.category.stats.totalProducts} products</li>
                    )}
                    {(deleteModal.category?.subcategories?.length > 0) && (
                      <li>{deleteModal.category.subcategories.length} subcategories</li>
                    )}
                  </ul>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="deleteAction"
                        className="radio radio-error radio-sm"
                        checked={deleteModal.action === "cascade"}
                        onChange={() => setDeleteModal({ ...deleteModal, action: "cascade" })}
                      />
                      <span className="label-text font-bold text-error">Delete all products & subcategories (Cascade)</span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="radio"
                        name="deleteAction"
                        className="radio radio-primary radio-sm"
                        checked={deleteModal.action === "move"}
                        onChange={() => setDeleteModal({ ...deleteModal, action: "move" })}
                      />
                      <span className="label-text opacity-70">Move items to another category instead</span>
                    </label>
                  </div>

                  {deleteModal.action === "move" && (
                    <div className="form-control ml-8">
                      <select
                        className="select select-bordered select-sm w-full"
                        value={deleteModal.targetCategoryId}
                        onChange={(e) => setDeleteModal({ ...deleteModal, targetCategoryId: e.target.value })}
                        required={deleteModal.action === "move"}
                      >
                        <option value="">Select target category...</option>
                        {flatCategories
                          .filter(c => c._id !== deleteModal.category?._id && c.level < 2)
                          .map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-action">
              <button
                onClick={() => setDeleteModal({ show: false, category: null, action: "cascade", targetCategoryId: "" })}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-error"
                disabled={isSubmitting || (deleteModal.action === "move" && (deleteModal.category?.stats?.totalProducts > 0 || deleteModal.category?.subcategories?.length > 0) && !deleteModal.targetCategoryId)}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setDeleteModal({ show: false, category: null, action: "move", targetCategoryId: "" })}
          />
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
