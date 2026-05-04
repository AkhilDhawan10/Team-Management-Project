const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/tasks/dashboard — Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all projects user is a member of
    const userProjects = await Project.find({ members: userId }).select('_id');
    const projectIds = userProjects.map((p) => p._id);

    // Base filter: tasks in user's projects
    const baseFilter = { project: { $in: projectIds } };

    const [total, todo, inProgress, done, overdue, recentTasks] =
      await Promise.all([
        Task.countDocuments(baseFilter),
        Task.countDocuments({ ...baseFilter, status: 'To Do' }),
        Task.countDocuments({ ...baseFilter, status: 'In Progress' }),
        Task.countDocuments({ ...baseFilter, status: 'Done' }),
        Task.countDocuments({
          ...baseFilter,
          status: { $ne: 'Done' },
          dueDate: { $lt: new Date(), $ne: null },
        }),
        Task.find(baseFilter)
          .sort('-createdAt')
          .limit(5)
          .populate('assignedTo', 'name email')
          .populate('project', 'name'),
      ]);

    // Tasks assigned to the current user
    const myTasks = await Task.countDocuments({
      ...baseFilter,
      assignedTo: userId,
      status: { $ne: 'Done' },
    });

    res.json({
      total,
      todo,
      inProgress,
      done,
      overdue,
      myTasks,
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks — List tasks (with filters)
router.get('/', async (req, res) => {
  try {
    const { project, status, assignedToMe, search } = req.query;
    const filter = {};

    if (project) {
      filter.project = project;
    } else {
      // Only show tasks from user's projects
      const userProjects = await Project.find({
        members: req.user._id,
      }).select('_id');
      filter.project = { $in: userProjects.map((p) => p._id) };
    }

    if (status) filter.status = status;
    if (assignedToMe === 'true') filter.assignedTo = req.user._id;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('project', 'name')
      .sort('-createdAt');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks — Create task (Admin only)
router.post(
  '/',
  roleCheck('Admin'),
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project is required'),
    body('status')
      .optional()
      .isIn(['To Do', 'In Progress', 'Done'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High'])
      .withMessage('Invalid priority'),
    body('description').optional().trim(),
    body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid date'),
    body('assignedTo').optional({ values: 'null' }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { title, description, status, priority, project, assignedTo, dueDate } =
        req.body;

      // Verify project exists and user owns it
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(404).json({ message: 'Project not found' });
      }
      if (!projectDoc.owner.equals(req.user._id)) {
        return res
          .status(403)
          .json({ message: 'Only project owner can create tasks' });
      }

      // Verify assignee is a project member
      if (assignedTo) {
        if (!projectDoc.members.some((m) => m.equals(assignedTo))) {
          return res
            .status(400)
            .json({ message: 'Assignee must be a project member' });
        }
      }

      const task = await Task.create({
        title,
        description,
        status,
        priority,
        project,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
        createdBy: req.user._id,
      });

      await task.populate('assignedTo', 'name email');
      await task.populate('createdBy', 'name');
      await task.populate('project', 'name');

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/tasks/:id — Get task details
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id — Update task (Admin: all fields, Member: status only)
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isAdmin = req.user.role === 'Admin';

    if (isAdmin) {
      // Admin can update all fields
      const { title, description, status, priority, assignedTo, dueDate } =
        req.body;

      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    } else {
      // Member can only update status
      if (req.body.status) {
        if (!['To Do', 'In Progress', 'Done'].includes(req.body.status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        task.status = req.body.status;
      } else {
        return res
          .status(403)
          .json({ message: 'Members can only update task status' });
      }
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name');
    await task.populate('project', 'name');

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id — Delete task (Admin only)
router.delete('/:id', roleCheck('Admin'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
