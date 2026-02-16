import { orderApi } from "../lib/api";
import { formatDate } from "../lib/utils";
import { useQuery, useMutation, useQueryClient } from "../hooks/useQuery";
import { useState } from "react";

function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderApi.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: orderApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setShowDeleteModal(false);
      setSelectedOrder(null);
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleDeleteClick = (order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedOrder) {
      deleteOrderMutation.mutate(selectedOrder._id);
    }
  };

  const orders = ordersData?.orders || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-base-content/70">Manage customer orders</p>
      </div>

      {/* ORDERS TABLE */}
      <div className="card bg-base-100">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p className="text-xl font-semibold mb-2">No orders yet</p>
              <p className="text-sm">Orders will appear here once customers make purchases</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const totalQuantity = order.orderItems.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );

                    return (
                      <tr key={order._id}>
                        <td>
                          <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                        </td>

                        <td>
                          <div className="font-medium">{order.shippingAddress.fullName}</div>
                          <div className="text-sm opacity-60">
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                          </div>
                        </td>

                        <td>
                          <div className="font-medium">{totalQuantity} items</div>
                          <div className="text-sm opacity-60">
                            {order.orderItems[0]?.name}
                            {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
                          </div>
                        </td>

                        <td>
                          <span className="font-semibold">{order.totalPrice.toFixed(2)} TND</span>
                        </td>

                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className={`select select-sm 
                              ${order.status === "pending" ? "bg-yellow-100 text-yellow-700 border-yellow-300" : ""}
                              ${order.status === "shipped" ? "bg-blue-100 text-blue-700 border-blue-300" : ""}
                              ${order.status === "delivered" ? "bg-green-100 text-green-700 border-green-300" : ""}
                            `}
                            disabled={updateStatusMutation.isPending}
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>

                        <td>
                          <span className="text-sm opacity-60">{formatDate(order.createdAt)}</span>
                        </td>

                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="btn btn-ghost btn-sm"
                              title="View Details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(order)}
                              className="btn btn-ghost btn-sm"
                              title="Edit Order"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(order)}
                              className="btn btn-ghost btn-sm text-error"
                              title="Delete Order"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {showDetailsModal && selectedOrder && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              Order Details - #{selectedOrder._id.slice(-8).toUpperCase()}
            </h3>

            <div className="space-y-6">
              {/* Customer Information */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-60">Name</p>
                      <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-60">Phone</p>
                      <p className="font-medium">{selectedOrder.shippingAddress.phoneNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <p>{selectedOrder.shippingAddress.streetAddress}</p>
                  <p>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                    {selectedOrder.shippingAddress.zipCode}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="font-semibold mb-2">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm opacity-60">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} TND</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="font-semibold mb-2">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="badge badge-primary">{selectedOrder.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Date</span>
                      <span>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    {selectedOrder.shippedAt && (
                      <div className="flex justify-between">
                        <span>Shipped Date</span>
                        <span>{formatDate(selectedOrder.shippedAt)}</span>
                      </div>
                    )}
                    {selectedOrder.deliveredAt && (
                      <div className="flex justify-between">
                        <span>Delivered Date</span>
                        <span>{formatDate(selectedOrder.deliveredAt)}</span>
                      </div>
                    )}
                    <div className="divider"></div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{selectedOrder.totalPrice.toFixed(2)} TND</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDetailsModal(false)}>close</button>
          </form>
        </dialog>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedOrder && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Order</h3>
            <div className="py-4">
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Warning: This action cannot be undone!</span>
              </div>
              <p className="mt-4">
                Are you sure you want to delete order{" "}
                <strong>#{selectedOrder._id.slice(-8).toUpperCase()}</strong>?
              </p>
              <p className="mt-2 text-sm opacity-60">
                This will restore product stock and update vendor statistics.
              </p>
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedOrder(null);
                }}
                disabled={deleteOrderMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDeleteConfirm}
                disabled={deleteOrderMutation.isPending}
              >
                {deleteOrderMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete Order"
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDeleteModal(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}

// Edit Order Modal Component
function EditOrderModal({ order, onClose, onSave }) {
  const [formData, setFormData] = useState({
    status: order.status,
    shippingAddress: { ...order.shippingAddress },
  });

  const updateOrderMutation = useMutation({
    mutationFn: orderApi.update,
    onSuccess: () => {
      onSave();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateOrderMutation.mutate({
      id: order._id,
      updates: formData,
    });
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Edit Order - #{order._id.slice(-8).toUpperCase()}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Order Status</span>
            </label>
            <select
              className="select select-bordered"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Shipping Address */}
          <div className="divider">Shipping Address</div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Full Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.shippingAddress.fullName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shippingAddress: { ...formData.shippingAddress, fullName: e.target.value },
                })
              }
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Street Address</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.shippingAddress.streetAddress}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shippingAddress: { ...formData.shippingAddress, streetAddress: e.target.value },
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">City</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.shippingAddress.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: { ...formData.shippingAddress, city: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">State</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.shippingAddress.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: { ...formData.shippingAddress, state: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Zip Code</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.shippingAddress.zipCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: { ...formData.shippingAddress, zipCode: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Phone Number</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.shippingAddress.phoneNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: { ...formData.shippingAddress, phoneNumber: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose} disabled={updateOrderMutation.isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updateOrderMutation.isPending}>
              {updateOrderMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

export default OrdersPage;