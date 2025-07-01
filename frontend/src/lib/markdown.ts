import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

// Create a unified processor for markdown with GitHub Flavored Markdown support
const processor = remark()
  .use(remarkParse)
  .use(remarkGfm) // GitHub Flavored Markdown (tables, strikethrough, task lists, etc.)
  .use(remarkBreaks) // Convert line breaks to <br> tags
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

/**
 * Convert markdown content to HTML
 * @param markdown - The markdown content to process
 * @returns Promise<string> - The processed HTML content
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await processor.process(markdown);
    return result.toString();
  } catch (error) {
    console.error('Error processing markdown:', error);
    // Fallback to original content with basic line break formatting
    return markdown.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
  }
}

/**
 * Extract plain text from markdown content for previews
 * @param markdown - The markdown content
 * @param maxLength - Maximum length of the preview
 * @returns string - Plain text preview
 */
export function markdownToPlainText(markdown: string, maxLength: number = 150): string {
  // Remove markdown syntax including GFM features
  let text = markdown
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/~~(.*?)~~/g, '$1') // Strikethrough
    .replace(/`(.*?)`/g, '$1') // Inline code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1') // Images
    .replace(/>\s+(.*)/g, '$1') // Blockquotes
    .replace(/^[-*+]\s+/gm, '') // List items
    .replace(/^\d+\.\s+/gm, '') // Numbered lists
    .replace(/^- \[[ x]\]\s+/gm, '') // Task lists
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/\|.*?\|/g, '') // Tables
    .replace(/\n+/g, ' ') // Multiple newlines to space
    .trim();

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Check if content appears to be markdown
 * @param content - The content to check
 * @returns boolean - True if content likely contains markdown
 */
export function isMarkdown(content: string): boolean {
  const markdownPatterns = [
    /#{1,6}\s+/, // Headers
    /\*\*(.*?)\*\*/, // Bold
    /\*(.*?)\*/, // Italic
    /~~(.*?)~~/, // Strikethrough (GFM)
    /`(.*?)`/, // Inline code
    /\[(.*?)\]\(.*?\)/, // Links
    /!\[(.*?)\]\(.*?\)/, // Images
    />\s+/, // Blockquotes
    /^[-*+]\s+/m, // List items
    /^\d+\.\s+/m, // Numbered lists
    /^- \[[ x]\]\s+/m, // Task lists (GFM)
    /```/, // Code blocks
    /\|.*?\|/, // Tables (GFM)
    /---+/, // Horizontal rules
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
}
