// src/common/config/multer.config.ts

import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

// Helper function to ensure directory exists
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// --- THIS IS THE FINAL FIX ---
// The destination now correctly points to the 'uploads' directory,
// which matches the configuration in your main.ts file.
const uploadsRoot = resolve('./uploads');
const driverDocDestination = resolve(uploadsRoot, 'driver-documents');
const selfieDestination = resolve(uploadsRoot, 'profile-photos');

export const driverDocumentMulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      ensureDir(driverDocDestination);
      cb(null, driverDocDestination);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      const extension = extname(file.originalname);
      cb(null, `${uniqueSuffix}${extension}`);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`Unsupported file type: ${extname(file.originalname)}. Only JPG, PNG, and PDF are allowed.`), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB limit
  },
};

export const selfieMulterOptions = {
    storage: diskStorage({
      destination: (req, file, cb) => {
        ensureDir(selfieDestination);
        cb(null, selfieDestination);
      },
      filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            cb(null, true);
        } else {
            cb(new BadRequestException(`Unsupported file type for selfie: ${extname(file.originalname)}. Only JPG and PNG are allowed.`), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 5, // 5 MB
    },
};