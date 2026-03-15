'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types/notification';
import NotificationCard from '@/components/NotificationCard';
import { useNotificationStore } from '@/app/_zustand/notificationStore';
import {
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaTrash,
  FaSpinner,
  FaBell
} from 'react-icons/fa';

const NotificationsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    notifications,
    total,
    page,
    totalPages,
    loading,
    error,
    selectedIds,
    filters,
    fetchNotifications,
    markSelectedAsRead,
    deleteSelectedNotifications,
    updateFilters,
    loadMore,
    markNotificationAsRead,
    deleteNotificationById
  } = useNotifications();

  const { toggleSelection, selectAll, clearSelection } = useNotificationStore();

  const [searchTerm, setSearchTerm] = useState<string>(filters.search || '');
  const [selectedType, setSelectedType] = useState<string>(filters.type || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(
    filters.isRead === undefined ? 'all' : filters.isRead ? 'read' : 'unread'
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
  }, [session, status, router]);

  // Sync filters to local state
  useEffect(() => {
    setSearchTerm(filters.search || '');
    setSelectedType(filters.type || 'all');
    setSelectedStatus(
      filters.isRead === undefined ? 'all' : filters.isRead ? 'read' : 'unread'
    );
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    if (session) fetchNotifications();
  }, [session, fetchNotifications]);

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      ...filters,
      search: searchTerm || undefined,
      page: 1
    });
  };

  // Type filter
  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    updateFilters({
      ...filters,
      type: type === 'all' ? undefined : (type as NotificationType),
      page: 1
    });
  };

  // Status filter
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    updateFilters({
      ...filters,
      isRead: status === 'all' ? undefined : status === 'read',
      page: 1
    });
  };

  // Bulk actions
  const handleBulkMarkAsRead = async () => {
    if (selectedIds.length > 0) await markSelectedAsRead();
  };

  const handleBulkDelete = async () => {
    if (
      selectedIds.length > 0 &&
      confirm(`Are you sure you want to delete ${selectedIds.length} notification(s)?`)
    ) {
      await deleteSelectedNotifications();
    }
  };

  // Select all
  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) clearSelection();
    else selectAll();
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <FaBell className="text-2xl text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          </div>
          <p className="text-gray-600">Manage and view all your notifications in one place</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-sm rounded"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <select
              value={selectedType}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value={NotificationType.ORDER_UPDATE}>Order Updates</option>
              <option value={NotificationType.PAYMENT_STATUS}>Payment Status</option>
              <option value={NotificationType.PROMOTION}>Promotions</option>
              <option value={NotificationType.SYSTEM_ALERT}>System Alerts</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedStatus('all');
                updateFilters({
                  type: undefined,
                  isRead: undefined,
                  search: undefined,
                  page: 1,
                  limit: 10,
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                });
              }}
              className="text-sm underline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
            <span className="text-sm text-blue-700">{selectedIds.length} selected</span>
            <div className="flex space-x-3">
              <button
                onClick={handleBulkMarkAsRead}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
              >
                <FaCheckCircle className="w-4 h-4 mr-1" /> Mark as Read
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
              >
                <FaTrash className="w-4 h-4 mr-1" /> Delete
              </button>
            </div>
          </div>
        )}

        {/* Select All */}
        {notifications.length > 0 && (
          <label className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={selectedIds.length === notifications.length && notifications.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span>Select all notifications</span>
          </label>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && notifications.length === 0 ? (
            <div className="text-center py-12">
              <FaSpinner className="animate-spin text-3xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p className="mb-4 font-medium">Error loading notifications</p>
              <p className="mb-4">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Try Again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <FaBell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {Object.keys(filters).some(
                  (key) =>
                    filters[key as keyof typeof filters] !== undefined &&
                    !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)
                )
                  ? 'Try adjusting your filters to see more notifications.'
                  : "You don’t have any notifications yet."}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  isSelected={selectedIds.includes(notification.id)}
                  onToggleSelect={toggleSelection}
                  onMarkAsRead={markNotificationAsRead}
                  onDelete={async (id) => {
                    if (confirm('Are you sure you want to delete this notification?')) {
                      await deleteNotificationById(id);
                    }
                  }}
                />
              ))}

              {page < totalPages && (
                <div className="text-center pt-6">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats */}
        {total > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {notifications.length} of {total} notification{total !== 1 ? 's' : ''}
            {page < totalPages && ` (Page ${page} of ${totalPages})`}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;