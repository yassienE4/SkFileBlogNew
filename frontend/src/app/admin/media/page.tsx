'use client';

import React, { useState, useEffect } from 'react';
import { getMediaFiles, deleteMediaFile, BASE_URL } from '@/lib/api';
import { getAuthTokenClient } from '@/lib/auth-client';
import { MediaFile, MediaType } from '@/types/media';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/image-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Trash2, Download, Copy, Check, Image as ImageIcon, FileText } from 'lucide-react';
import AdminRoute from '@/components/admin-route';

function MediaManagementContent() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'images' | 'documents'>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadMediaFiles();
  }, []);

  useEffect(() => {
    let filtered = mediaFiles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(file => 
        selectedType === 'images' ? file.type === MediaType.Image : file.type === MediaType.Document
      );
    }

    setFilteredFiles(filtered);
  }, [mediaFiles, searchTerm, selectedType]);

  const loadMediaFiles = async () => {
    try {
      const authToken = getAuthTokenClient();
      if (!authToken) throw new Error('No authentication token found');

      const files = await getMediaFiles(authToken);
      setMediaFiles(files);
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const authToken = getAuthTokenClient();
      if (!authToken) throw new Error('No authentication token found');

      await deleteMediaFile(fileId, authToken);
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
    return `${BASE_URL}/media/${mediaFile.filePath}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadFile = (mediaFile: MediaFile) => {
    const url = getFileUrl(mediaFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = mediaFile.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Media Management</h1>
        <p className="text-muted-foreground">
          Manage uploaded images and documents
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedType('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={selectedType === 'images' ? 'default' : 'outline'}
            onClick={() => setSelectedType('images')}
            size="sm"
          >
            Images
          </Button>
          <Button
            variant={selectedType === 'documents' ? 'default' : 'outline'}
            onClick={() => setSelectedType('documents')}
            size="sm"
          >
            Documents
          </Button>
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
            </DialogHeader>
            <ImageUpload 
              showMediaLibrary={false}
              onImageSelect={() => {
                loadMediaFiles();
                setShowUploadDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div>Loading media files...</div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No files match your search' : 'No media files found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* File Preview */}
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {file.type === MediaType.Image ? (
                    <img
                      src={getFileUrl(file)}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {file.type === MediaType.Image ? (
                      <ImageIcon className="h-4 w-4 text-blue-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-600" />
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {file.type === MediaType.Image ? 'Image' : 'Document'}
                    </Badge>
                  </div>
                  
                  <h3 className="font-medium text-sm truncate" title={file.fileName}>
                    {file.fileName}
                  </h3>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{formatFileSize(file.fileSize)}</div>
                    <div>{formatDate(file.uploadedDate)}</div>
                    {file.imageMetadata && (
                      <div>{file.imageMetadata.width}×{file.imageMetadata.height}</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getFileUrl(file))}
                    className="flex-1"
                  >
                    {copiedUrl === getFileUrl(file) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(file)}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MediaManagementPage() {
  return (
    <AdminRoute>
      <MediaManagementContent />
    </AdminRoute>
  );
}
