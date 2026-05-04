import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineLightningBolt,
  HiOutlineRefresh,
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/tasks/dashboard');
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Status updated');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats?.total || 0,
      icon: <HiOutlineClipboardList />,
      color: 'stat-blue',
    },
    {
      label: 'In Progress',
      value: stats?.inProgress || 0,
      icon: <HiOutlineLightningBolt />,
      color: 'stat-yellow',
    },
    {
      label: 'Completed',
      value: stats?.done || 0,
      icon: <HiOutlineCheckCircle />,
      color: 'stat-green',
    },
    {
      label: 'Overdue',
      value: stats?.overdue || 0,
      icon: <HiOutlineExclamation />,
      color: 'stat-red',
    },
    {
      label: 'My Tasks',
      value: stats?.myTasks || 0,
      icon: <HiOutlineClock />,
      color: 'stat-purple',
    },
  ];

  const total = stats?.total || 1;
  const progressPercent = ((stats?.done || 0) / total) * 100;

  return (
    <div className="page-container" id="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.name}</strong>
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchDashboard}>
          <HiOutlineRefresh /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div className={`stat-card ${stat.color}`} key={stat.label}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="progress-section glass-card">
        <h3>Overall Progress</h3>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="progress-label">{Math.round(progressPercent)}%</span>
        </div>
        <div className="progress-legend">
          <span className="legend-item legend-todo">
            To Do: {stats?.todo || 0}
          </span>
          <span className="legend-item legend-progress">
            In Progress: {stats?.inProgress || 0}
          </span>
          <span className="legend-item legend-done">
            Done: {stats?.done || 0}
          </span>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="section">
        <div className="section-header">
          <h3>Recent Tasks</h3>
          <Link to="/tasks" className="btn btn-sm btn-outline">
            View All
          </Link>
        </div>
        {stats?.recentTasks?.length > 0 ? (
          <div className="task-grid">
            {stats.recentTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <HiOutlineClipboardList />
            <p>No tasks yet. Create a project and start adding tasks!</p>
            <Link to="/projects" className="btn btn-primary">
              Go to Projects
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
