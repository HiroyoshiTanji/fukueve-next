// app/page.tsx
import { FukuEvent } from "@/types/event";
import fs from "fs";
import path from "path";
import Link from "next/link";

// データを読み込む関数
async function getEvents(): Promise<FukuEvent[]> {
  const filePath = path.join(process.cwd(), "data", "events.json");
  const jsonData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(jsonData);
}

const CATEGORIES = ["すべて", "グルメ", "体験・展示", "音楽・フェス"];

interface PageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    dateFilter?: string; // 'today' | 'tomorrow' | 'weekend'
  }>;
}

// 日付計算のヘルパー関数群 (2026年の現在時刻をベースに計算)
function getDateString(offset = 0): string {
  // 日本時間の今日をベースにするための簡易計算
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getWeekendDates(): string[] {
  const d = new Date();
  const day = d.getDay(); // 0: 日曜日, 6: 土曜日
  
  // 今週の土曜日と日曜日を計算
  const distanceToSaturday = 6 - day;
  const distanceToSunday = (7 - day) % 7;
  
  return [getDateString(distanceToSaturday), getDateString(distanceToSunday === 0 && day !== 0 ? 7 : distanceToSunday)];
}

export default async function Home({ searchParams }: PageProps) {
  const allEvents = await getEvents();
  const params = await searchParams;
  
  const currentCategory = params.category || "すべて";
  const searchQuery = params.search || "";
  const currentDateFilter = params.dateFilter || "";

  // 日付フィルターの基準日を取得
  const todayStr = getDateString(0);
  const tomorrowStr = getDateString(1);
  const [saturdayStr, sundayStr] = getWeekendDates();

  // データの検索・絞り込み
  const filteredEvents = allEvents.filter((event) => {
    // 1. カテゴリー絞り込み
    const matchesCategory = currentCategory === "すべて" || event.category === currentCategory;
    
    // 2. キーワード検索
    const matchesSearch = searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    // 3. 日付カレンダー絞り込み
    let matchesDate = true;
    if (currentDateFilter === "today") {
      matchesDate = event.date === todayStr;
    } else if (currentDateFilter === "tomorrow") {
      matchesDate = event.date === tomorrowStr;
    } else if (currentDateFilter === "weekend") {
      matchesDate = event.date === saturdayStr || event.date === sundayStr;
    }

    return matchesCategory && matchesSearch && matchesDate;
  });

  // 共通のURLパラメータ生成ヘルパー
  const createUrl = (cat: string, search: string, date: string) => {
    const parts = [];
    if (cat && cat !== "すべて") parts.push(`category=${cat}`);
    if (search) parts.push(`search=${search}`);
    if (date) parts.push(`dateFilter=${date}`);
    return parts.length > 0 ? `/?${parts.join("&")}` : "/";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダーエリア */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight">
            ふくイベ <span className="text-xs font-normal text-slate-500 ml-1">福島市のイベント情報</span>
          </Link>

          <form action="/" method="GET" className="w-full sm:w-72 flex gap-2">
            {currentCategory !== "すべて" && <input type="hidden" name="category" value={currentCategory} />}
            {currentDateFilter && <input type="hidden" name="dateFilter" value={currentDateFilter} />}
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="キーワードを入力..."
              className="w-full px-3 py-1.5 text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-hidden text-slate-800"
            />
            <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap">
              検索
            </button>
          </form>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* 日付クイックカレンダーフィルター */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">いつ開催？</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "全日程", value: "" },
              { label: "今日", value: "today" },
              { label: "明日", value: "tomorrow" },
              { label: "今週末", value: "weekend" },
            ].map((btn) => {
              const isSelected = currentDateFilter === btn.value;
              const url = createUrl(currentCategory, searchQuery, btn.value);
              return (
                <Link
                  key={btn.label}
                  href={url}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {btn.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* カテゴリータブ */}
        <div className="flex gap-2 border-b border-slate-200 pb-px mb-8 overflow-x-auto whitespace-nowrap scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = currentCategory === cat;
            const url = createUrl(cat, searchQuery, currentDateFilter);
            return (
              <Link
                key={cat}
                href={url}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isSelected
                    ? "border-emerald-600 text-emerald-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* 検索結果の件数表示 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            {currentCategory !== "すべて" ? `${currentCategory}の` : ""}イベント一覧
          </h2>
          {(searchQuery || currentDateFilter) && (
            <p className="text-xs text-slate-500 mt-0.5">
              条件に合うイベント: {filteredEvents.length} 件
            </p>
          )}
        </div>

        {/* イベントが1件もない場合の表示 */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-400 text-sm">該当するイベントが見つかりませんでした。</p>
            <Link href="/" className="text-xs text-emerald-600 font-medium mt-2 inline-block hover:underline">
              すべての条件をクリアにする
            </Link>
          </div>
        ) : (
          /* イベントカードの並び */
          <div className="grid gap-6 md:grid-cols-2">
            {filteredEvents.map((event) => (
              <Link 
                key={event.id} 
                href={`/events/${event.id}`}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between text-left cursor-pointer"
              >
                <div className="p-5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                    {event.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {event.description}
                  </p>
                </div>

                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-700 w-12">日時：</span>
                    <span>{event.date} {event.time}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-700 w-12">場所：</span>
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}