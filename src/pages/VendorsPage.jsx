import { useState, useEffect, useRef } from "react";
import { useQuery } from "../hooks/useQuery";
import { vendorApi, categoryApi } from "../lib/api";
import { formatDate } from "../lib/utils";
import {
  Eye,
  X, 
  Mail,
  MapPin,
  Phone,
  Globe,
  Search,
  Store,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  Trash2,
  Building,
  DollarSign,
  Star,
  Package,
  ShoppingCart,
  Calendar,
  User,
  FileText,
  Settings,
  AlertTriangle,
  Edit2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  CreditCard,
  Briefcase,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router";

function VendorsPage() {
  const [selectedShop, setSelectedShop] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'suspend'
  const [actionReason, setActionReason] = useState("");
  const [commissionRate, setCommissionRate] = useState(10);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [editForm, setEditForm] = useState({
    commissionRate: 10,
    adminNotes: "",
    isActive: true,
    businessType: "individual",
    categories: [],
  });

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    ownerEmail: "",
    ownerName: "",
    email: "",
    phone: "",
    address: { streetAddress: "", city: "", state: "", zipCode: "", country: "" },
    businessType: "individual",
    categories: [],
    commissionRate: 10,
    adminNotes: "",
    website: "",
    logoFile: null,
    bannerFile: null,
  });
  const [vendorOptions, setVendorOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const categoriesRef = useRef(null);
  const [categoriesSearch, setCategoriesSearch] = useState("");

  // Debounced search to avoid too many requests
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch vendor users for owner selection
  useEffect(() => {
    let mounted = true;
    const fetchVendors = async () => {
      try {
        const res = await (await import("../lib/api")).adminApi.getVendors();
        if (mounted && res?.vendors) setVendorOptions(res.vendors);
      } catch (err) {
        console.error("Failed to fetch vendor users:", err);
      }
    };
    fetchVendors();
    return () => (mounted = false);
  }, []);

  // Fetch categories for selection (flat list)
  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getAll({ flat: true, includeInactive: true });
        if (mounted && res?.categories) setCategoryOptions(res.categories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
    return () => (mounted = false);
  }, []);

  // close categories dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setCategoriesDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data, isLoading: loadingShops, refetch } = useQuery({
    queryKey: ["vendors", statusFilter, debouncedSearch],
    queryFn: () => vendorApi.getAll({ status: statusFilter, search: debouncedSearch }),
  });

  const shops = data?.shops || [];
  const counts = data?.counts || { all: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 };
  // Calculate total for 'all' tab as sum of all statuses
  const allCount =
    (counts.pending || 0) +
    (counts.approved || 0) +
    (counts.rejected || 0) +
    (counts.suspended || 0);

  // View shop details
  const handleView = async (shop) => {
    try {
      setIsLoading(true);
      const response = await vendorApi.getById(shop._id);
      setSelectedShop(response.shop);
      setActiveTab("details");
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching shop:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create shop (admin)
  const handleCreateShop = async () => {
    try {
      setIsLoading(true);

      // Basic validation
      if (!createForm.name || !createForm.description || !createForm.email || !createForm.phone) {
        alert("Please fill required fields: name, description, email, phone");
        return;
      }
      const addr = createForm.address || {};
      if (!addr.streetAddress || !addr.city || !addr.state || !addr.zipCode) {
        alert("Please provide a complete address (street, city, state, zip)");
        return;
      }

      const payload = {
        name: createForm.name,
        description: createForm.description,
        ownerId: createForm.ownerId || undefined,
        email: createForm.email,
        phone: createForm.phone,
        address: createForm.address,
        businessType: createForm.businessType,
        categories: Array.isArray(createForm.categories)
          ? createForm.categories
          : createForm.categories
          ? createForm.categories.split(",").map((c) => c.trim())
          : [],
        
        commissionRate: createForm.commissionRate,
        adminNotes: createForm.adminNotes,
        website: createForm.website,
      };

      // If files provided, send as FormData
      if (createForm.logoFile || createForm.bannerFile) {
        const fd = new FormData();
        Object.keys(payload).forEach((k) => {
          const val = payload[k];
          if (val !== undefined && val !== null) {
            if (typeof val === "object") fd.append(k, JSON.stringify(val));
            else fd.append(k, val);
          }
        });
        if (createForm.logoFile) fd.append("logo", createForm.logoFile);
        if (createForm.bannerFile) fd.append("banner", createForm.bannerFile);
        await vendorApi.create(fd);
      } else {
        await vendorApi.create(payload);
      }
      setIsCreateModalOpen(false);
      setCreateForm({
        name: "",
        description: "",
        ownerEmail: "",
        ownerName: "",
        email: "",
        phone: "",
        address: { streetAddress: "", city: "", state: "", zipCode: "", country: "" },
        businessType: "individual",
          categories: [],
        commissionRate: 10,
        adminNotes: "",
        website: "",
        logoFile: null,
        bannerFile: null,
      });
      refetch();
    } catch (error) {
      console.error("Error creating shop:", error);
      alert(error.response?.data?.error || "Failed to create shop");
    } finally {
      setIsLoading(false);
    }
  };

  // Open action modal
  const openActionModal = (shop, action) => {
    setSelectedShop(shop);
    setActionType(action);
    setActionReason("");
    setCommissionRate(shop.commissionRate || 10);
    setAdminNotes(shop.adminNotes || "");
    setIsActionModalOpen(true);
  };

  // Handle shop actions (approve/reject/suspend)
  const handleAction = async () => {
    try {
      setIsLoading(true);

      if (actionType === "approve") {
        await vendorApi.approve(selectedShop._id, { commissionRate, adminNotes });
      } else if (actionType === "reject") {
        if (!actionReason.trim()) {
          alert("Please provide a reason for rejection");
          return;
        }
        await vendorApi.reject(selectedShop._id, actionReason);
      } else if (actionType === "suspend") {
        if (!actionReason.trim()) {
          alert("Please provide a reason for suspension");
          return;
        }
        await vendorApi.suspend(selectedShop._id, actionReason);
      } else if (actionType === "reactivate") {
        await vendorApi.reactivate(selectedShop._id);
      }

      setIsActionModalOpen(false);
      refetch();
    } catch (error) {
      console.error(`Error ${actionType}ing shop:`, error);
      alert(error.response?.data?.error || `Failed to ${actionType} shop`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await vendorApi.delete(selectedShop._id);
      setIsDeleteModalOpen(false);
      setSelectedShop(null);
      refetch();
    } catch (error) {
      console.error("Error deleting shop:", error);
      alert(error.response?.data?.error || "Failed to delete shop");
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (shop) => {
    setSelectedShop(shop);
    setEditForm({
      commissionRate: shop.commissionRate || 10,
      adminNotes: shop.adminNotes || "",
      isActive: shop.isActive,
      businessType: shop.businessType || "individual",
      categories: shop.categories || [],
      logoFile: null,
      bannerFile: null,
    });
    setIsEditModalOpen(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);
      // If files present, build FormData
        if (editForm.logoFile || editForm.bannerFile) {
        const fd = new FormData();
        // append allowed fields
        if (editForm.commissionRate !== undefined) fd.append("commissionRate", editForm.commissionRate);
        if (editForm.adminNotes !== undefined) fd.append("adminNotes", editForm.adminNotes);
        if (editForm.isActive !== undefined) fd.append("isActive", editForm.isActive);
          if (editForm.businessType !== undefined) fd.append("businessType", editForm.businessType);
        if (editForm.categories !== undefined) fd.append("categories", JSON.stringify(editForm.categories));
        
        if (editForm.logoFile) fd.append("logo", editForm.logoFile);
        if (editForm.bannerFile) fd.append("banner", editForm.bannerFile);
        await vendorApi.update(selectedShop._id, fd);
      } else {
        await vendorApi.update(selectedShop._id, editForm);
      }
      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error updating shop:", error);
      alert(error.response?.data?.error || "Failed to update shop");
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-warning/20", text: "text-warning", icon: Clock, label: "Pending" },
      approved: { bg: "bg-success/20", text: "text-success", icon: CheckCircle, label: "Approved" },
      rejected: { bg: "bg-error/20", text: "text-error", icon: XCircle, label: "Rejected" },
      suspended: { bg: "bg-error/20", text: "text-error", icon: Ban, label: "Suspended" },
    };
    const badge = badges[status] || badges.pending;
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Shops
          </h1>
          <p className="text-base-content/70">
            Manage shop registrations and vendors
          </p>
        </div>

           <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search shops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>

                  <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary gap-2"
          >
            <UserPlus className="size-5" />
            <span className="hidden sm:inline">Add Shop</span>
          </button>

          </div>
      </div>

      {/* STATUS TABS */}
      <div className="tabs tabs-boxed bg-base-100 p-1">
        {[
          { key: "all", label: "All", count: allCount },
          { key: "pending", label: "Pending", count: counts.pending, color: "text-warning" },
          { key: "approved", label: "Approved", count: counts.approved, color: "text-success" },
          { key: "rejected", label: "Rejected", count: counts.rejected, color: "text-error" },
          { key: "suspended", label: "Suspended", count: counts.suspended, color: "text-error" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab ${statusFilter === tab.key ? "tab-active" : ""}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
            <span className={`ml-2 badge badge-sm ${tab.color || ""}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* SHOPS TABLE */}
      <div className="card bg-base-100  ">
        <div className="overflow-x-auto">
          {loadingShops ? (
            <div className="flex justify-center items-center py-20">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-20 text-base-content/50">
              <Store className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No shops found</p>
              <p className="text-sm">
                {statusFilter !== "all"
                  ? `No ${statusFilter} shops at the moment`
                  : "Vendors will appear here once they register"}
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Owner</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Commission</th>
                  <th>Registered</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop._id} className="hover cursor-pointer">
                    {/* Shop Info */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center">
                            {shop.logo ? (
                              <Link to={`/vendors/${shop._id}`}>
                                <img src={shop.logo} alt={shop.name} className="object-cover cursor-pointer" />
                              </Link>
                            ) : (
                              <Store className="w-6 h-6 text-base-content/50" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">{shop.name}</div>
                          <div className="text-sm text-base-content/60">{shop.businessType}</div>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar">
                          <div className="w-8 h-8 rounded-full bg-base-300">
                            {shop.owner?.imageUrl ? (
                              <img src={shop.owner.imageUrl} alt={shop.owner.name} />
                            ) : (
                              <User className="w-4 h-4 m-2 text-base-content/50" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{shop.owner?.name || "N/A"}</div>
                          <div className="text-xs text-base-content/60">{shop.owner?.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {shop.email}
                        </div>
                        <div className="flex items-center gap-1 text-base-content/60">
                          <Phone className="w-3 h-3" />
                          {shop.phone}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td>{getStatusBadge(shop.status)}</td>

                    {/* Commission */}
                    <td>
                      <span className="font-mono">{shop.commissionRate}%</span>
                    </td>

                    {/* Registered */}
                    <td className="text-sm text-base-content/70">
                      {formatDate(shop.createdAt)}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(shop)}
                          className="btn btn-ghost btn-sm btn-square"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {shop.status === "pending" && (
                          <>
                            <button
                              onClick={() => openActionModal(shop, "approve")}
                              className="btn btn-ghost btn-sm btn-square text-success"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openActionModal(shop, "reject")}
                              className="btn btn-ghost btn-sm btn-square text-error"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {shop.status === "approved" && (
                          <>
                            <button
                              onClick={() => openEditModal(shop)}
                              className="btn btn-ghost btn-sm btn-square"
                              title="Edit Settings"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openActionModal(shop, "suspend")}
                              className="btn btn-ghost btn-sm btn-square text-warning"
                              title="Suspend"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {shop.status === "suspended" && (
                          <button
                            onClick={() => openActionModal(shop, "reactivate")}
                            className="btn btn-ghost btn-sm btn-square text-success"
                            title="Reactivate"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedShop(shop);
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedShop && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-base-300 flex items-center justify-center overflow-hidden">
                  {selectedShop.logo ? (
                    <img src={selectedShop.logo} alt={selectedShop.name} className="object-cover w-full h-full" />
                  ) : (
                    <Store className="w-8 h-8 text-base-content/50" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedShop.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedShop.status)}
                    <span className="text-sm text-base-content/60">
                      {selectedShop.businessType}
                    </span>
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
              {["details", "owner", "business", "bank", "documents"].map((tab) => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? "tab-active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                    <p className="text-base-content">{selectedShop.description}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Email</div>
                        <div className="font-medium">{selectedShop.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Phone</div>
                        <div className="font-medium">{selectedShop.phone}</div>
                      </div>
                    </div>
                    {selectedShop.website && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-xs text-base-content/60">Website</div>
                          <a href={selectedShop.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                            {selectedShop.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {selectedShop.address && (
                    <div>
                      <h4 className="font-semibold text-sm text-base-content/70 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Address
                      </h4>
                      <div className="p-3 bg-base-200 rounded-lg">
                        <p>{selectedShop.address.streetAddress}</p>
                        <p>{selectedShop.address.city}, {selectedShop.address.state} {selectedShop.address.zipCode}</p>
                        <p>{selectedShop.address.country}</p>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {selectedShop.categories?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-base-content/70 mb-2">Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedShop.categories.map((cat, i) => (
                          <span key={i} className="badge badge-outline">{cat}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-title text-xs">Products</div>
                      <div className="stat-value text-xl">{selectedShop.stats?.totalProducts || 0}</div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-title text-xs">Orders</div>
                      <div className="stat-value text-xl">{selectedShop.stats?.totalOrders || 0}</div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-title text-xs">Revenue</div>
                      <div className="stat-value text-xl">${selectedShop.stats?.totalRevenue || 0}</div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-title text-xs">Rating</div>
                      <div className="stat-value text-xl flex items-center gap-1">
                        <Star className="w-5 h-5 text-warning fill-warning" />
                        {selectedShop.stats?.averageRating?.toFixed(1) || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  {selectedShop.socialMedia && Object.values(selectedShop.socialMedia).some(v => v) && (
                    <div>
                      <h4 className="font-semibold text-sm text-base-content/70 mb-2">Social Media</h4>
                      <div className="flex gap-3">
                        {selectedShop.socialMedia.facebook && (
                          <a href={selectedShop.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle">
                            <Facebook className="w-5 h-5" />
                          </a>
                        )}
                        {selectedShop.socialMedia.instagram && (
                          <a href={selectedShop.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle">
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {selectedShop.socialMedia.twitter && (
                          <a href={selectedShop.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle">
                            <Twitter className="w-5 h-5" />
                          </a>
                        )}
                        {selectedShop.socialMedia.linkedin && (
                          <a href={selectedShop.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle">
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Owner Tab */}
              {activeTab === "owner" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-full bg-base-300">
                        {selectedShop.owner?.imageUrl ? (
                          <img src={selectedShop.owner.imageUrl} alt={selectedShop.owner.name} />
                        ) : (
                          <User className="w-8 h-8 m-4 text-base-content/50" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{selectedShop.owner?.name || "N/A"}</div>
                      <div className="text-base-content/60">{selectedShop.owner?.email}</div>
                      {selectedShop.owner?.phone && (
                        <div className="text-base-content/60 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {selectedShop.owner.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-base-200 rounded-lg">
                      <div className="text-xs text-base-content/60">Member Since</div>
                      <div className="font-medium">{formatDate(selectedShop.owner?.createdAt)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Tab */}
              {activeTab === "business" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <Briefcase className="w-6 h-6 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Business Type</div>
                        <div className="font-medium capitalize">{selectedShop.businessType}</div>
                      </div>
                    </div>
                    {selectedShop.businessRegistrationNumber && (
                      <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                        <FileText className="w-6 h-6 text-primary" />
                        <div>
                          <div className="text-xs text-base-content/60">Registration Number</div>
                          <div className="font-medium font-mono">{selectedShop.businessRegistrationNumber}</div>
                        </div>
                      </div>
                    )}
                    {selectedShop.taxId && (
                      <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                        <Building className="w-6 h-6 text-primary" />
                        <div>
                          <div className="text-xs text-base-content/60">Tax ID</div>
                          <div className="font-medium font-mono">{selectedShop.taxId}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <DollarSign className="w-6 h-6 text-primary" />
                      <div>
                        <div className="text-xs text-base-content/60">Commission Rate</div>
                        <div className="font-medium">{selectedShop.commissionRate}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  {selectedShop.businessHours?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-base-content/70 mb-3">Business Hours</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedShop.businessHours.map((hour, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-base-200 rounded-lg">
                            <span className="capitalize font-medium">{hour.day}</span>
                            <span className={hour.isClosed ? "text-error" : "text-success"}>
                              {hour.isClosed ? "Closed" : `${hour.open} - ${hour.close}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  {selectedShop.statusUpdatedAt && (
                    <div className="p-4 bg-base-200 rounded-lg">
                      <h4 className="font-semibold text-sm text-base-content/70 mb-2">Status Update</h4>
                      <div className="text-sm">
                        <p><strong>Status:</strong> {selectedShop.status}</p>
                        <p><strong>Reason:</strong> {selectedShop.statusReason || "N/A"}</p>
                        <p><strong>Updated:</strong> {formatDate(selectedShop.statusUpdatedAt)}</p>
                        {selectedShop.statusUpdatedBy && (
                          <p><strong>By:</strong> {selectedShop.statusUpdatedBy.name || selectedShop.statusUpdatedBy.email}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {selectedShop.adminNotes && (
                    <div>
                      <h4 className="font-semibold text-sm text-base-content/70 mb-2">Admin Notes</h4>
                      <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <p className="text-sm">{selectedShop.adminNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bank Tab */}
              {activeTab === "bank" && (
                <div className="space-y-4">
                  {selectedShop.bankDetails && Object.values(selectedShop.bankDetails).some(v => v) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedShop.bankDetails.accountHolderName && (
                        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                          <User className="w-6 h-6 text-primary" />
                          <div>
                            <div className="text-xs text-base-content/60">Account Holder</div>
                            <div className="font-medium">{selectedShop.bankDetails.accountHolderName}</div>
                          </div>
                        </div>
                      )}
                      {selectedShop.bankDetails.bankName && (
                        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                          <Building className="w-6 h-6 text-primary" />
                          <div>
                            <div className="text-xs text-base-content/60">Bank Name</div>
                            <div className="font-medium">{selectedShop.bankDetails.bankName}</div>
                          </div>
                        </div>
                      )}
                      {selectedShop.bankDetails.accountNumber && (
                        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                          <CreditCard className="w-6 h-6 text-primary" />
                          <div>
                            <div className="text-xs text-base-content/60">Account Number</div>
                            <div className="font-medium font-mono">****{selectedShop.bankDetails.accountNumber.slice(-4)}</div>
                          </div>
                        </div>
                      )}
                      {selectedShop.bankDetails.routingNumber && (
                        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                          <FileText className="w-6 h-6 text-primary" />
                          <div>
                            <div className="text-xs text-base-content/60">Routing Number</div>
                            <div className="font-medium font-mono">{selectedShop.bankDetails.routingNumber}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-base-content/50">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No bank details provided</p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  {selectedShop.documents?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedShop.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-primary" />
                            <div>
                              <div className="font-medium capitalize">{doc.type?.replace(/_/g, " ")}</div>
                              <div className="text-xs text-base-content/60">
                                Uploaded: {formatDate(doc.uploadedAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.verified ? (
                              <span className="badge badge-success badge-sm">Verified</span>
                            ) : (
                              <span className="badge badge-warning badge-sm">Pending</span>
                            )}
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-base-content/50">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No documents uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="modal-action">
              {selectedShop.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openActionModal(selectedShop, "approve");
                    }}
                    className="btn btn-success"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openActionModal(selectedShop, "reject");
                    }}
                    className="btn btn-error"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              <button onClick={() => setIsViewModalOpen(false)} className="btn">
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsViewModalOpen(false)}></div>
        </div>
      )}

      {/* ACTION MODAL (Approve/Reject/Suspend/Reactivate) */}
      {isActionModalOpen && selectedShop && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg capitalize flex items-center gap-2">
              {actionType === "approve" && <CheckCircle className="w-5 h-5 text-success" />}
              {actionType === "reject" && <XCircle className="w-5 h-5 text-error" />}
              {actionType === "suspend" && <Ban className="w-5 h-5 text-warning" />}
              {actionType === "reactivate" && <RefreshCw className="w-5 h-5 text-success" />}
              {actionType} Shop
            </h3>

            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <Store className="w-8 h-8 text-primary" />
                <div>
                  <div className="font-semibold">{selectedShop.name}</div>
                  <div className="text-sm text-base-content/60">{selectedShop.email}</div>
                </div>
              </div>

              {actionType === "approve" && (
                <>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Commission Rate (%)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                      className="input input-bordered"
                    />
                    <label className="label">
                      <span className="label-text-alt">Platform fee percentage on each sale</span>
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Admin Notes (Optional)</span>
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="textarea textarea-bordered"
                      rows={3}
                      placeholder="Internal notes about this vendor..."
                    />
                  </div>
                </>
              )}

              {(actionType === "reject" || actionType === "suspend") && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Reason *</span>
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="textarea textarea-bordered"
                    rows={3}
                    placeholder={`Why are you ${actionType}ing this shop?`}
                    required
                  />
                </div>
              )}

              {actionType === "reactivate" && (
                <div className="alert alert-primary">
                  <AlertTriangle className="w-5 h-5" />
                  <span>This will reactivate the shop and allow the vendor to resume operations.</span>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button onClick={() => setIsActionModalOpen(false)} className="btn">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isLoading}
                className={`btn ${
                  actionType === "approve" || actionType === "reactivate"
                    ? "btn-success"
                    : "btn-error"
                }`}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    {actionType === "approve" && <CheckCircle className="w-4 h-4" />}
                    {actionType === "reject" && <XCircle className="w-4 h-4" />}
                    {actionType === "suspend" && <Ban className="w-4 h-4" />}
                    {actionType === "reactivate" && <RefreshCw className="w-4 h-4" />}
                    {actionType?.charAt(0).toUpperCase() + actionType?.slice(1)}
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsActionModalOpen(false)}></div>
        </div>
      )}

      {/* EDIT MODAL */}
      {/* CREATE DRAWER */}
      <div className="drawer drawer-end">
        <input 
          id="create-shop-drawer" 
          type="checkbox" 
          className="drawer-toggle" 
          checked={isCreateModalOpen}
          onChange={(e) => setIsCreateModalOpen(e.target.checked)}
        />
        
        {/* Drawer Content */}
        <div className="drawer-content" />
        
        {/* Drawer Side */}
        <div className="drawer-side z-50">
          <label htmlFor="create-shop-drawer" className="drawer-overlay"></label>
          
          <div className="w-full sm:w-[500px] bg-base-100 h-screen flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex items-center justify-between z-10">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Create New Shop
              </h3>
              <label 
                htmlFor="create-shop-drawer"
                className="btn btn-ghost btn-sm btn-circle cursor-pointer"
              >
                <X className="w-5 h-5" />
              </label>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Shop Name *</span></label>
                  <input 
                    value={createForm.name} 
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} 
                    className="input input-bordered" 
                    placeholder="Enter shop name"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Assign Owner</span></label>
                  <select
                    value={createForm.ownerId || ""}
                    onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value || undefined })}
                    className="select select-bordered"
                  >
                    <option value="">Assign to admin (default)</option>
                    {vendorOptions.map((v) => (
                      <option key={v._id} value={v._id}>{v.name} — {v.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Description *</span></label>
                <textarea 
                  value={createForm.description} 
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} 
                  className="textarea textarea-bordered" 
                  rows={3}
                  placeholder="Shop description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Contact Email *</span></label>
                  <input 
                    value={createForm.email} 
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} 
                    className="input input-bordered"
                    placeholder="shop@example.com"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Phone *</span></label>
                  <input 
                    value={createForm.phone} 
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} 
                    className="input input-bordered"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="divider my-2">Address Information</div>

              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Street Address *</span></label>
                <input 
                  value={createForm.address.streetAddress} 
                  onChange={(e) => setCreateForm({ ...createForm, address: { ...createForm.address, streetAddress: e.target.value } })} 
                  className="input input-bordered"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">City *</span></label>
                  <input 
                    value={createForm.address.city} 
                    onChange={(e) => setCreateForm({ ...createForm, address: { ...createForm.address, city: e.target.value } })} 
                    className="input input-bordered"
                    placeholder="New York"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">State *</span></label>
                  <input 
                    value={createForm.address.state} 
                    onChange={(e) => setCreateForm({ ...createForm, address: { ...createForm.address, state: e.target.value } })} 
                    className="input input-bordered"
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">ZIP Code *</span></label>
                  <input 
                    value={createForm.address.zipCode} 
                    onChange={(e) => setCreateForm({ ...createForm, address: { ...createForm.address, zipCode: e.target.value } })} 
                    className="input input-bordered"
                    placeholder="10001"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Country</span></label>
                  <input 
                    value={createForm.address.country} 
                    onChange={(e) => setCreateForm({ ...createForm, address: { ...createForm.address, country: e.target.value } })} 
                    className="input input-bordered"
                    placeholder="USA"
                  />
                </div>
              </div>

              <div className="divider my-2">Media</div>

              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Logo (optional)</span></label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="file-input file-input-bordered" 
                    onChange={(e) => setCreateForm({ ...createForm, logoFile: e.target.files[0] })} 
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Banner (optional)</span></label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="file-input file-input-bordered" 
                    onChange={(e) => setCreateForm({ ...createForm, bannerFile: e.target.files[0] })} 
                  />
                </div>
              </div>

              <div className="divider my-2">Business Details</div>
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Business Type</span></label>
                <select
                  value={createForm.businessType}
                  onChange={(e) => setCreateForm({ ...createForm, businessType: e.target.value })}
                  className="select select-bordered"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>

              <div className="form-control">
                
                <label className="label"><span className="label-text font-semibold">Categories (multiple)</span></label>
                <div className="relative" ref={categoriesRef}>
                  <button
                    type="button"
                    onClick={() => setCategoriesDropdownOpen((s) => !s)}
                    className="input input-bordered w-full text-left flex items-center justify-between"
                  >
                    <span className="text-sm text-base-content/80">
                      {createForm.categories && createForm.categories.length > 0
                        ? `${createForm.categories.length} selected`
                        : "Select categories..."}
                    </span>
                    <span className="text-base-content/50">▾</span>
                  </button>

                  {categoriesDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded shadow-md max-h-56 overflow-auto">
                      <div className="p-2 border-b border-base-300">
                        <input
                          type="search"
                          value={categoriesSearch}
                          onChange={(e) => setCategoriesSearch(e.target.value)}
                          placeholder="Search categories..."
                          className="input input-sm input-bordered w-full"
                        />
                      </div>
                      <ul>
                        {categoryOptions
                          .filter((c) => c.name.toLowerCase().includes(categoriesSearch.toLowerCase()))
                          .map((c) => (
                            <li key={c._id} className="px-3 py-2 hover:bg-base-200 flex items-center gap-2">
                              <input
                                id={`cat-${c._id}`}
                                type="checkbox"
                                checked={createForm.categories.includes(c._id)}
                                onChange={() => {
                                  const arr = Array.isArray(createForm.categories) ? [...createForm.categories] : [];
                                  if (arr.includes(c._id)) {
                                    setCreateForm({ ...createForm, categories: arr.filter((x) => x !== c._id) });
                                  } else {
                                    arr.push(c._id);
                                    setCreateForm({ ...createForm, categories: arr });
                                  }
                                }}
                              />
                              <label htmlFor={`cat-${c._id}`} className="flex-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>{c.name}</label>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {/* Chips below the dropdown */}
                  {createForm.categories && createForm.categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {createForm.categories.map((id) => {
                        const cat = categoryOptions.find((c) => c._id === id);
                        return (
                          <span key={id} className="badge badge-sm badge-outline flex items-center gap-2">
                            {cat?.name || id}
                            <button
                              type="button"
                              onClick={() => setCreateForm({ ...createForm, categories: createForm.categories.filter((c) => c !== id) })}
                              className="btn btn-ghost btn-xs btn-square"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Commission Rate (%)</span></label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={createForm.commissionRate} 
                    onChange={(e) => setCreateForm({ ...createForm, commissionRate: parseFloat(e.target.value) })} 
                    className="input input-bordered" 
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Website</span></label>
                  <input 
                    value={createForm.website} 
                    onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })} 
                    className="input input-bordered"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Admin Notes</span></label>
                <textarea 
                  value={createForm.adminNotes} 
                  onChange={(e) => setCreateForm({ ...createForm, adminNotes: e.target.value })} 
                  className="textarea textarea-bordered" 
                  rows={3}
                  placeholder="Internal notes..."
                />
              </div>

              <div className="pb-6"></div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-6 flex gap-3 z-10">
              <label 
                htmlFor="create-shop-drawer"
                className="btn btn-outline flex-1 cursor-pointer"
              >
                Cancel
              </label>
              <button 
                onClick={handleCreateShop} 
                disabled={isLoading} 
                className="btn btn-primary flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  "Create Shop"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {isEditModalOpen && selectedShop && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Shop Settings
            </h3>

            <div className="py-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Commission Rate (%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.commissionRate}
                  onChange={(e) => setEditForm({ ...editForm, commissionRate: parseFloat(e.target.value) })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Business Type</span></label>
                <select
                  value={editForm.businessType}
                  onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
                  className="select select-bordered"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Logo (optional)</span></label>
                <input type="file" accept="image/*" className="file-input file-input-bordered" onChange={(e) => setEditForm({ ...editForm, logoFile: e.target.files[0] })} />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Banner (optional)</span></label>
                <input type="file" accept="image/*" className="file-input file-input-bordered" onChange={(e) => setEditForm({ ...editForm, bannerFile: e.target.files[0] })} />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Shop Active</span>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="toggle toggle-success"
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Admin Notes</span>
                </label>
                <textarea
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                  className="textarea textarea-bordered"
                  rows={3}
                  placeholder="Internal notes..."
                />
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setIsEditModalOpen(false)} className="btn">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={isLoading} className="btn btn-primary">
                {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Save Changes"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}></div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && selectedShop && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Shop
            </h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{selectedShop.name}</strong>? This action cannot be undone.
              The owner's account will be reverted to a regular user.
            </p>
            <div className="modal-action">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isLoading} className="btn btn-error">
                {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Delete Shop"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
}

export default VendorsPage;
