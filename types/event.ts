// types/event.ts

export interface FukuEvent {
  id: string;            // イベントごとに固有のID（例: "event-001"）
  title: string;         // イベント名
  description: string;   // 詳細説明
  date: string;          // 開催日（例: "2026-06-01"）
  time?: string;         // 開催時間（任意項目。なくてもOK）
  location: string;      // 開催場所（例: "四季の里", "コラッセふくしま"）
  category: string;      // カテゴリー（例: "お祭り", "グルメ", "フリーマーケット"）
  imageUrl?: string;     // 画像のURL（後ほど設定するので、今はなくてもOK）
  sourceUrl?: string;    // 公式サイトなどのリンク先URL（任意）
}