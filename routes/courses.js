const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const {User, Course} = require('../models');
//Imports asyncHandler middleware function
const { asyncHandler } = require('../middleware/async-handler');
//Imports authenticateUser middleware function
const { authenticateUser } = require('../middleware/auth-user');

// Route that returns all courses
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId'],
    include: [{
      model: User,
      attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    }
  ],
  });

  res.json(courses);
}));

// Route that returns course for specific id
router.get('/courses/:id', asyncHandler(async (req, res) => {
  const {id} = req.params;
  const course = await Course.findByPk(id, {
    attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId'],
    include: [{
      model: User,
      attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    }],
  });

  if (course) {
    res.json(course);
  } else {
    res.status(404).json({message: 'Course does not exist'});
 }
  
}));

//Route that creates a new course
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
   //Get Authenticated User
   const user = req.currentUser;
    try {
      const course = await Course.create(req.body);
      res.location(`/courses/${course.id}`).status(201).json({ "message": "Account successfully created!" });
    } catch (error) {
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors.map(err => err.message);
        res.status(400).json({ errors });   
      } else {
        throw error;
      }
    }
}));

//Route that updates course with the corresponding id
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  const authenticatedUser = req.currentUser;
  const { id } = req.params;
  const course = await Course.findByPk(id);
    try {
      //Checks if course exists
      if (course) {
          const courseUserId = course.userId;
          //Checks if authenticated user is course owner
          if (authenticatedUser.id === courseUserId) {
            await course.update(req.body);
            res.status(204).end();
          } else {
          res.status(403).json({message: 'Access to this method is denied'});
        } 
    } else {
      res.status(404).json({message: 'Course does not exist'});
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
      } else {
          throw error;
      }
  }

}));

//Route that deletes course with the corresponding id
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  const authenticatedUser = req.currentUser;
  const { id } = req.params;
  const course = await Course.findByPk(id);
        try {
          //Checks if course exists
          if (course) {
            const courseUserId = course.userId;
            //Checks if authenticated user is the course owner
            if (authenticatedUser.id === courseUserId) {
              await course.destroy();
              res.status(204).end();
            } else {
                res.status(403).json({message: 'Access to this method is denied'});
            }   
          } else {
              res.status(404).json({message: 'Course does not exist'});
            }
      } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
          const errors = error.errors.map(err => err.message);
          res.status(400).json({ errors });
          } else {
              throw error;
          }
      }
}));

module.exports = router;