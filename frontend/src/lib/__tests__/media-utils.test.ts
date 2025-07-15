import { getMediaUrl, extractFilePathFromUrl, isMediaUrl } from '@/lib/media-utils';

// Test the media utility functions
describe('Media Utils', () => {
  test('getMediaUrl should generate correct proxy URLs', () => {
    const filePath = 'uploads/image.jpg';
    const url = getMediaUrl(filePath);
    
    // Should use the frontend domain for proxy
    expect(url).toContain('/api/media/');
    expect(url).toContain('uploads/image.jpg');
  });

  test('extractFilePathFromUrl should extract file path from proxy URL', () => {
    const proxyUrl = 'http://localhost:3000/api/media/uploads/image.jpg';
    const filePath = extractFilePathFromUrl(proxyUrl);
    
    expect(filePath).toBe('uploads/image.jpg');
  });

  test('extractFilePathFromUrl should extract file path from legacy URL', () => {
    const legacyUrl = 'https://old-ngrok-url.ngrok.io/media/uploads/image.jpg';
    const filePath = extractFilePathFromUrl(legacyUrl);
    
    expect(filePath).toBe('uploads/image.jpg');
  });

  test('isMediaUrl should identify media URLs', () => {
    expect(isMediaUrl('http://localhost:3000/api/media/uploads/image.jpg')).toBe(true);
    expect(isMediaUrl('https://old-ngrok-url.ngrok.io/media/uploads/image.jpg')).toBe(true);
    expect(isMediaUrl('http://localhost:3000/api/posts')).toBe(false);
  });
});
