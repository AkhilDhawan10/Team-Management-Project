import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineUserAdd,
  HiOutlineUserRemove,
  HiOutlineArrowLeft,
} from 'react-icons/hi';

const ProjectDetail = () => {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    assignedTo: '',
    dueDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch {
      toast.error('Failed to load project');
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/tasks?project=${id}`);
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    }
  };

  useEffect(() => {
    Promise.all([fetchProject(), fetchTasks()]).then(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Status updated');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');

    setSubmitting(true);
    try {
      await api.post('/tasks', {
        ...taskForm,
        project: id,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null,
      });
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        assignedTo: '',
        dueDate: '',
      });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
    setSubmitting(false);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return toast.error('Email is required');

    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      toast.success('Member added!');
      setMemberEmail('');
      setShowMemberModal(false);
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
    setSubmitting(false);
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this project?`)) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container">
        <p>Project not found.</p>
        <Link to="/projects">Back to Projects</Link>
      </div>
    );
  }

  const isOwner = project.owner?._id === user?.id;

  return (
    <div className="page-container" id="project-detail-page">
      <Link to="/projects" className="btn btn-sm btn-outline back-btn">
        <HiOutlineArrowLeft /> Back to Projects
      </Link>

      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          {project.description && (
            <p className="page-subtitle">{project.description}</p>
          )}
        </div>
        <div className="header-actions">
          {isAdmin && isOwner && (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setShowMemberModal(true)}
                id="add-member-btn"
              >
                <HiOutlineUserAdd /> Add Member
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowTaskModal(true)}
                id="create-task-btn"
              >
                <HiOutlinePlus /> Add Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="section">
        <h3>Team Members ({project.members?.length || 0})</h3>
        <div className="members-list">
          {project.members?.map((member) => (
            <div className="member-chip" key={member._id}>
              <div className="member-avatar">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-info">
                <span className="member-name">{member.name}</span>
                <span
                  className={`member-role ${
                    member.role === 'Admin' ? 'role-admin' : 'role-member'
                  }`}
                >
                  {member.role}
                </span>
              </div>
              {isAdmin &&
                isOwner &&
                member._id !== project.owner?._id && (
                  <button
                    className="btn-icon btn-danger-icon"
                    onClick={() => handleRemoveMember(member._id, member.name)}
                    title="Remove member"
                  >
                    <HiOutlineUserRemove />
                  </button>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="section">
        <div className="section-header">
          <h3>Tasks ({tasks.length})</h3>
        </div>
        {tasks.length > 0 ? (
          <div className="task-grid">
            {tasks.map((task) => (
              <div key={task._id} className="task-card-wrapper">
                <TaskCard
                  task={task}
                  onStatusChange={handleStatusChange}
                  isAdmin={isAdmin}
                />
                {isAdmin && (
                  <button
                    className="btn btn-sm btn-danger task-delete-btn"
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-sm">
            <p>No tasks in this project yet.</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2>Create Task</h2>
            <form onSubmit={handleCreateTask} id="create-task-form">
              <div className="form-group">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  placeholder="Describe the task..."
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((p) => ({ ...p, priority: e.target.value }))
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task-status">Status</label>
                  <select
                    id="task-status"
                    value={taskForm.status}
                    onChange={(e) =>
                      setTaskForm((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-assignee">Assign To</label>
                  <select
                    id="task-assignee"
                    value={taskForm.assignedTo}
                    onChange={(e) =>
                      setTaskForm((p) => ({ ...p, assignedTo: e.target.value }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {project.members?.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task-due">Due Date</label>
                  <input
                    id="task-due"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm((p) => ({ ...p, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowMemberModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Team Member</h2>
            <form onSubmit={handleAddMember} id="add-member-form">
              <div className="form-group">
                <label htmlFor="member-email">Member Email</label>
                <input
                  id="member-email"
                  type="email"
                  placeholder="member@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
                <small className="form-hint">
                  The user must already have an account
                </small>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowMemberModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
