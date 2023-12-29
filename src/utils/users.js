const users = [];

// Join user to chat or update their room
const userJoin = (id, username, room) => {
  let alreadyInRoom = false;
  let previousRoom = null;
  let user = getCurrentUser(id);
  
  if (user) {
    previousRoom = user.room;
    // Check if the user is already in the specified room
    if (user.room === room) {
      alreadyInRoom = true;
      console.log(`userJoin => user already in room: ${JSON.stringify(user)}`);
    } else {
      // Update the room for an existing user
      user.room = room;
      console.log(`userJoin => updating user: ${JSON.stringify(user)}`);
    }
  } else {
    // Create a new user
    user = { id, username, room };
    users.push(user);
    console.log(`userJoin => adding user: ${JSON.stringify(user)}`);
  }

  console.log(`userJoin => users: ${JSON.stringify(users)}`);
  return { ...user, alreadyInRoom, previousRoom };
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

const isUserInRoom = (username, room) => {
  return users.some((user) => user.username === username && user.room === room);
};

const getAllUsers = () => {
  return users.map((user) => {
    return {
      username: user.username,
    };
  });
};

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getCurrentUserByUsername,
  userLeaveByName,
  isUserInRoom,
  getAllUsers,
};
