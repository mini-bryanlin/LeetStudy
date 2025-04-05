const { createUser, getUser } = require('../models/user');

// Controller for creating a new user
const createUserProfile = (req, res) => {
  const { username, } = req.body;

  // Create the user profile
  const user = createUser(username);

  // Return a success response with the user details
  res.status(201).json({ message: 'User created', user });
};

// Controller for getting a user profile by ID
const getUserProfile = (req, res) => {
  const { userId } = req.params;

  // Get the user by ID
  const user = getUser(userId);

  // If the user exists, return their profile, otherwise return an error
  if (user) {
    res.status(200).json({ user });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = { createUserProfile, getUserProfile };
