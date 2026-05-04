import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import toast from 'react-hot-toast';
import { HiOutlineFilter, HiOutlineSearch } from 'react-icons/hi';

const Tasks = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    project: '',
    status: '',
    assignedToMe: false,
    search: '',
  });

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.project) params.set('project', filters.project);
      if (filters.status) params.set('status', filters.status);
      if (filters.assignedToMe) params.set('assignedToMe', 'true');
      if (filters.search) params.set('search', filters.search);

      const { data } = await api.get(`/tasks?${params.toString()}`);
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [filters.project, filters.status, filters.assignedToMe]);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchTasks();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Status updated');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  // Group tasks by status
  const groupedTasks = {
    'To Do': tasks.filter((t) => t.status === 'To Do'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    Done: tasks.filter((t) => t.status === 'Done'),
  };

  return (
    <div className="page-container" id="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="page-subtitle">View and manage all tasks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar glass-card">
        <div className="filter-group">
          <HiOutlineFilter />
          <select
            value={filters.project}
            onChange={(e) =>
              setFilters((p) => ({ ...p, project: e.target.value }))
            }
            id="filter-project"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
            id="filter-status"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.assignedToMe}
              onChange={(e) =>
                setFilters((p) => ({ ...p, assignedToMe: e.target.checked }))
              }
              id="filter-my-tasks"
            />
            My Tasks
          </label>
        </div>

        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <HiOutlineSearch />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
              id="search-tasks"
            />
          </div>
          <button type="submit" className="btn btn-sm btn-primary">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="kanban-board">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <div className="kanban-column" key={status}>
              <div className={`kanban-header kanban-${status.toLowerCase().replace(/\s/g, '-')}`}>
                <h3>{status}</h3>
                <span className="kanban-count">{statusTasks.length}</span>
              </div>
              <div className="kanban-cards">
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    isAdmin={isAdmin}
                  />
                ))}
                {statusTasks.length === 0 && (
                  <div className="kanban-empty">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No tasks found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

export default Tasks;
