import { HiOutlineClock, HiOutlineUser, HiOutlineFlag } from 'react-icons/hi';

const statusColors = {
  'To Do': 'status-todo',
  'In Progress': 'status-progress',
  Done: 'status-done',
};

const priorityColors = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high',
};

const TaskCard = ({ task, onStatusChange, isAdmin }) => {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'Done';

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`task-card ${isOverdue ? 'task-overdue' : ''}`}>
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
        <span className={`badge ${priorityColors[task.priority]}`}>
          <HiOutlineFlag />
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-card-meta">
        {task.assignedTo && (
          <span className="task-assignee">
            <HiOutlineUser />
            {task.assignedTo.name}
          </span>
        )}
        {task.dueDate && (
          <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
            <HiOutlineClock />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.project && (
          <span className="task-project">{task.project.name}</span>
        )}
      </div>

      <div className="task-card-footer">
        <select
          className={`status-select ${statusColors[task.status]}`}
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
    </div>
  );
};

export default TaskCard;
