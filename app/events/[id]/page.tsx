// app/events/[id]/page.tsx
import { FukuEvent } from "@/types/event";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";

// 全データを取得する共通関数
async function getEvents(): Promise<FukuEvent[]> {
  const filePath = path.join(process.cwd(), "data", "events.json");
  const jsonData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(jsonData);
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const events = await getEvents();
  
  // URLのIDと一致するイベントを探す
  const event = events.find((e) => e.id === id);

  // もしイベントが見つからなかったら404エラー画面を出す
  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight">
            ふくイベ <span className="text-xs font-normal text-slate-500 ml-1">福島市のイベント情報</span>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <Link 
          href="/" 
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-6 inline-flex items-center gap-1 hover:underline"
        >
          ← イベント一覧へ戻る
        </Link>

        {/* メインカード */}
        <article className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
          {/* カテゴリバッジ */}
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
            {event.category}
          </span>

          {/* イベントタイトル */}
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-snug">
            {event.title}
          </h1>

          {/* 基本情報エリア */}
          <div className="bg-slate-50 rounded-xl p-4 md:p-6 mb-8 border border-slate-100 space-y-3 text-sm md:text-base">
            <div className="flex border-b border-slate-200/60 pb-3">
              <span className="font-semibold text-slate-700 w-20 shrink-0">開催日</span>
              <span className="text-slate-800">{event.date}</span>
            </div>
            {event.time && (
              <div className="flex border-b border-slate-200/60 pb-3">
                <span className="font-semibold text-slate-700 w-20 shrink-0">時間</span>
                <span className="text-slate-800">{event.time}</span>
              </div>
            )}
            <div className="flex">
              <span className="font-semibold text-slate-700 w-20 shrink-0">会場</span>
              <span className="text-slate-800">{event.location}</span>
            </div>
          </div>

          {/* 詳細説明 */}
          <div className="prose max-w-none">
            <h3 className="text-base font-bold text-slate-900 mb-3 border-l-4 border-emerald-500 pl-2">
              イベント詳細
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}