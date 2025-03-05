import { diskStorage } from 'multer';
import { extname, join } from 'path';

// Set upload path to be in project root directory
const uploadPath = join(process.cwd(), 'uploads');

export const multerConfig = {
    storage: diskStorage({
        destination: (req, file, callback) => {
            callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
    }),
    fileFilter: (req, file, callback) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
            callback(null, true);
        } else {
            callback(new Error('Only image and PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
};
