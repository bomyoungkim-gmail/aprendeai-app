
export interface TocItem {
  id: string;
  title: string;
  pageNumber?: number; // For PDF
  timestamp?: number; // For Video/Audio
  level: number; // 0, 1, 2
  children?: TocItem[];
}

export const MOCK_TOC: TocItem[] = [
  {
    id: '1',
    title: 'Introduction',
    pageNumber: 1,
    level: 0,
    children: [
       { id: '1.1', title: 'Overview', pageNumber: 2, level: 1 },
       { id: '1.2', title: 'Background', pageNumber: 3, level: 1 }
    ]
  },
  {
    id: '2',
    title: 'Core Concepts',
    pageNumber: 5,
    level: 0,
    children: [
       { id: '2.1', title: 'The Model', pageNumber: 6, level: 1 },
       { id: '2.2', title: 'Implementation', pageNumber: 10, level: 1 }
    ]
  }
];
