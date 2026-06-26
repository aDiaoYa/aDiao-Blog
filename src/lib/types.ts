export interface Post {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  categories: string[];
  content: string;
  excerpt?: string;
  abbrlink?: string;
  visibility?: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  categories: string[];
  excerpt: string;
  abbrlink?: string;
  visibility?: string;
}

export interface NewsItem {
  title: string;
  titleZh: string;
  link: string;
  source: string;
  tags: string[];
  date: string;
  summary: string;
  score: number;
}

export interface NewsData {
  updated: string;
  date: string;
  count: number;
  aiCount: number;
  feCount: number;
  items: NewsItem[];
}

export interface PlanItem {
  id: string;
  title: string;
  time: string;
  category: string;
  note: string;
  done: boolean;
  createdAt: number;
}

export interface PlanDayData {
  items: PlanItem[];
  summary: string;
}

export interface PlanStorage {
  [date: string]: PlanDayData;
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface SearchItem {
  title: string;
  url: string;
  text: string;
  tags: string[];
}
