const users = [];

// Join user to chat
const userJoin = (id, username, room) => {
  console.log(`userJoin: ${id} ${username} ${room}`);
  let user = getCurrentUser(id);
  if (user) {
    // Update the room for an existing user
    user.room = room;
    console.log(`userJoin => users from utils: ${JSON.stringify(users)}`);
  } else {
    // Create a new user
    user = { id, username, room };
    users.push(user);
    console.log(`userJoin => users from utils: ${JSON.stringify(users)}`);
  }
  return user;
};

// Get current user
const getCurrentUser = (id) => {
  return users.find((user) => user.id === id);
};

// User leaves chat
const userLeave = (id) => {
  const index = users.findIndex((user) => user.id === id);
  console.log(
    `Attempting to remove user with ID: ${id}, found at index: ${index}`
  );

  if (index !== -1) {
    const removedUser = users.splice(index, 1)[0];
    console.log(`Removed user: ${JSON.stringify(removedUser)}`);
    return removedUser;
  }
  return null;
};

// Get room users
const getRoomUsers = (room) => {
  return users.filter((user) => user.room === room);
};

const getCurrentUserByUsername = (username) => {
  return users.find((user) => user.username === username);
};

const userLeaveByName = (username) => {
  const index = users.findIndex((user) => user.username === username);

  if (index !== -1) {
    console.log("user index is: " + index);
    return users.splice(index, 1)[0];
  }
};

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getCurrentUserByUsername,
  userLeaveByName
};
