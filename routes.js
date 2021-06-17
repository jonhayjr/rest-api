const express = require('express');
const router = express.Router();
const {User, Course} = require('./models');
//Imports asyncHandler middleware function
const { asyncHandler } = require('./middleware/async-handler');
//Imports authenticateUser middleware function
const { authenticateUser } = require('./middleware/auth-user');
const bcrypt = require('bcrypt');

// Route that returns the current authenticated user.
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    //Get Authenticated User
    const user = req.currentUser;

    //Return all current user data except password, createdAt and updatedAt fields
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress
    });
    
  }));

// Route that creates a new user.
router.post('/users', asyncHandler(async (req, res) => {
  try {
    const user = req.body;
    if (user.password) {
      user.password = bcrypt.hashSync(user.password, 10);
    }
    await User.create(user);
    res.location('/').status(201).json({ "message": "Account successfully created!" });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });   
    } else {
      throw error;
    }
  }
}));

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
    const err = new Error();
   err.status = 404;
   next(err);
 }
  
}));

//Route that creates a new course
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
    try {
      const course = req.body;
      await Course.create(course);
      res.location('/').status(201).json({ "message": "Account successfully created!" });
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
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  const authenticatedUser = req.currentUser;
  const { id } = req.params;
  const course = await Course.findByPk(id);
  const courseUserId = course.userId;

  //Checks if authenticatedUser owns course
if (authenticatedUser.id === courseUserId) {
    try {
      if (course) {
          await course.update(req.body);
          res.status(204).end();
      } else {
          const err = new Error();
          err.status = 404;
          next(err);
      }
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
      } else {
          throw error;
      }
  }
} else {
  res.status(403).end();
}


}));

//Route that deletes course with the corresponding id
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  const authenticatedUser = req.currentUser;
  const { id } = req.params;
  const course = await Course.findByPk(id);
  const courseUserId = course.userId;

  //Checks if authenticatedUser owns course
  if (authenticatedUser.id === courseUserId) {
        try {
          if (course) {
              await course.destroy();
              res.status(204).end();
          } else {
              const err = new Error();
              err.status = 404;
              next(err);
          }
      } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
          const errors = error.errors.map(err => err.message);
          res.status(400).json({ errors });
          } else {
              throw error;
          }
    }
  } else {
    res.status(403).end();
  }
   
}));

module.exports = router;