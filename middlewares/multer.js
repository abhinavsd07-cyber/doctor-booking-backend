import multer from "multer";

const storage = multer.diskStorage({
    // We specify a filename with a timestamp to prevent overwriting files with the same name
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

export default upload;