export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  authorId: string;
  authorName: string;
  publishedDate: string;
  modifiedDate: string;
  status: number;
  scheduledDate: string | null;
  tags: string[];
  categories: string[];
  customUrl: string | null;
  assets: any[];
}

export interface CreatePostRequest {
  title: string;
  content: string;
  description: string;
  categories: string[];
  tags: string[];
  status: number; // 0 = Draft, 1 = Published, 2 = Archived
  customUrl?: string;
}

export interface CreatePostResponse extends BlogPost {}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BlogPostsResponse extends PaginatedResponse<BlogPost> {}

export type TagsResponse = Tag[];

export type CategoriesResponse = Category[];
