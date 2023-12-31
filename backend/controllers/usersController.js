const Chat = require("../models/Chat.js");
const Notification = require("../models/Notification.js");
const Post = require("../models/Post.js");
const User = require("../models/User.js");

const updateUserPicture = async (req, res) => {
  try {
    const imageUrl =
      "https://socio-irdl.onrender.com/profile_pics/" + req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { userPicture: imageUrl },
      { new: true }
    );

    await Post.updateMany(
      { userId: req.user._id },
      { $set: { userPicture: updatedUser.userPicture } }
    );

    res.status(200).json({ updatedImage: imageUrl });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Error updating profile picture" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!(await user.comparePasswords(currentPassword))) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getFindFriends = async (req, res) => {
  try {
    const currentUserUsername = req.params.username;
    const currentUser = await User.findOne({ username: currentUserUsername });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingUserIds = currentUser.following.map((user) =>
      user._id.toString()
    );
    const blockedUserIds = currentUser.blockedUsers.map((userId) =>
      userId.toString()
    );
    const blockedByIds = currentUser.blockedBy.map((userId) =>
      userId.toString()
    );

    const users = await User.find(
      {
        _id: {
          $ne: currentUser._id,
          $nin: [...blockedUserIds, ...blockedByIds, ...followingUserIds],
        },
      },
      "firstName lastName username userPicture followers"
    );

    const page = req.query.page || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const findfriends = users.map((user) => {
      return {
        ...user.toObject(),
        followers: user.followers.length,
      };
    });

    const paginatedUsers = findfriends.slice(skip, skip + limit);
    console.log(page, paginatedUsers);
    res.status(200).json(paginatedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserUsername = req.params.username;
    const currentUser = await User.findOne({ username: currentUserUsername });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const blockedUserIds = currentUser.blockedUsers.map((userId) =>
      userId.toString()
    );
    const blockedByIds = currentUser.blockedBy.map((userId) =>
      userId.toString()
    );
    const followingUserIds = currentUser.following.map((user) => user._id);

    const suggestedUsers = await User.find(
      {
        _id: {
          $ne: currentUser._id,
          $nin: [...blockedUserIds, ...blockedByIds, ...followingUserIds],
        },
      },
      "firstName lastName username userPicture followers"
    ).limit(8);

    const suggestedUsersWithFollowersAsNumbers = suggestedUsers.map((user) => {
      return {
        ...user.toObject(),
        followers: user.followers.length,
      };
    });

    res.status(200).json(suggestedUsersWithFollowersAsNumbers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUser = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user;

    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userBlockedBy = user.blockedBy.map((blockedById) =>
      blockedById.toString()
    );
    const userBlocked = user.blockedUsers.map((blockedUserId) =>
      blockedUserId.toString()
    );

    const isBlockedByCurrentUser = userBlockedBy.includes(
      currentUser._id.toString()
    );
    const isBlockedCurrentUser = userBlocked.includes(
      currentUser._id.toString()
    );

    if (isBlockedByCurrentUser || isBlockedCurrentUser) {
      return res.status(403).json({
        message:
          "Access denied. You are blocked by this user or have blocked this user.",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { bio, firstName, lastName, country, occupation, confirmPassword } =
      req.body;

    let user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await user.comparePasswords(confirmPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    user.bio = bio;
    user.firstName = firstName;
    user.lastName = lastName;
    user.country = country;
    user.occupation = occupation;

    await user.save();

    await Post.updateMany(
      { userId: req.user._id },
      {
        $set: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
      }
    );
    user = await User.findById(req.user._id).select("-password");

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findOne({ username: req.params.username });
    const currentUser = await User.findOne({ username: req.body.username });

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (userId) => userId.toString() !== userToFollow._id.toString()
      );
      await currentUser.save();

      userToFollow.followers = userToFollow.followers.filter(
        (userId) => userId.toString() !== currentUser._id.toString()
      );
      await userToFollow.save();

      await Notification.findOneAndDelete({
        sender: req.user._id,
        receiver: userToFollow._id,
        actionType: "follow",
      });

      res.status(200).json({ status: 0 }); // unfollow
    } else {
      currentUser.following.push(userToFollow._id);
      await currentUser.save();

      userToFollow.followers.push(currentUser._id);
      await userToFollow.save();

      const notification = new Notification({
        sender: req.user._id,
        receiver: userToFollow._id,
        actionType: "follow",
      });
      await notification.save();

      res.status(200).json({ status: 1 }); // follow
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Internal Server Error.");
  }
};

const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate(
      "followers",
      `_id username firstName lastName userPicture followers`
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const page = req.query.page || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const followers = user.followers.map((follower) => ({
      _id: follower._id,
      username: follower.username,
      firstName: follower.firstName,
      lastName: follower.lastName,
      userPicture: follower.userPicture,
      followers: follower.followers.length,
    }));

    const paginatedFollowers = followers.slice(skip, skip + limit);

    res.status(200).json(paginatedFollowers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate(
      "following",
      `_id username firstName lastName userPicture followers`
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const page = req.query.page || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const following = user.following.map((follower) => ({
      _id: follower._id,
      username: follower.username,
      firstName: follower.firstName,
      lastName: follower.lastName,
      userPicture: follower.userPicture,
      followers: follower.followers.length,
    }));

    const paginatedFollowing = following.slice(skip, skip + limit);

    res.status(200).json(paginatedFollowing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const isFollowing = async (req, res) => {
  try {
    const currentUser = req.user;

    const userToCheck = await User.findOne({ username: req.params.username });
    if (!userToCheck) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.includes(
      userToCheck._id.toString()
    );

    res.status(200).json({ isFollowing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const blockUnblockUser = async (req, res) => {
  try {
    const currentUser = await User.findOne({ username: req.body.username });
    const userToModify = await User.findOne({ username: req.params.username });

    if (!currentUser || !userToModify) {
      return res.status(404).json({ message: "User not found" });
    }

    const isBlocked = currentUser.blockedUsers.includes(userToModify._id);

    if (isBlocked) {
      currentUser.blockedUsers.pull(userToModify._id);
      userToModify.blockedBy.pull(currentUser._id);
      const chat = await Chat.findOne({
        members: { $all: [currentUser.username, userToModify.username] },
      });
      if (chat) {
        chat.allowMessage = true;
        await chat.save();
      }
      await currentUser.save();
      await userToModify.save();
      res.status(200).json({ status: 0 }); // unblocked
    } else {
      currentUser.blockedUsers.push(userToModify._id);
      userToModify.blockedBy.push(currentUser._id);
      userToModify.followers.pull(currentUser._id);
      userToModify.following.pull(currentUser._id);
      currentUser.following.pull(userToModify._id);
      currentUser.followers.pull(userToModify._id);

      const chat = await Chat.findOne({
        members: { $all: [currentUser.username, userToModify.username] },
      });
      if (chat) {
        chat.allowMessage = false;
        await chat.save();
      }

      await currentUser.save();
      await userToModify.save();
      res.status(200).json({ status: 1 }); // blocked
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const currentUser = await User.findOne({
      username: req.params.username,
    }).populate("blockedUsers", "username firstName lastName userPicture");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const blockedUsers = currentUser.blockedUsers;

    const page = req.query.page || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const paginatedBlockedUsers = blockedUsers.slice(skip, skip + limit);

    res.status(200).json(paginatedBlockedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const currentUser = await User.findOne({ username: req.params.username });
    const postToToggle = await Post.findById(req.params.postId);

    if (!currentUser || !postToToggle) {
      return res.status(404).json({ message: "User or post not found" });
    }

    const isBookmarked = currentUser.bookmarks.includes(postToToggle._id);

    if (isBookmarked) {
      currentUser.bookmarks = currentUser.bookmarks.filter(
        (postId) => postId.toString() !== postToToggle._id.toString()
      );
      await currentUser.save();
      res.status(200).json({ status: 0 }); // unbookmarked
    } else {
      currentUser.bookmarks.push(postToToggle._id);
      await currentUser.save();
      res.status(200).json({ status: 1 }); // bookmarked
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getBookmarkedPosts = async (req, res) => {
  try {
    const currentUser = await User.findOne({
      username: req.params.username,
    }).populate(
      "bookmarks",
      "_id username userId firstName lastName description postImage userPicture createdAt"
    );

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const blockedUserIds = currentUser.blockedUsers.map((userId) =>
      userId.toString()
    );
    const blockedByIds = currentUser.blockedBy.map((userId) =>
      userId.toString()
    );

    const page = req.query.page || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const bookmarkedPosts = currentUser.bookmarks
      .filter((post) => {
        return (
          !blockedUserIds.includes(post.userId) &&
          !blockedByIds.includes(post.userId)
        );
      })
      .reverse();

    const paginatedBookmarkedPosts = bookmarkedPosts.slice(skip, skip + limit);

    res.status(200).json(paginatedBookmarkedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getFindFriends,
  getSuggestedUsers,
  getUser,
  updateUser,
  updateUserPicture,
  followUser,
  getFollowing,
  getFollowers,
  isFollowing,
  blockUnblockUser,
  getBlockedUsers,
  toggleBookmark,
  getBookmarkedPosts,
  updatePassword,
};
