import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "../hooks/useQuery";
import { productApi, categoryApi, vendorApi } from "../lib/api";
import { formatDate } from "../lib/utils";
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  Upload,
  Star,
  ImageIcon,
  Loader2,
  AlertCircle,
  Tag,
  Percent,
  DollarSign,
  Store,
  TrendingUp,
  ShoppingCart,
  Users,
  Calendar,
  Boxes,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  BarChart3,
  FolderTree,
} from "lucide-react";

function ProductsPage() {
  // State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    stock: "",
    lowStockThreshold: "10",
    category: "",
    subcategory: "",
    vendor: "",
    brand: "",
    tags: "",
    discount: { type: "none", value: "", startDate: "", endDate: "" },
    isFeatured: false,
    isPublished: true,
    trackInventory: true,
    allowBackorders: false,
    colors: [],
    sizes: [],
    weight: "",
    customAttributes: [],
    relatedProducts: [],
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImagePrimaryIndex, setNewImagePrimaryIndex] = useState(0);
  const [shopProducts, setShopProducts] = useState([]);
  const [isLoadingShopProducts, setIsLoadingShopProducts] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products
  const { data, isLoading: loadingProducts, refetch } = useQuery({
    queryKey: ["products", statusFilter, debouncedSearch, categoryFilter],
    queryFn: () =>
      productApi.getAll({
        stockStatus: statusFilter !== "all" ? statusFilter : "",
        search: debouncedSearch,
        category: categoryFilter,
      }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: () => categoryApi.getAll({ includeInactive: true }),
  });

  // Fetch flat categories for subcategory
  const { data: flatCategoriesData } = useQuery({
    queryKey: ["categories-flat-admin"],
    queryFn: () => categoryApi.getAll({ flat: true, includeInactive: true }),
  });

  // Fetch vendors
  const { data: vendorsData } = useQuery({
    queryKey: ["vendors-list"],
    queryFn: () => vendorApi.getAll({ status: "approved", limit: 100 }),
  });

  // Fetch product stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["product-stats", selectedProduct?._id],
    queryFn: () => (selectedProduct ? productApi.getStats(selectedProduct._id) : null),
    enabled: !!selectedProduct && isStatsModalOpen,
  });

  const products = data?.products || [];
  const counts = {
    all: data?.pagination?.total || 0,
    in_stock: data?.statusCounts?.inStock || 0,
    low_stock: data?.statusCounts?.lowStock || 0,
    out_of_stock: data?.statusCounts?.outOfStock || 0,
  };

  const allCount =
    (counts.in_stock || 0) +
    (counts.low_stock || 0) +
    (counts.out_of_stock || 0);

  const categories = categoriesData?.categories || [];
  const flatCategories = flatCategoriesData?.categories || [];
  const vendors = vendorsData?.shops || [];

  // Root categories (level 0)
  const rootCategories = useMemo(() => {
    return categories.filter((cat) => cat.level === 0 || !cat.parent);
  }, [categories]);

  // Fetch all products from selected shop
  useEffect(() => {
    const fetchShopProducts = async () => {
      if (!formData.vendor) {
        setShopProducts([]);
        return;
      }

      setIsLoadingShopProducts(true);
      try {
        const response = await productApi.getAll({
          vendor: formData.vendor,
          limit: 100, // Fetch a reasonable amount for selection
        });

        const currentId = selectedProduct?._id;
        const selectedIds = formData.relatedProducts.map(p => p._id || p);

        const filtered = (response.products || []).filter(
          p => p._id !== currentId && !selectedIds.includes(p._id)
        );
        setShopProducts(filtered);
      } catch (error) {
        console.error("Error fetching shop products:", error);
      } finally {
        setIsLoadingShopProducts(false);
      }
    };

    fetchShopProducts();
  }, [formData.vendor, formData.relatedProducts, selectedProduct]);

  const addRelatedProduct = (product) => {
    setFormData(prev => ({
      ...prev,
      relatedProducts: [...prev.relatedProducts, product]
    }));
    setRelatedProductsSearch("");
    setRelatedProductsResults([]);
  };

  const removeRelatedProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      relatedProducts: prev.relatedProducts.filter(p => (p._id || p) !== productId)
    }));
  };

  // Subcategories for selected category
  const subcategories = useMemo(() => {
    if (!formData.category) return [];
    return flatCategories.filter(
      (cat) => cat.parent && cat.parent.toString() === formData.category.toString()
    );
  }, [flatCategories, formData.category]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      compareAtPrice: "",
      costPrice: "",
      stock: "",
      lowStockThreshold: "10",
      category: "",
      subcategory: "",
      vendor: "",
      brand: "",
      tags: "",
      discount: { type: "none", value: "", startDate: "", endDate: "" },
      isFeatured: false,
      isPublished: true,
      trackInventory: true,
      allowBackorders: false,
      colors: [],
      sizes: [],
      weight: "",
      customAttributes: [],
      relatedProducts: [],
    });
    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setNewImagePrimaryIndex(0);
    setShopProducts([]);
  };

  // View product details
  const handleView = async (product) => {
    try {
      setIsLoading(true);
      const response = await productApi.getById(product._id);
      setSelectedProduct(response.product);
      setActiveTab("details");
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Failed to fetch product details");
    } finally {
      setIsLoading(false);
    }
  };

  // View product stats
  const handleViewStats = (product) => {
    setSelectedProduct(product);
    setIsStatsModalOpen(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setIsEditing(false);
    resetForm();
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (product) => {
    setIsEditing(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      compareAtPrice: product.compareAtPrice?.toString() || "",
      costPrice: product.costPrice?.toString() || "",
      stock: product.stock?.toString() || "",
      lowStockThreshold: product.lowStockThreshold?.toString() || "10",
      category: product.category?._id || product.category || "",
      subcategory: product.subcategory?._id || product.subcategory || "",
      vendor: product.vendor?._id || product.vendor || "",
      brand: product.brand || "",
      tags: product.tags?.join(", ") || "",
      discount: {
        type: product.discount?.type || "none",
        value: product.discount?.value?.toString() || "",
        startDate: product.discount?.startDate?.split("T")[0] || "",
        endDate: product.discount?.endDate?.split("T")[0] || "",
      },
      isFeatured: product.isFeatured || false,
      isPublished: product.isPublished ?? true,
      trackInventory: product.trackInventory ?? true,
      allowBackorders: product.allowBackorders || false,
      colors: product.colors || [],
      sizes: product.sizes || [],
      weight: product.weight || "",
      customAttributes: product.customAttributes || [],
      relatedProducts: product.relatedProducts || [],
    });
    setExistingImages(product.images || []);
    setExistingImages(product.images || []);
    setImages([]);
    setImagePreviews([]);
    setNewImagePrimaryIndex(-1);
    setIsFormModalOpen(true);
  };

  // Handle image change
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5 - existingImages.length;
    if (files.length > maxImages) {
      alert(`Maximum ${5 - existingImages.length} more images allowed`);
      return;
    }
    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // Remove existing image
  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove new image
  const removeNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const url = prev[index];
      if (typeof url === "string" && url.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    // Adjust primary index validity
    if (newImagePrimaryIndex === index) {
      setNewImagePrimaryIndex(-1);
    } else if (newImagePrimaryIndex > index) {
      setNewImagePrimaryIndex((prev) => prev - 1);
    }
  };

  const setPrimaryImage = (type, index) => {
    if (type === 'existing') {
      setExistingImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
      setNewImagePrimaryIndex(-1);
    } else {
      setExistingImages(prev => prev.map(img => ({ ...img, isPrimary: false })));
      setNewImagePrimaryIndex(index);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditing && imagePreviews.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    if (!formData.category) {
      alert("Please select a category");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      if (formData.compareAtPrice) formDataToSend.append("compareAtPrice", formData.compareAtPrice);
      if (formData.costPrice) formDataToSend.append("costPrice", formData.costPrice);
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("lowStockThreshold", formData.lowStockThreshold);
      formDataToSend.append("category", formData.category);
      if (formData.subcategory) formDataToSend.append("subcategory", formData.subcategory);
      formDataToSend.append("vendor", formData.vendor || "");
      if (formData.brand) formDataToSend.append("brand", formData.brand);
      if (formData.tags) {
        formDataToSend.append("tags", JSON.stringify(formData.tags.split(",").map((t) => t.trim())));
      }
      formDataToSend.append("discount", JSON.stringify(formData.discount));
      formDataToSend.append("isFeatured", formData.isFeatured);
      formDataToSend.append("isPublished", formData.isPublished);
      formDataToSend.append("trackInventory", formData.trackInventory);
      formDataToSend.append("allowBackorders", formData.allowBackorders);
      if (formData.colors) formDataToSend.append("colors", JSON.stringify(formData.colors));
      if (formData.sizes) formDataToSend.append("sizes", JSON.stringify(formData.sizes));
      if (formData.weight) formDataToSend.append("weight", formData.weight);
      if (formData.customAttributes) formDataToSend.append("customAttributes", JSON.stringify(formData.customAttributes));
      if (formData.relatedProducts) {
        formDataToSend.append("relatedProducts", JSON.stringify(formData.relatedProducts.map(p => p._id || p)));
      }

      if (isEditing) {
        formDataToSend.append("existingImages", JSON.stringify(existingImages));
      }
      formDataToSend.append("newImagePrimaryIndex", newImagePrimaryIndex);

      images.forEach((image) => formDataToSend.append("images", image));

      if (isEditing) {
        await productApi.update({ id: selectedProduct._id, formData: formDataToSend });
        alert("Product updated successfully!");
      } else {
        await productApi.create(formDataToSend);
        alert("Product created successfully!");
      }

      setIsFormModalOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error.response?.data?.message || "Failed to save product");
    } finally {
      setIsLoading(false);
    }
  };



  // Handle delete
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await productApi.delete(selectedProduct._id);
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      refetch();
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error.response?.data?.message || "Failed to delete product");
    } finally {
      setIsLoading(false);
    }
  };

  // Get stock status badge
  const getStockBadge = (status) => {
    const badges = {
      in_stock: { bg: "bg-success/20", text: "text-success", icon: CheckCircle, label: "In Stock" },
      low_stock: { bg: "bg-warning/20", text: "text-warning", icon: AlertCircle, label: "Low Stock" },
      out_of_stock: { bg: "bg-error/20", text: "text-error", icon: XCircle, label: "Out of Stock" },
      backorder: { bg: "bg-primary/20", text: "text-primary", icon: Clock, label: "Backorder" },
    };
    const badge = badges[status] || badges.in_stock;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            Products
          </h1>
          <p className="text-base-content/70">
            Manage your product catalog
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select select-bordered w-full md:w-48"
          >
            <option value="">All Categories</option>
            {rootCategories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Add Button */}
          <button onClick={openCreateModal} className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>


      {/* Status Tabs */}
      <div className="tabs tabs-boxed bg-base-100 p-1">
        {[
          { key: "all", label: "All", count: allCount },
          { key: "in_stock", label: "In Stock", count: counts.in_stock, color: "text-success" },
          { key: "low_stock", label: "Low Stock", count: counts.low_stock, color: "text-warning" },
          { key: "out_of_stock", label: "Out of Stock", count: counts.out_of_stock, color: "text-error" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab ${statusFilter === tab.key ? "tab-active" : ""}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
            <span className={`ml-2 badge badge-sm p-2 ${tab.color || ""}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* PRODUCTS TABLE */}
      <div className="card bg-base-100  ">
        <div className="overflow-x-auto">
          {loadingProducts ? (
            <div className="flex justify-center items-center py-20">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-base-content/50">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No products found</p>
              <p className="text-sm">
                {statusFilter !== "all"
                  ? `No ${statusFilter.replace("_", " ")} products`
                  : "Add your first product to get started"}
              </p>
              <button onClick={openCreateModal} className="btn btn-primary btn-sm mt-4">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const primaryImage =
                    product.images?.find((img) => img.isPrimary)?.url ||
                    product.images?.[0]?.url ||
                    product.thumbnail;

                  return (
                    <tr key={product._id} className="hover cursor-pointer" >
                      {/* Product Info */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center">
                              {primaryImage ? (
                                <img src={primaryImage} alt={product.name} className="object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-base-content/50" />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold line-clamp-1">{product.name}</div>
                            <div className="text-sm text-base-content/60">{product.sku}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {product.isFeatured && (
                                <span className="badge badge-warning badge-xs">Featured</span>
                              )}
                              {!product.isPublished && (
                                <span className="badge badge-ghost badge-xs">Draft</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <FolderTree className="w-3 h-3 text-base-content/50" />
                            {product.category?.name || "—"}
                          </div>
                          {product.subcategory && (
                            <div className="text-xs text-base-content/60 ml-4">
                              {product.subcategory.name}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Vendor */}
                      <td>
                        {product.vendor ? (
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-base-content/50" />
                            <span className="text-sm">{product.vendor.name}</span>
                          </div>
                        ) : (
                          <span className="badge badge-primary badge-sm">Admin</span>
                        )}
                      </td>

                      {/* Price */}
                      <td>
                        <div>
                          {product.salePrice && product.salePrice < product.price ? (
                            <>
                              <div className="font-bold text-success">${product.salePrice?.toFixed(2)}</div>
                              <div className="text-xs text-base-content/50 line-through">
                                ${product.price?.toFixed(2)}
                              </div>
                            </>
                          ) : (
                            <div className="font-bold">${product.price?.toFixed(2)}</div>
                          )}
                          {product.discount?.type !== "none" && (
                            <span className="badge badge-error badge-xs">
                              {product.discount.type === "percentage"
                                ? `${product.discount.value}% OFF`
                                : `$${product.discount.value} OFF`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td>
                        <div className="font-mono">{product.stock}</div>
                      </td>

                      {/* Status */}
                      <td>{getStockBadge(product.stockStatus)}</td>

                      {/* Created */}
                      <td className="text-sm text-base-content/70">
                        {formatDate(product.createdAt)}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleView(product)}
                            className="btn btn-ghost btn-sm btn-square"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewStats(product)}
                            className="btn btn-ghost btn-sm btn-square"
                            title="View Stats"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="btn btn-ghost btn-sm btn-square"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDeleteModalOpen(true);
                            }}
                            className="btn btn-ghost btn-sm btn-square text-error"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-base-300 flex items-center justify-center overflow-hidden">
                  {selectedProduct.images?.[0]?.url ? (
                    <img
                      src={selectedProduct.images[0].url}
                      alt={selectedProduct.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-base-content/50" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStockBadge(selectedProduct.stockStatus)}
                    <span className="text-sm text-base-content/60">SKU: {selectedProduct.sku}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-bordered mb-6">
              {["details", "pricing", "inventory", "images", "related"].map((tab) => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? "tab-active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "related" ? "Related Products" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto max-h-96">
              {/* Details Tab */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="font-semibold text-sm text-base-content/70 mb-2">Description</h4>
                    <p className="text-base-content">{selectedProduct.description}</p>
                  </div>

                  {/* Category & Vendor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                      <FolderTree className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Category</div>
                        <div className="font-medium">
                          {selectedProduct.category?.name || "—"}
                          {selectedProduct.subcategory && (
                            <span className="text-base-content/60"> / {selectedProduct.subcategory.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                      <Store className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Vendor</div>
                        <div className="font-medium">
                          {selectedProduct.vendor?.name || "Admin Product"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedProduct.tags?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-base-content/70 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.tags.map((tag, i) => (
                          <span key={i} className="badge badge-outline">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variants & Attributes */}
                  {(selectedProduct.colors?.length > 0 || selectedProduct.sizes?.length > 0 || selectedProduct.weight || selectedProduct.customAttributes?.length > 0) && (
                    <div>
                      <h4 className="font-semibold text-sm text-base-content/70 mb-2">Variants & Attributes</h4>
                      <div className="space-y-3 bg-base-200 p-4 rounded-lg">
                        {selectedProduct.colors?.length > 0 && (
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-medium w-24">Colors:</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedProduct.colors.map((c, i) => (
                                <span key={i} className="badge badge-sm">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedProduct.sizes?.length > 0 && (
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-medium w-24">Sizes:</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedProduct.sizes.map((s, i) => (
                                <span key={i} className="badge badge-sm">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedProduct.weight && (
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-medium w-24">Weight:</span>
                            <span className="text-sm">{selectedProduct.weight} g</span>
                          </div>
                        )}
                        {selectedProduct.customAttributes?.map((attr, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="text-sm font-medium w-24">{attr.title}:</span>
                            <span className="text-sm">{attr.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-title text-xs">Views</div>
                      <div className="stat-value text-xl">{selectedProduct.stats?.views || 0}</div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-title text-xs">Orders</div>
                      <div className="stat-value text-xl">{selectedProduct.stats?.totalOrders || 0}</div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-title text-xs">Revenue</div>
                      <div className="stat-value text-xl">
                        ${selectedProduct.stats?.totalRevenue?.toFixed(0) || 0}
                      </div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-title text-xs">Rating</div>
                      <div className="stat-value text-xl flex items-center gap-1">
                        <Star className="w-5 h-5 text-warning fill-warning" />
                        {selectedProduct.averageRating?.toFixed(1) || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === "pricing" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <DollarSign className="w-6 h-6 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Price</div>
                        <div className="font-bold text-lg">${selectedProduct.price?.toFixed(2)}</div>
                      </div>
                    </div>
                    {selectedProduct.compareAtPrice && (
                      <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                        <Tag className="w-6 h-6 text-primary" />
                        <div>
                          <div className="text-xs text-base-content/60">Compare At</div>
                          <div className="font-bold text-lg line-through text-base-content/50">
                            ${selectedProduct.compareAtPrice?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedProduct.costPrice && (
                      <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        <div>
                          <div className="text-xs text-base-content/60">Cost Price</div>
                          <div className="font-bold text-lg">${selectedProduct.costPrice?.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Discount */}
                  {selectedProduct.discount?.type !== "none" && (
                    <div className="p-4 bg-error/10 border border-error/30 rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2 text-error mb-2">
                        <Percent className="w-4 h-4" /> Active Discount
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-base-content/60">Type</div>
                          <div className="font-medium capitalize">{selectedProduct.discount.type}</div>
                        </div>
                        <div>
                          <div className="text-base-content/60">Value</div>
                          <div className="font-medium">
                            {selectedProduct.discount.type === "percentage"
                              ? `${selectedProduct.discount.value}%`
                              : `$${selectedProduct.discount.value}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-base-content/60">Start Date</div>
                          <div className="font-medium">
                            {selectedProduct.discount.startDate
                              ? formatDate(selectedProduct.discount.startDate)
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-base-content/60">End Date</div>
                          <div className="font-medium">
                            {selectedProduct.discount.endDate
                              ? formatDate(selectedProduct.discount.endDate)
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === "inventory" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <Boxes className="w-6 h-6 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Current Stock</div>
                        <div className="font-bold text-lg">{selectedProduct.stock}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-warning" />
                      <div>
                        <div className="text-xs text-base-content/60">Low Stock Alert</div>
                        <div className="font-bold text-lg">{selectedProduct.lowStockThreshold}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Total Sold</div>
                        <div className="font-bold text-lg">
                          {selectedProduct.stats?.totalQuantitySold || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="badge badge-lg gap-2">
                      {selectedProduct.trackInventory ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-error" />
                      )}
                      Track Inventory
                    </div>
                    <div className="badge badge-lg gap-2">
                      {selectedProduct.allowBackorders ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-error" />
                      )}
                      Allow Backorders
                    </div>
                  </div>
                </div>
              )}

              {/* Images Tab */}
              {activeTab === "images" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedProduct.images?.map((image, index) => (
                    <div
                      key={index}
                      className={`relative rounded-lg overflow-hidden border-2 ${image.isPrimary ? "border-primary" : "border-transparent"
                        }`}
                    >
                      <img
                        src={image.url}
                        alt={image.alt || selectedProduct.name}
                        className="w-full h-32 object-cover"
                      />
                      {image.isPrimary && (
                        <span className="absolute top-2 left-2 badge badge-primary badge-sm">Primary</span>
                      )}
                    </div>
                  ))}
                  {(!selectedProduct.images || selectedProduct.images.length === 0) && (
                    <div className="col-span-full text-center py-8 text-base-content/50">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No images uploaded</p>
                    </div>
                  )}
                </div>
              )}

              {/* Related Products Tab */}
              {activeTab === "related" && (
                <div className="space-y-4">
                  {selectedProduct.relatedProducts?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedProduct.relatedProducts.map((rp) => {
                        const rpImage = rp.images?.[0]?.url || rp.thumbnail;
                        return (
                          <div key={rp._id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg border border-base-300">
                            <div className="w-12 h-12 rounded bg-base-100 flex-shrink-0 overflow-hidden">
                              {rpImage ? (
                                <img src={rpImage} alt={rp.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 m-auto opacity-50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{rp.name}</div>
                              <div className="text-xs opacity-60">${rp.price?.toFixed(2)}</div>
                            </div>
                            {getStockBadge(rp.stockStatus)}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-base-content/50">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No related products linked</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-action">
              <button onClick={() => openEditModal(selectedProduct)} className="btn btn-primary gap-2">
                <Edit2 className="w-4 h-4" /> Edit Product
              </button>
              <button onClick={() => setIsViewModalOpen(false)} className="btn">
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsViewModalOpen(false)} />
        </div>
      )}

      {/* CREATE/EDIT DRAWER */}
      <div className="drawer drawer-end">
        <input
          id="product-form-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isFormModalOpen}
          onChange={(e) => setIsFormModalOpen(e.target.checked)}
        />

        {/* Drawer Content */}
        <div className="drawer-content" />

        {/* Drawer Side */}
        <div className="drawer-side z-50">
          <label htmlFor="product-form-drawer" className="drawer-overlay"></label>

          <div className="w-full sm:w-[600px] bg-base-100 h-screen flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex items-center justify-between z-10">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                {isEditing ? "Edit Product" : "Create Product"}
              </h3>
              <label
                htmlFor="product-form-drawer"
                className="btn btn-ghost btn-sm btn-circle cursor-pointer"
                onClick={() => resetForm()}
              >
                <X className="w-5 h-5" />
              </label>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-base-content/70 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control md:col-span-2">
                      <label className="label">
                        <span className="label-text">Product Name *</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input input-bordered"
                        required
                      />
                    </div>
                    <div className="form-control md:col-span-2">
                      <label className="label">
                        <span className="label-text">Description *</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="textarea textarea-bordered h-24"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Brand</span>
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Tags (comma separated)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="input input-bordered"
                        placeholder="electronics, gadgets, new"
                      />
                    </div>
                  </div>
                </div>

                {/* Variants & Attributes */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-base-content/70 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Variants & Attributes
                  </h4>

                  {/* Colors */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Colors</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.colors.map((color, idx) => (
                        <span key={idx} className="badge badge-lg gap-2">
                          {color}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setFormData({
                              ...formData,
                              colors: formData.colors.filter((_, i) => i !== idx)
                            })}
                          />
                        </span>
                      ))}
                    </div>
                    <div className="join">
                      <input
                        type="text"
                        placeholder="Add color (e.g. Red)"
                        className="input input-bordered join-item w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val && !formData.colors.includes(val)) {
                              setFormData({ ...formData, colors: [...formData.colors, val] });
                              e.target.value = '';
                            }
                          }
                        }}
                        id="color-input"
                      />
                      <button
                        type="button"
                        className="btn join-item"
                        onClick={() => {
                          const input = document.getElementById('color-input');
                          const val = input.value.trim();
                          if (val && !formData.colors.includes(val)) {
                            setFormData({ ...formData, colors: [...formData.colors, val] });
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Sizes</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.sizes.map((size, idx) => (
                        <span key={idx} className="badge badge-lg gap-2">
                          {size}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setFormData({
                              ...formData,
                              sizes: formData.sizes.filter((_, i) => i !== idx)
                            })}
                          />
                        </span>
                      ))}
                    </div>
                    <div className="join">
                      <input
                        type="text"
                        placeholder="Add size (e.g. XL)"
                        className="input input-bordered join-item w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val && !formData.sizes.includes(val)) {
                              setFormData({ ...formData, sizes: [...formData.sizes, val] });
                              e.target.value = '';
                            }
                          }
                        }}
                        id="size-input"
                      />
                      <button
                        type="button"
                        className="btn join-item"
                        onClick={() => {
                          const input = document.getElementById('size-input');
                          const val = input.value.trim();
                          if (val && !formData.sizes.includes(val)) {
                            setFormData({ ...formData, sizes: [...formData.sizes, val] });
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Weight (grams)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="input input-bordered"
                      placeholder="e.g. 500"
                    />
                  </div>

                  {/* Custom Attributes */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Custom Attributes</span>
                    </label>
                    <div className="space-y-2">
                      {formData.customAttributes.map((attr, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Title"
                            value={attr.title}
                            onChange={(e) => {
                              const newAttrs = [...formData.customAttributes];
                              newAttrs[idx].title = e.target.value;
                              setFormData({ ...formData, customAttributes: newAttrs });
                            }}
                            className="input input-bordered flex-1"
                          />
                          <input
                            type="text"
                            placeholder="Content"
                            value={attr.content}
                            onChange={(e) => {
                              const newAttrs = [...formData.customAttributes];
                              newAttrs[idx].content = e.target.value;
                              setFormData({ ...formData, customAttributes: newAttrs });
                            }}
                            className="input input-bordered flex-1"
                          />
                          <button
                            type="button"
                            className="btn btn-square btn-error btn-outline"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                customAttributes: formData.customAttributes.filter((_, i) => i !== idx)
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline btn-sm w-full"
                        onClick={() => setFormData({
                          ...formData,
                          customAttributes: [...formData.customAttributes, { title: "", content: "" }]
                        })}
                      >
                        <Plus className="w-4 h-4" /> Add Attribute
                      </button>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-base-content/70 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Images
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Existing Images */}
                    {existingImages.map((image, index) => (
                      <div key={`existing-${index}`} className={`relative group rounded-lg overflow-hidden border-2 ${image.isPrimary ? 'border-primary' : 'border-base-300'}`}>
                        <img
                          src={image.url}
                          alt=""
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPrimaryImage('existing', index)}
                            className="btn btn-sm btn-circle btn-ghost text-white"
                            title="Set as Primary"
                          >
                            {image.isPrimary ? <Star className="w-4 h-4 fill-primary text-primary" /> : <Star className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="btn btn-sm btn-circle btn-error"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {image.isPrimary && <span className="absolute top-1 left-1 badge badge-primary badge-xs">Primary</span>}
                      </div>
                    ))}

                    {/* New Images */}
                    {imagePreviews.map((url, index) => (
                      <div key={`new-${index}`} className={`relative group rounded-lg overflow-hidden border-2 ${index === newImagePrimaryIndex ? 'border-primary' : 'border-base-300'}`}>
                        <img src={url} alt="" className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPrimaryImage('new', index)}
                            className="btn btn-sm btn-circle btn-ghost text-white"
                            title="Set as Primary"
                          >
                            {index === newImagePrimaryIndex ? <Star className="w-4 h-4 fill-primary text-primary" /> : <Star className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="btn btn-sm btn-circle btn-error"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {index === newImagePrimaryIndex && <span className="absolute top-1 left-1 badge badge-primary badge-xs">Primary</span>}
                      </div>
                    ))}

                    {/* Upload Button */}
                    {existingImages.length + imagePreviews.length < 5 && (
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-primary hover:bg-base-200 transition-colors">
                        <Upload className="w-6 h-6 text-base-content/50" />
                        <span className="text-xs text-base-content/50 mt-1">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-base-content/70 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Pricing
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Price *</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input input-bordered"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Compare At Price</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.compareAtPrice}
                        onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Cost Price</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        className="input input-bordered"
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="p-4 bg-base-200 rounded-lg space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Discount Type</span>
                      </label>
                      <select
                        value={formData.discount.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount: { ...formData.discount, type: e.target.value },
                          })
                        }
                        className="select select-bordered"
                      >
                        <option value="none">No Discount</option>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    {formData.discount.type !== "none" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">
                              {formData.discount.type === "percentage" ? "Percentage (%)" : "Amount ($)"}
                            </span>
                          </label>
                          <input
                            type="number"
                            value={formData.discount.value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discount: { ...formData.discount, value: e.target.value },
                              })
                            }
                            className="input input-bordered"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Start Date</span>
                          </label>
                          <input
                            type="date"
                            value={formData.discount.startDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discount: { ...formData.discount, startDate: e.target.value },
                              })
                            }
                            className="input input-bordered"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">End Date</span>
                          </label>
                          <input
                            type="date"
                            value={formData.discount.endDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discount: { ...formData.discount, endDate: e.target.value },
                              })
                            }
                            className="input input-bordered"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Organization */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-base-content/70 flex items-center gap-2">
                    <FolderTree className="w-4 h-4" /> Organization
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Category *</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value, subcategory: "" })
                        }
                        className="select select-bordered"
                        required
                      >
                        <option value="">Select Category</option>
                        {rootCategories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Subcategory</span>
                      </label>
                      <select
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        className="select select-bordered"
                        disabled={!formData.category || subcategories.length === 0}
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Vendor</span>
                      </label>
                      <select
                        value={formData.vendor}
                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                        className="select select-bordered"
                      >
                        <option value="">Admin Product</option>
                        {vendors.map((v) => (
                          <option key={v._id} value={v._id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-base-content/70 flex items-center gap-2">
                    <Boxes className="w-4 h-4" /> Inventory
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Stock *</span>
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="input input-bordered"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Low Stock Threshold</span>
                      </label>
                      <input
                        type="number"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                        className="input input-bordered"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="checkbox"
                        checked={formData.trackInventory}
                        onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
                        className="checkbox checkbox-primary"
                      />
                      <span className="label-text">Track Inventory</span>
                    </label>
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="checkbox"
                        checked={formData.allowBackorders}
                        onChange={(e) => setFormData({ ...formData, allowBackorders: e.target.checked })}
                        className="checkbox checkbox-primary"
                      />
                      <span className="label-text">Allow Backorders</span>
                    </label>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-base-content/70">Status</h4>
                  <div className="flex flex-wrap gap-4">
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="checkbox checkbox-primary"
                      />
                      <span className="label-text">Published</span>
                    </label>
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="checkbox checkbox-warning"
                      />
                      <span className="label-text">Featured</span>
                    </label>
                  </div>
                </div>

                {/* Related Products */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-base-content/70 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Related Products
                  </h4>

                  {/* Dropdown for Shop Products */}
                  {formData.vendor ? (
                    <div className="space-y-3">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Select product to link</span>
                          {isLoadingShopProducts && <span className="loading loading-spinner loading-xs"></span>}
                        </label>
                        <select
                          className="select select-bordered w-full"
                          onChange={(e) => {
                            const productId = e.target.value;
                            if (!productId) return;
                            const product = shopProducts.find(p => p._id === productId);
                            if (product) addRelatedProduct(product);
                            e.target.value = ""; // Reset dropdown
                          }}
                          disabled={isLoadingShopProducts || shopProducts.length === 0}
                        >
                          <option value="">{shopProducts.length === 0 ? "No more products available" : "Choose a product..."}</option>
                          {shopProducts.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name} - ${product.price}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selected Related Products List */}
                      {formData.relatedProducts.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold opacity-50 uppercase tracking-wider">Linked Products</div>
                          <div className="grid grid-cols-1 gap-2">
                            {formData.relatedProducts.map((product) => {
                              const imgUrl = product.images?.[0]?.url || product.thumbnail;
                              return (
                                <div key={product._id || product} className="flex items-center gap-3 p-2 bg-base-200 rounded-lg border border-base-300">
                                  <div className="w-10 h-10 rounded bg-base-100 flex-shrink-0 overflow-hidden">
                                    {imgUrl ? (
                                      <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-5 h-5 m-auto opacity-50" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm line-clamp-1">{product.name}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeRelatedProduct(product._id || product)}
                                    className="btn btn-ghost btn-xs btn-square text-error"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-base-200 rounded-lg text-center text-sm text-base-content/50 italic border border-dashed border-base-300">
                      Select a vendor first to link related products
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pb-6">
                  {/* Placeholder to prevent footer overlap */}
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-6 flex gap-3 z-10">
              <label
                htmlFor="product-form-drawer"
                className="btn btn-outline flex-1 cursor-pointer"
                onClick={() => resetForm()}
              >
                Cancel
              </label>
              <button
                form="product-form-drawer"
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-primary flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STATS MODAL */}
      {isStatsModalOpen && selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              onClick={() => {
                setIsStatsModalOpen(false);
                setSelectedProduct(null);
              }}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5" />
              Statistics: {selectedProduct.name}
            </h3>

            {statsLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-title text-xs uppercase tracking-wider opacity-60">Views</div>
                    <div className="stat-value text-xl">{statsData?.product?.stats?.views || 0}</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-title text-xs uppercase tracking-wider opacity-60">Orders</div>
                    <div className="stat-value text-xl">{statsData?.product?.stats?.totalOrders || 0}</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-title text-xs uppercase tracking-wider opacity-60">Revenue</div>
                    <div className="stat-value text-xl">
                      ${statsData?.product?.stats?.totalRevenue?.toFixed(0) || 0}
                    </div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-title text-xs uppercase tracking-wider opacity-60">Conversion</div>
                    <div className="stat-value text-xl">
                      {statsData?.product?.stats?.conversionRate?.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>

                {/* Buyer Insights */}
                <div className="p-4 bg-base-200 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4" /> Buyer Insights
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-base-content/60">Total Buyers</div>
                      <div className="font-bold text-lg">{statsData?.product?.buyerInsights?.totalBuyers || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-base-content/60">Repeat Buyers</div>
                      <div className="font-bold text-lg">{statsData?.product?.buyerInsights?.repeatBuyers || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-base-content/60">Avg Qty/Order</div>
                      <div className="font-bold text-lg">
                        {statsData?.product?.buyerInsights?.averageOrderQuantity?.toFixed(1) || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Buyers */}
                {statsData?.recentBuyers?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Recent Buyers</h4>
                    <div className="space-y-2">
                      {statsData.recentBuyers.map((buyer, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="w-8 h-8 rounded-full bg-primary text-primary-content">
                                <span className="text-xs">{buyer.user?.name?.[0] || "?"}</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium">{buyer.user?.name || "Unknown"}</div>
                              <div className="text-xs text-base-content/60">
                                {formatDate(buyer.date)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{buyer.quantity}x</div>
                            <div className="text-xs text-success">
                              ${buyer.orderTotal?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="modal-action">
              <button
                onClick={() => {
                  setIsStatsModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="btn"
              >
                Close
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setIsStatsModalOpen(false);
              setSelectedProduct(null);
            }}
          />
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg flex items-center gap-2 text-error">
              <AlertCircle className="w-5 h-5" />
              Delete Product
            </h3>
            <p className="py-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedProduct.name}</span>? This action cannot be
              undone.
            </p>
            <div className="modal-action">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-error" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedProduct(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
