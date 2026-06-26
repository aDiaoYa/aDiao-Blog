/** 文章数据 */
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

/** 文章元数据（不含正文） */
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

/** 新闻条目 */
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

/** 新闻数据容器 */
export interface NewsData {
  updated: string;
  date: string;
  count: number;
  aiCount: number;
  feCount: number;
  items: NewsItem[];
}

/** 每日计划条目 */
export interface PlanItem {
  id: string;
  title: string;
  time: string;
  category: string;
  note: string;
  done: boolean;
  createdAt: number;
}

/** 每日计划数据 */
export interface PlanDayData {
  items: PlanItem[];
  summary: string;
}

/** 计划存储结构 */
export interface PlanStorage {
  [date: string]: PlanDayData;
}

/** 分类 */
export interface CategoryInfo {
  name: string;
  count: number;
}

/** 标签 */
export interface TagInfo {
  name: string;
  count: number;
}

/** 搜索条目 */
export interface SearchItem {
  title: string;
  url: string;
  text: string;
  tags: string[];
}
