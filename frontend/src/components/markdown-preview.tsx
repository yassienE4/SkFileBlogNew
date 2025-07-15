'use client';

import React, { useState, useEffect, useRef } from 'react';
import { markdownToHtml, isMarkdown } from '@/lib/markdown';
import { MarkdownGuide } from '@/components/markdown-guide';
import { ImageUpload } from '@/components/image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageIcon, RefreshCw } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  onChange?: (content: string) => void;
  showPreview?: boolean;
  readonly?: boolean;
}

export function MarkdownPreview({ 
  content, 
  onChange, 
  showPreview = true, 
  readonly = false 
}: MarkdownPreviewProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [lastProcessedContent, setLastProcessedContent] = useState<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePreview = async (forceUpdate = false) => {
    if (activeTab === 'preview' && (forceUpdate || content !== lastProcessedContent)) {
      setIsProcessing(true);
      try {
        const html = await markdownToHtml(content);
        setPreviewHtml(html);
        setLastProcessedContent(content);
      } catch (error) {
        console.error('Error processing markdown:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const debouncedHandlePreview = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      handlePreview();
    }, 300); // 300ms debounce
  };

  // Effect to handle tab changes and content updates
  useEffect(() => {
    if (activeTab === 'preview') {
      if (content !== lastProcessedContent) {
        debouncedHandlePreview();
      }
    }
  }, [activeTab, content]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    if (readonly || !onChange) return;
    
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newContent = 
      content.substring(0, start) + 
      before + textToInsert + after + 
      content.substring(end);
    
    onChange(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertImage = (imageUrl: string) => {
    if (readonly || !onChange) return;
    
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Insert markdown image syntax
    const imageMarkdown = `![Image](${imageUrl})`;
    const newContent = 
      content.substring(0, start) + 
      imageMarkdown + 
      content.substring(end);
    
    onChange(newContent);
    setShowImageUpload(false);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + imageMarkdown.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const markdownToolbar = [
    { label: 'Bold', action: () => insertMarkdown('**', '**', 'bold text'), icon: 'B' },
    { label: 'Italic', action: () => insertMarkdown('*', '*', 'italic text'), icon: 'I' },
    { label: 'Code', action: () => insertMarkdown('`', '`', 'code'), icon: '</>' },
    { label: 'Link', action: () => insertMarkdown('[', '](url)', 'link text'), icon: '🔗' },
    { label: 'Quote', action: () => insertMarkdown('> ', '', 'quote'), icon: '"' },
    { label: 'List', action: () => insertMarkdown('- ', '', 'list item'), icon: '•' },
    { label: 'Header', action: () => insertMarkdown('## ', '', 'header'), icon: 'H' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Content</CardTitle>
          <div className="flex items-center gap-2">
            {isMarkdown(content) && (
              <Badge variant="secondary" className="text-xs">
                Markdown Detected
              </Badge>
            )}
            {showPreview && (
              <div className="flex items-center gap-2">
                <div className="flex border rounded-md">
                  <Button
                    type="button"
                    variant={activeTab === 'edit' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('edit')}
                    className="rounded-r-none"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={activeTab === 'preview' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('preview')}
                    className="rounded-l-none"
                  >
                    Preview
                  </Button>
                </div>
                {activeTab === 'preview' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(true)}
                    disabled={isProcessing}
                    title="Refresh preview"
                  >
                    <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readonly && (
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex flex-wrap gap-2">
              {markdownToolbar.map((tool) => (
                <Button
                  key={tool.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={tool.action}
                  title={tool.label}
                  className="h-8 w-8 p-0"
                >
                  {tool.icon}
                </Button>
              ))}
              
              {/* Image Upload Button */}
              <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Insert Image"
                    className="h-8 w-8 p-0"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Insert Image</DialogTitle>
                  </DialogHeader>
                  <ImageUpload 
                    onImageSelect={insertImage}
                    showMediaLibrary={true}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <MarkdownGuide />
          </div>
        )}
        
        {activeTab === 'edit' ? (
          <Textarea
            value={content}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Write your content here... You can use Markdown syntax!"
            className="min-h-[400px] font-mono"
            readOnly={readonly}
          />
        ) : (
          <div className="min-h-[400px] border rounded-md p-4">
            {isProcessing ? (
              <div className="flex items-center justify-center h-32">
                <div>Processing markdown...</div>
              </div>
            ) : (
              <div 
                className="prose prose-lg dark:prose-invert max-w-none blog-content"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
