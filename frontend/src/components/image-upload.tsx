'use client';

import React, { useState, useCallback } from 'react';
import { uploadFile, getMediaFiles, deleteMediaFile } from '@/lib/api';
import { getMediaUrl } from '@/lib/media-utils';
import { MediaFile, MediaType } from '@/types/media';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, FileText, X, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImageUploadProps {
  onImageSelect?: (imageUrl: string) => void;
  showMediaLibrary?: boolean;
  allowedTypes?: MediaType[];
}

export function ImageUpload({ 
  onImageSelect, 
  showMediaLibrary = true,
  allowedTypes = [MediaType.Image, MediaType.Document]
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadMediaFiles = useCallback(async () => {
    if (!showMediaLibrary || mediaLoaded) return;
    
    setIsLoadingMedia(true);
    try {
      const files = await getMediaFiles();
      setMediaFiles(files.filter(file => allowedTypes.includes(file.type)));
      setMediaLoaded(true);
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setIsLoadingMedia(false);
    }
  }, [showMediaLibrary, mediaLoaded, allowedTypes]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const mediaFile = await uploadFile(file);
      setMediaFiles(prev => [mediaFile, ...prev]);
      
      if (onImageSelect && mediaFile.type === MediaType.Image) {
        const imageUrl = getMediaUrl(mediaFile.filePath);
        onImageSelect(imageUrl);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteMediaFile(fileId);
      setMediaFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getFileUrl = (mediaFile: MediaFile) => {
    return getMediaUrl(mediaFile.filePath);
  };

  const getFileIcon = (mediaFile: MediaFile) => {
    return mediaFile.type === MediaType.Image ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Media Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload New File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              accept={allowedTypes.includes(MediaType.Image) ? "image/*,.pdf,.doc,.docx" : "image/*"}
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            <Button
              disabled={isUploading}
              onClick={() => document.getElementById('file-upload')?.click()}
              size="sm"
            >
              {isUploading ? 'Uploading...' : 'Browse'}
            </Button>
          </div>
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </div>

        {/* Media Library Section */}
        {showMediaLibrary && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Media Library</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={loadMediaFiles}
                disabled={isLoadingMedia}
              >
                {isLoadingMedia ? 'Loading...' : 'Load Media'}
              </Button>
            </div>
            
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {mediaFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {file.type === MediaType.Image && (
                      <div className="aspect-video bg-muted rounded overflow-hidden">
                        <img
                          src={getFileUrl(file)}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {file.type === MediaType.Image ? 'Image' : 'Document'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(getFileUrl(file))}
                        className="text-xs p-1 h-6"
                      >
                        {copiedUrl === getFileUrl(file) ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      {onImageSelect && file.type === MediaType.Image && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onImageSelect(getFileUrl(file))}
                          className="text-xs h-6"
                        >
                          Insert
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}