import { useState } from "react";
import { useQuery } from "../hooks/useQuery";
import { customerApi } from "../lib/api";
import { formatDate } from "../lib/utils";
import {
  Eye,
  Edit2,
  Trash2,
  X,
  Mail,
  MapPin,
  Heart,
  ShoppingBag,
  Calendar,
  Shield,
  User,
  Search,
  Plus,
  Image,
  Phone,
  UserPlus,
  Lock,
  Ban,
  RefreshCw,
} from "lucide-react";

function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    isEmailVerified: false,
    imageFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'suspend' | 'reactivate'
  const [actionReason, setActionReason] = useState("");
  const [customerForAction, setCustomerForAction] = useState(null);

  const { data, isLoading: loadingCustomers, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: customerApi.getAll,
  });

  const customers = data?.customers || [];

  // Filter customers based on search
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // View customer details
  const handleView = async (customer) => {
    try {
      setIsLoading(true);
      const response = await customerApi.getById(customer._id);
      setSelectedCustomer({ ...response.customer, orders: response.orders });
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = (customer) => {
    setEditForm({
      id: customer._id,
      name: customer.name || "",
      email: customer.email || "",
      role: customer.role || "user",
      isEmailVerified: customer.isEmailVerified || false,
      imageUrl: customer.imageUrl || "",
      imageFile: null,
      addresses: customer.addresses || [],
    });
    setIsEditModalOpen(true);
  };

  // Add new address
  const addAddress = () => {
    setEditForm({
      ...editForm,
      addresses: [
        ...editForm.addresses,
        {
          label: "Home",
          fullName: "",
          streetAddress: "",
          city: "",
          state: "",
          zipCode: "",
          phoneNumber: "",
          isDefault: editForm.addresses.length === 0,
        },
      ],
    });
  };

  // Update address field
  const updateAddress = (index, field, value) => {
    const newAddresses = [...editForm.addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    
    // If setting as default, unset others
    if (field === "isDefault" && value) {
      newAddresses.forEach((addr, i) => {
        if (i !== index) addr.isDefault = false;
      });
    }
    
    setEditForm({ ...editForm, addresses: newAddresses });
  };

  // Remove address
  const removeAddress = (index) => {
    const newAddresses = editForm.addresses.filter((_, i) => i !== index);
    setEditForm({ ...editForm, addresses: newAddresses });
  };

  // Save customer edits
  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);
      // Build form data if there's a file
      let payload;
      if (editForm.imageFile) {
        const fd = new FormData();
        if (editForm.name !== undefined) fd.append("name", editForm.name);
        if (editForm.email !== undefined) fd.append("email", editForm.email);
        if (editForm.role !== undefined) fd.append("role", editForm.role);
        fd.append("isEmailVerified", editForm.isEmailVerified === true);
        if (editForm.addresses !== undefined) fd.append("addresses", JSON.stringify(editForm.addresses));
        fd.append("image", editForm.imageFile);
        payload = { id: editForm.id, formData: fd };
      } else {
        payload = { id: editForm.id, formData: {
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          isEmailVerified: editForm.isEmailVerified,
          addresses: editForm.addresses,
        }};
      }

      await customerApi.update(payload);
      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error updating customer:", error);
      alert(error.response?.data?.error || "Failed to update customer");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete customer
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await customerApi.delete(customerToDelete._id);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert(error.response?.data?.error || "Failed to delete customer");
    } finally {
      setIsLoading(false);
    }
  };

  // Open suspend/reactivate modal
  const openActionModal = (customer, type) => {
    setCustomerForAction(customer);
    setActionType(type);
    setActionReason("");
    setIsActionModalOpen(true);
  };

  // Handle suspend/reactivate action
  const handleAction = async () => {
    try {
      setIsLoading(true);
      if (!customerForAction) return;
      if (actionType === "suspend") {
        await customerApi.suspend(customerForAction._id, actionReason);
      } else if (actionType === "reactivate") {
        await customerApi.reactivate(customerForAction._id);
      }
      setIsActionModalOpen(false);
      setCustomerForAction(null);
      refetch();
    } catch (error) {
      console.error(`Error ${actionType}ing customer:`, error);
      alert(error.response?.data?.error || `Failed to ${actionType} customer`);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new customer
  const handleCreate = async () => {
    try {
      if (!createForm.name || !createForm.email || !createForm.password) {
        alert("Please fill in all required fields");
        return;
      }
      if (createForm.password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }
      setIsLoading(true);
      // build form data
      const fd = new FormData();
      fd.append("name", createForm.name);
      fd.append("email", createForm.email);
      fd.append("password", createForm.password);
      fd.append("role", createForm.role);
      fd.append("isEmailVerified", createForm.isEmailVerified === true);
      if (createForm.imageFile) fd.append("image", createForm.imageFile);

      await customerApi.create(fd);
      setIsCreateModalOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        isEmailVerified: false,
        imageFile: null,
      });
      refetch();
    } catch (error) {
      console.error("Error creating customer:", error);
      alert(error.response?.data?.error || "Failed to create customer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-base-content/70">
            {filteredCustomers.length} {filteredCustomers.length === 1 ? "customer" : "customers"} found
          </p>
        </div>

        {/* Search and Create Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-base-content/50" />
            <input
              type="text"
              placeholder="Search customers..."
              className="input input-bordered pl-10 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary gap-2"
          >
            <UserPlus className="size-5" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="card bg-base-100  ">
        <div className="card-body p-0">
          {loadingCustomers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <User className="size-16 mx-auto mb-4 opacity-30" />
              <p className="text-xl font-semibold mb-2">No customers found</p>
              <p className="text-sm">
                {searchQuery ? "Try a different search term" : "Customers will appear here once they sign up"}
              </p>
            </div>
          ) : (
               <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Addresses</th>
                    <th>Wishlist</th>
                    <th>Joined</th>
                    <th className="text-center" >Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id}  className="hover cursor-pointer">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full bg-primary/10">
                              {customer.imageUrl ? (
                                <img
                                  src={customer.imageUrl}
                                  alt={customer.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                  <User className="size-5 text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="font-semibold">{customer.name || "—"}</div>
                        </div>
                      </td>

                      <td className="text-sm">{customer.email}</td>

                      <td>
                        <span
                          className={`badge badge-sm ${
                            customer.role === "admin" ? "badge-warning" : "badge-ghost"
                          }`}
                        >
                          {customer.role}
                        </span>
                        {customer.isSuspended && (
                          <span className="ml-2 badge badge-sm badge-error">Suspended</span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge badge-sm ${
                            customer.isEmailVerified ? "badge-success" : "badge-warning"
                          }`}
                        >
                          {customer.isEmailVerified ? "Verified" : "Pending"}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {customer.addresses?.length || 0}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {customer.wishlist?.length || 0}
                        </span>
                      </td>

                      <td className="text-sm opacity-70">{formatDate(customer.createdAt)}</td>

                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(customer)}
                            className="btn btn-ghost btn-sm btn-square"
                            title="View details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="btn btn-ghost btn-sm btn-square"
                            title="Edit"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          {customer.isSuspended ? (
                            <button
                              onClick={() => openActionModal(customer, "reactivate")}
                              className="btn btn-ghost btn-sm btn-square text-success"
                              title="Reactivate"
                            >
                              <RefreshCw className="size-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => openActionModal(customer, "suspend")}
                              className="btn btn-ghost btn-sm btn-square text-warning"
                              title="Suspend"
                            >
                              <Ban className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setCustomerToDelete(customer);
                              setIsDeleteModalOpen(true);
                            }}
                            className="btn btn-ghost btn-sm btn-square text-error"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
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
      {isViewModalOpen && selectedCustomer && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="size-4" />
            </button>

            <h3 className="font-bold text-lg mb-6">Customer Details</h3>

            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
                <div className="avatar">
                  <div className="w-16 h-16 rounded-full bg-primary/10">
                    {selectedCustomer.imageUrl ? (
                      <img
                        src={selectedCustomer.imageUrl}
                        alt={selectedCustomer.name}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <User className="size-8 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold">{selectedCustomer.name || "No Name"}</h4>
                  <p className="text-base-content/70 flex items-center gap-1">
                    <Mail className="size-4" /> {selectedCustomer.email}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <span className={`badge ${selectedCustomer.role === "admin" ? "badge-primary" : "badge-ghost"}`}>
                    {selectedCustomer.role}
                  </span>
                  <span className={`badge ${selectedCustomer.isEmailVerified ? "badge-success" : "badge-warning"}`}>
                    {selectedCustomer.isEmailVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-figure text-primary">
                    <MapPin className="size-6" />
                  </div>
                  <div className="stat-title text-xs">Addresses</div>
                  <div className="stat-value text-2xl">{selectedCustomer.addresses?.length || 0}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-figure text-error">
                    <Heart className="size-6" />
                  </div>
                  <div className="stat-title text-xs">Wishlist</div>
                  <div className="stat-value text-2xl">{selectedCustomer.wishlist?.length || 0}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-figure text-success">
                    <ShoppingBag className="size-6" />
                  </div>
                  <div className="stat-title text-xs">Orders</div>
                  <div className="stat-value text-2xl">{selectedCustomer.orders?.length || 0}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-figure text-primary">
                    <Calendar className="size-6" />
                  </div>
                  <div className="stat-title text-xs">Joined</div>
                  <div className="stat-value text-sm">{formatDate(selectedCustomer.createdAt)}</div>
                </div>
              </div>

              {/* Addresses */}
              {selectedCustomer.addresses?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="size-5" /> Addresses
                  </h4>
                  <div className="grid gap-3">
                    {selectedCustomer.addresses.map((address, index) => (
                      <div key={index} className="p-3 bg-base-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{address.label}</span>
                          {address.isDefault && (
                            <span className="badge badge-primary badge-sm">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-base-content/70">
                          {address.fullName}<br />
                          {address.streetAddress}<br />
                          {address.city}, {address.state} {address.zipCode}<br />
                          {address.phoneNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wishlist */}
              {selectedCustomer.wishlist?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Heart className="size-5" /> Wishlist Items
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.wishlist.map((item) => (
                      <div key={item._id} className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                        {item.images?.[0] && (
                          <img src={item.images[0]} alt={item.name} className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-base-content/70">${item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {selectedCustomer.orders?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingBag className="size-5" /> Recent Orders
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.orders.slice(0, 5).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Order #{order._id.slice(-8)}</p>
                          <p className="text-xs text-base-content/70">
                            {order.orderItems?.length} items • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.totalPrice?.toFixed(2)}</p>
                          <span className={`badge badge-sm ${
                            order.status === "delivered" ? "badge-success" :
                            order.status === "shipped" ? "badge-primary" : "badge-warning"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsViewModalOpen(false)} />
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="size-4" />
            </button>

            <h3 className="font-bold text-lg mb-6">Edit Customer Profile</h3>

            <div className="space-y-6">
              {/* Profile Image Preview */}
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-20 h-20 rounded-full bg-base-200">
                    {editForm.imageFile ? (
                      <img src={URL.createObjectURL(editForm.imageFile)} alt="Profile" className="rounded-full object-cover" />
                    ) : editForm.imageUrl ? (
                      <img src={editForm.imageUrl} alt="Profile" className="rounded-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <User className="size-8 text-base-content/30" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="label">
                    <span className="label-text">Profile Image URL</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered w-full file-input-sm"
                    onChange={(e) => setEditForm({ ...editForm, imageFile: e.target.files[0] })}
                  />
                </div>
              </div>

              <div className="divider">Basic Information</div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={editForm.isEmailVerified}
                      onChange={(e) => setEditForm({ ...editForm, isEmailVerified: e.target.checked })}
                    />
                    <span className="label-text">Email Verified</span>
                  </label>
                </div>
              </div>

              <div className="divider">
                <MapPin className="size-4" /> Addresses
              </div>

              {/* Addresses */}
              <div className="space-y-4">
                {editForm.addresses?.length === 0 ? (
                  <div className="text-center py-6 text-base-content/50 bg-base-200 rounded-lg">
                    <MapPin className="size-8 mx-auto mb-2 opacity-50" />
                    <p>No addresses added</p>
                  </div>
                ) : (
                  editForm.addresses?.map((address, index) => (
                    <div key={index} className="p-4 bg-base-200 rounded-lg relative">
                      <button
                        onClick={() => removeAddress(index)}
                        className="btn btn-ghost btn-xs btn-circle absolute right-2 top-2"
                        title="Remove address"
                      >
                        <X className="size-3" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="form-control">
                          <label className="label py-1">
                            <span className="label-text text-xs">Label</span>
                          </label>
                          <select
                            className="select select-bordered select-sm"
                            value={address.label}
                            onChange={(e) => updateAddress(index, "label", e.target.value)}
                          >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="form-control">
                          <label className="label py-1">
                            <span className="label-text text-xs">Full Name</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={address.fullName}
                            onChange={(e) => updateAddress(index, "fullName", e.target.value)}
                          />
                        </div>

                        <div className="form-control md:col-span-2">
                          <label className="label py-1">
                            <span className="label-text text-xs">Street Address</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={address.streetAddress}
                            onChange={(e) => updateAddress(index, "streetAddress", e.target.value)}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label py-1">
                            <span className="label-text text-xs">City</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={address.city}
                            onChange={(e) => updateAddress(index, "city", e.target.value)}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label py-1">
                            <span className="label-text text-xs">State</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={address.state}
                            onChange={(e) => updateAddress(index, "state", e.target.value)}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label py-1">
                            <span className="label-text text-xs">Zip Code</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={address.zipCode}
                            onChange={(e) => updateAddress(index, "zipCode", e.target.value)}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label py-1">
                            <span className="label-text text-xs">Phone Number</span>
                          </label>
                          <input
                            type="tel"
                            className="input input-bordered input-sm"
                            value={address.phoneNumber}
                            onChange={(e) => updateAddress(index, "phoneNumber", e.target.value)}
                          />
                        </div>

                        <div className="form-control md:col-span-2">
                          <label className="label cursor-pointer justify-start gap-2 py-1">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm checkbox-primary"
                              checked={address.isDefault}
                              onChange={(e) => updateAddress(index, "isDefault", e.target.checked)}
                            />
                            <span className="label-text text-xs">Set as default address</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <button onClick={addAddress} className="btn btn-outline btn-sm w-full gap-2">
                  <Plus className="size-4" /> Add Address
                </button>
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setIsEditModalOpen(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="btn btn-primary" disabled={isLoading}>
                {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Save Changes"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)} />
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Customer</h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{customerToDelete.name || customerToDelete.email}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCustomerToDelete(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-error" disabled={isLoading}>
                {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Delete"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)} />
        </div>
      )}

      {/* SUSPEND / REACTIVATE ACTION MODAL */}
      {isActionModalOpen && customerForAction && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg capitalize flex items-center gap-2">
              {actionType === "suspend" ? "Suspend Customer" : "Reactivate Customer"}
            </h3>

            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center">
                  {customerForAction.imageUrl ? (
                    <img src={customerForAction.imageUrl} alt={customerForAction.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <User className="size-5 text-base-content/50" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{customerForAction.name || customerForAction.email}</div>
                  <div className="text-sm text-base-content/60">{customerForAction.email}</div>
                </div>
              </div>

              {actionType === "suspend" && (
                <div className="form-control mt-4">
                  <label className="label"><span className="label-text">Reason (optional)</span></label>
                  <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="textarea textarea-bordered" rows={3} />
                </div>
              )}
            </div>

            <div className="modal-action">
              <button onClick={() => setIsActionModalOpen(false)} className="btn">Cancel</button>
              <button onClick={handleAction} disabled={isLoading} className={`btn ${actionType === "suspend" ? "btn-error" : "btn-success"}`}>
                {isLoading ? <span className="loading loading-spinner loading-sm" /> : (actionType === "suspend" ? "Suspend" : "Reactivate")}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsActionModalOpen(false)} />
        </div>
      )}

      {/* CREATE USER DRAWER */}
      <div className="drawer drawer-end">
        <input 
          id="create-user-drawer" 
          type="checkbox" 
          className="drawer-toggle" 
          checked={isCreateModalOpen}
          onChange={(e) => setIsCreateModalOpen(e.target.checked)}
        />
        
        {/* Drawer Content */}
        <div className="drawer-content" />
        
        {/* Drawer Side */}
        <div className="drawer-side z-50">
          <label htmlFor="create-user-drawer" className="drawer-overlay"></label>
          
          <div className="w-full sm:w-[500px] bg-base-100 h-screen flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex items-center justify-between z-10">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Create New User
              </h3>
              <label 
                htmlFor="create-user-drawer"
                className="btn btn-ghost btn-sm btn-circle cursor-pointer"
              >
                <X className="w-5 h-5" />
              </label>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Profile Image URL */}
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-16 h-16 rounded-full bg-base-200">
                    {createForm.imageFile ? (
                      <img src={URL.createObjectURL(createForm.imageFile)} alt="Profile" className="rounded-full object-cover" />
                    ) : createForm.imageUrl ? (
                      <img src={createForm.imageUrl} alt="Profile" className="rounded-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <User className="size-6 text-base-content/30" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="label py-0">
                    <span className="label-text text-xs">Profile Image URL (optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered input-sm w-full"
                    onChange={(e) => setCreateForm({ ...createForm, imageFile: e.target.files[0] })}
                  />
                </div>
              </div>

              <div className="divider my-2"></div>

              {/* Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name *</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="John Doe"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email Address *</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="john@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password *</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
                  <input
                    type="password"
                    className="input input-bordered w-full pl-10"
                    placeholder="Minimum 6 characters"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>
                <label className="label">
                  <span className="label-text-alt text-base-content/50">Minimum 6 characters</span>
                </label>
              </div>

              {/* Role & Verified */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email Status</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-3 bg-base-200 rounded-lg px-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-sm"
                      checked={createForm.isEmailVerified}
                      onChange={(e) => setCreateForm({ ...createForm, isEmailVerified: e.target.checked })}
                    />
                    <span className="label-text text-sm">Verified</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-6 flex gap-3 z-10">
              <label 
                htmlFor="create-user-drawer"
                className="btn btn-outline flex-1 cursor-pointer"
              >
                Cancel
              </label>
              <button 
                onClick={handleCreate} 
                disabled={isLoading} 
                className="btn btn-primary flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" /> Create User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;