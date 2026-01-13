const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'photo') {
      cb(null, 'public/img/users');
    } else if (file.fieldname === 'icon') {
      cb(null, 'public/img/communities');
    } else if (file.fieldname === 'resource') {
      cb(null, 'public/resources');
    } else {
      cb(null, 'public/img');
    }
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const prefix = file.fieldname === 'icon' ? 'community' : 'user';
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'photo' || file.fieldname === 'icon') {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;