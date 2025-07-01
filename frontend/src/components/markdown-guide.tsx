'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

export function MarkdownGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const markdownExamples = [
    {
      category: "Headers",
      examples: [
        { syntax: "# Header 1", description: "Large header" },
        { syntax: "## Header 2", description: "Medium header" },
        { syntax: "### Header 3", description: "Small header" },
      ]
    },
    {
      category: "Text Formatting",
      examples: [
        { syntax: "**bold text**", description: "Bold text" },
        { syntax: "*italic text*", description: "Italic text" },
        { syntax: "~~strikethrough~~", description: "Strikethrough text" },
        { syntax: "`inline code`", description: "Inline code" },
      ]
    },
    {
      category: "Lists",
      examples: [
        { syntax: "- Item 1\n- Item 2", description: "Bullet list" },
        { syntax: "1. First\n2. Second", description: "Numbered list" },
        { syntax: "- [ ] Todo\n- [x] Done", description: "Task list" },
      ]
    },
    {
      category: "Links & Images",
      examples: [
        { syntax: "[Link text](https://example.com)", description: "Link" },
        { syntax: "![Alt text](image.jpg)", description: "Image" },
      ]
    },
    {
      category: "Other",
      examples: [
        { syntax: "> Blockquote", description: "Quote block" },
        { syntax: "```\ncode block\n```", description: "Code block" },
        { syntax: "---", description: "Horizontal rule" },
        { syntax: "| Col 1 | Col 2 |\n|-------|-------|\n| Data  | Data  |", description: "Table" },
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          📖 Markdown Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Markdown Syntax Guide</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {markdownExamples.map((section) => (
            <Card key={section.category}>
              <CardHeader>
                <CardTitle className="text-lg">{section.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.examples.map((example, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          {example.description}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Example
                        </Badge>
                      </div>
                      <code className="block bg-muted p-2 rounded text-sm font-mono whitespace-pre-wrap">
                        {example.syntax}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Use the toolbar buttons above to quickly insert markdown syntax</p>
              <p>• Switch to the Preview tab to see how your content will look</p>
              <p>• Your content is automatically detected as markdown if it contains markdown syntax</p>
              <p>• Both markdown and plain text are supported in posts</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
