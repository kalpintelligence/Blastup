import path from 'path';
import { env } from '../config/env';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  category?: 'image' | 'video' | 'audio' | 'document';
}

export function validateFile(
  mimetype: string,
  size: number,
  filename: string
): FileValidationResult {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return { valid: false, error: `File type ${mimetype} is not allowed` };
  }

  // Check file size
  if (size > env.MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${env.MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }

  // Check for path traversal in filename
  const basename = path.basename(filename);
  if (basename !== filename || filename.includes('..')) {
    return { valid: false, error: 'Invalid filename' };
  }

  // Double-check: extension matches MIME type
  const ext = path.extname(filename).toLowerCase();
  const extMimeMap: Record<string, string[]> = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.webp': ['image/webp'],
    '.mp4': ['video/mp4'],
    '.mov': ['video/quicktime'],
    '.webm': ['video/webm'],
    '.mp3': ['audio/mpeg'],
    '.wav': ['audio/wav'],
    '.ogg': ['audio/ogg'],
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.txt': ['text/plain'],
    '.csv': ['text/csv'],
  };

  if (ext && extMimeMap[ext] && !extMimeMap[ext].includes(mimetype)) {
    return { valid: false, error: 'File extension does not match content type' };
  }

  // Determine category
  let category: 'image' | 'video' | 'audio' | 'document' = 'document';
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) category = 'image';
  else if (ALLOWED_VIDEO_TYPES.includes(mimetype)) category = 'video';
  else if (ALLOWED_AUDIO_TYPES.includes(mimetype)) category = 'audio';

  return { valid: true, category };
}
