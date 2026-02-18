import axiosInstance from "./axios";

export const productApi = {
  // Get all products with filters and pagination
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get("/admin/products", { params });
    return data;
  },

  // Get single product by ID
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/admin/products/${id}`);
    return data;
  },

  // Get product statistics
  getStats: async (id) => {
    const { data } = await axiosInstance.get(`/admin/products/${id}/stats`);
    return data;
  },

  // Create new product
  create: async (formData) => {
    const { data } = await axiosInstance.post("/admin/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  // Update existing product
  update: async ({ id, formData }) => {
    const { data } = await axiosInstance.put(`/admin/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  // Delete a product
  delete: async (productId) => {
    const { data } = await axiosInstance.delete(`/admin/products/${productId}`);
    return data;
  },

  // Bulk update products
  bulkUpdate: async ({ productIds, updates }) => {
    const { data } = await axiosInstance.post("/admin/products/bulk/update", { productIds, updates });
    return data;
  },

  // Bulk delete products
  bulkDelete: async (productIds) => {
    const { data } = await axiosInstance.post("/admin/products/bulk/delete", { productIds });
    return data;
  },

  // Delete a product image
  deleteImage: async ({ productId, imageIndex }) => {
    const { data } = await axiosInstance.delete(`/admin/products/${productId}/images/${imageIndex}`);
    return data;
  },

  // Set primary image
  setPrimaryImage: async ({ productId, imageIndex }) => {
    const { data } = await axiosInstance.patch(`/admin/products/${productId}/images/${imageIndex}/primary`);
    return data;
  },
};

export const categoryApi = {
  // Get all categories (flat or hierarchical)
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get("/categories", { params });
    return data;
  },

  // Get category tree
  getTree: async () => {
    const { data } = await axiosInstance.get("/categories/tree");
    return data;
  },

  // Get single category
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/categories/${id}`);
    return data;
  },

  // Create category (admin only)
  create: async (categoryData) => {
    const config = {};
    let body = categoryData;
    if (categoryData instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
      body = categoryData;
    }
    const { data } = await axiosInstance.post("/categories", body, config);
    return data;
  },

  // Update category (admin only)
  // Accepts either: update({ id, ...updateData }) or update({ id, formData: FormData })
  update: async ({ id, ...updateData }) => {
    const config = {};
    let body = updateData;
    if (updateData instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
      body = updateData;
    } else if (updateData.formData && updateData.formData instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
      body = updateData.formData;
    }
    const { data } = await axiosInstance.put(`/categories/${id}`, body, config);
    return data;
  },

  // Delete category (admin only)
  delete: async (id, options = {}) => {
    const { data } = await axiosInstance.delete(`/categories/${id}`, {
      data: options,
    });
    return data;
  },

  // Reorder categories (admin only)
  reorder: async (categories) => {
    const { data } = await axiosInstance.post("/categories/reorder", { categories });
    return data;
  },
};

export const orderApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/orders");
    return data;
  },

  getById: async (id) => {
    const { data } = await axiosInstance.get(`/admin/orders/${id}`);
    return data;
  },

  updateStatus: async ({ orderId, status }) => {
    const { data } = await axiosInstance.patch(`/admin/orders/${orderId}/status`, { status });
    return data;
  },

  update: async ({ id, updates }) => {
    const { data } = await axiosInstance.put(`/admin/orders/${id}`, updates);
    return data;
  },

  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/admin/orders/${id}`);
    return data;
  },
};

export const statsApi = {
  getDashboard: async () => {
    const { data } = await axiosInstance.get("/admin/stats");
    return data;
  },
};

export const customerApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/customers");
    return data;
  },

  getById: async (id) => {
    const { data } = await axiosInstance.get(`/admin/customers/${id}`);
    return data;
  },

  create: async (customerData) => {
    const config = {};
    if (customerData instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
    }
    const { data } = await axiosInstance.post("/admin/customers", customerData, config);
    return data;
  },

  update: async ({ id, formData }) => {
    const config = {};
    if (formData instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
    }
    const { data } = await axiosInstance.put(`/admin/customers/${id}`, formData || {}, config);
    return data;
  },

  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/admin/customers/${id}`);
    return data;
  },
  // Suspend a customer (admin)
  suspend: async (id, reason) => {
    const { data } = await axiosInstance.post(`/admin/customers/${id}/suspend`, { reason });
    return data;
  },
  // Reactivate a suspended customer
  reactivate: async (id) => {
    const { data } = await axiosInstance.post(`/admin/customers/${id}/reactivate`);
    return data;
  },
};

export const vendorApi = {
  // Get all shops with filters
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get("/vendor/admin/shops", { params });
    return data;
  },

  // Get single shop by ID
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/vendor/admin/shops/${id}`);
    return data;
  },

  // Approve a shop
  approve: async (id, payload = {}) => {
    const { data } = await axiosInstance.post(`/vendor/admin/shops/${id}/approve`, payload);
    return data;
  },

  // Reject a shop
  reject: async (id, reason) => {
    const { data } = await axiosInstance.post(`/vendor/admin/shops/${id}/reject`, { reason });
    return data;
  },

  // Suspend a shop
  suspend: async (id, reason) => {
    const { data } = await axiosInstance.post(`/vendor/admin/shops/${id}/suspend`, { reason });
    return data;
  },

  // Reactivate a suspended shop
  reactivate: async (id) => {
    const { data } = await axiosInstance.post(`/vendor/admin/shops/${id}/reactivate`);
    return data;
  },

  // Update shop settings
  update: async (id, updates) => {
    const config = {};
    let body = updates;
    // support FormData for file uploads
    if (updates instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
      body = updates;
    } else if (updates.formData instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
      body = updates.formData;
    }
    const { data } = await axiosInstance.put(`/vendor/admin/shops/${id}`, body, config);
    return data;
  },

  // Delete a shop
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/vendor/admin/shops/${id}`);
    return data;
  },

  // Create a shop (admin)
  create: async (shopData) => {
    const config = {};
    let body = shopData;
    if (shopData instanceof FormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
      body = shopData;
    }
    const { data } = await axiosInstance.post("/vendor/admin/shops", body, config);
    return data;
  },
};

export const adminApi = {
  // Get list of vendor users for admin selection
  getVendors: async () => {
    const { data } = await axiosInstance.get('/admin/vendors');
    return data;
  },
};