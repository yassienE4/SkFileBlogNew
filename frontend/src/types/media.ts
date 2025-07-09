export interface MediaFile {
  id: string;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedDate: string;
  type: MediaType;
  imageMetadata?: ImageMetadata;
}

export enum MediaType {
  Image = 0,
  Document = 1,
  Other = 2
}

export interface ImageMetadata {
  width: number;
  height: number;
  resizedVersions: Record<string, string>;
}

export interface MediaUploadResponse {
  success: boolean;
  data?: MediaFile;
  message?: string;
}