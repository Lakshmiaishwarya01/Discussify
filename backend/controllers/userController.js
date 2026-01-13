const User = require("../models/User");
const Activity = require("../models/Activity");

exports.getProfile = (req, res, next) => {
  res.status(200).json({
    data: {
      user: req.user,
    },
  });
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

exports.updateProfile = async (req, res, next) => {
  try {
    const filteredBody = filterObj(req.body, "username", "bio");

    if (req.file) {
      filteredBody.photo = req.file.filename;
    }

    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      data: {
        user: updateUser,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(200).json({ message: "User Deactivated" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const activities = await Activity.find({ user: userId })
      .sort("-createdAt")
      .limit(50);

    const formattedActivity = activities.map((act) => ({
      _id: act._id,
      type: act.type,
      title: act.title,
      communityName: act.communityName,
      date: act.createdAt,
    }));

    res.status(200).json({
      results: formattedActivity.length,
      data: { activity: formattedActivity },
    });
  } catch (error) {
    next(error);
  }
};

exports.searchUsers = async (req, res, next) => {
    try {
        const searchTerm = req.query.search?.trim();
        
        if (!searchTerm) {
            return res.status(200).json({ results: 0, data: { users: [] } });
        }

        const query = {
            _id: { $ne: req.user.id }
        };

        // Add search conditions if search term exists
        if (searchTerm) {
            query.$or = [
                { username: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('username email photo')
            .limit(10);

        res.status(200).json({ results: users.length, data: { users } });
    } catch (error) {
        next(error);
    }
};