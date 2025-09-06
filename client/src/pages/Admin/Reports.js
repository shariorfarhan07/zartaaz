import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminGuard from '../../components/Admin/AdminGuard';
import {
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  BarChart3,
  FileText,
  Mail,
  Eye
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState(null);
  const [newsletterStats, setNewsletterStats] = useState(null);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [showNewsletterSection, setShowNewsletterSection] = useState(false);

  useEffect(() => {
    fetchReportData();
    fetchNewsletterStats();
  }, [reportType, selectedYear, selectedMonth]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      if (reportType === 'monthly') {
        endpoint = `/api/admin/reports/monthly?year=${selectedYear}&month=${selectedMonth}`;
      } else {
        endpoint = `/api/admin/reports/yearly?year=${selectedYear}`;
      }

      const response = await axios.get(endpoint);
      setReportData(response.data.report);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsletterStats = async () => {
    try {
      const response = await axios.get('/api/newsletter/stats');
      setNewsletterStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching newsletter stats:', error);
    }
  };

  const fetchNewsletterSubscribers = async () => {
    try {
      const response = await axios.get('/api/newsletter/subscribers');
      setNewsletterSubscribers(response.data.subscribers);
      setShowNewsletterSection(true);
    } catch (error) {
      console.error('Error fetching newsletter subscribers:', error);
      toast.error('Failed to load newsletter subscribers');
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      let endpoint = '';
      
      if (reportType === 'monthly') {
        endpoint = `/api/admin/reports/export/monthly?year=${selectedYear}&month=${selectedMonth}`;
      } else {
        endpoint = `/api/admin/reports/export/yearly?year=${selectedYear}`;
      }

      const response = await axios.get(endpoint, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = reportType === 'monthly' 
        ? `monthly-report-${selectedYear}-${selectedMonth}.csv`
        : `yearly-report-${selectedYear}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">View detailed sales and performance reports</p>
            </div>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Report Controls */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="monthly">Monthly Report</option>
                  <option value="yearly">Yearly Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {reportType === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-end">
                <button
                  onClick={fetchReportData}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {reportData && (
            <>
              {/* Summary Cards */}
              {reportType === 'monthly' && reportData.summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(reportData.summary.totalRevenue)}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-green-100">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {reportData.summary.totalOrders}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(reportData.summary.averageOrderValue)}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Yearly Summary */}
              {reportType === 'yearly' && reportData.yearTotals && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Year Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(reportData.yearTotals.totalRevenue)}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-green-100">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Year Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {reportData.yearTotals.totalOrders}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(reportData.yearTotals.averageOrderValue)}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts */}
              {reportType === 'yearly' && reportData.monthlyBreakdown && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown - {selectedYear}</h3>
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.monthlyBreakdown.map(item => ({
                        month: monthNames[item._id.month - 1],
                        revenue: item.totalRevenue,
                        orders: item.totalOrders
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(value) : value,
                            name === 'revenue' ? 'Revenue' : 'Orders'
                          ]}
                        />
                        <Bar dataKey="revenue" fill="#374151" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Top Products */}
              {reportType === 'monthly' && reportData.topProducts && reportData.topProducts.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Products</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity Sold
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.topProducts.map((product, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.totalQuantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(product.totalRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!reportData && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Data</h3>
              <p className="text-gray-600">
                Select a report type and date range to generate your report.
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminReports;