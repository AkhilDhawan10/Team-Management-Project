const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/projects — List user's projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user._id })
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .sort('-createdAt');

    // Attach task counts to each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        return { ...project.toObject(), taskCount };
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects — Create project (Admin only)
router.post(
  '/',
  roleCheck('Admin'),
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, description } = req.body;
      const project = await Project.create({
        name,
        description,
        owner: req.user._id,
        members: [req.user._id],
      });

      await project.populate('owner', 'name email');
      await project.populate('members', 'name email role');

      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/projects/:id — Get project details
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member
    if (!project.members.some((m) => m._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const taskCount = await Task.countDocuments({ project: project._id });
    res.json({ ...project.toObject(), taskCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id — Update project (Admin only)
router.put(
  '/:id',
  roleCheck('Admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      if (!project.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Only project owner can update' });
      }

      const { name, description } = req.body;
      if (name) project.name = name;
      if (description !== undefined) project.description = description;

      await project.save();
      await project.populate('owner', 'name email');
      await project.populate('members', 'name email role');

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/projects/:id — Delete project (Admin only)
router.delete('/:id', roleCheck('Admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only project owner can delete' });
    }

    // Delete all tasks in the project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project and its tasks deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/members — Add member (Admin only)
router.post(
  '/:id/members',
  roleCheck('Admin'),
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      if (!project.owner.equals(req.user._id)) {
        return res
          .status(403)
          .json({ message: 'Only project owner can add members' });
      }

      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json({ message: 'User not found with that email' });
      }

      if (project.members.some((m) => m.equals(user._id))) {
        return res.status(400).json({ message: 'User is already a member' });
      }

      project.members.push(user._id);
      await project.save();
      await project.populate('members', 'name email role');

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/projects/:id/members/:userId — Remove member (Admin only)
router.delete('/:id/members/:userId', roleCheck('Admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.owner.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: 'Only project owner can remove members' });
    }

    if (project.owner.equals(req.params.userId)) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(
      (m) => !m.equals(req.params.userId)
    );
    await project.save();
    await project.populate('members', 'name email role');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
