// scraper/test.ts
import { BaseScraper, getScrapingDoc } from "./base";
import { FukuEvent } from "../types/event";

// ==========================================
// 1. 福島市観光ノート用（ブログカード完全独立ループ版）
// ==========================================
class FukushimaKankoScraper implements BaseScraper {
  sourceName = "福島市観光ノート";
  targetUrl = "https://www.f-kankou.jp/event";

  async scrape(): Promise<Partial<FukuEvent>[]> {
    try {
      console.log(`\n1. [${this.sourceName}] 一覧ページから初期URLを収穫中...`);
      const $list = await getScrapingDoc(this.targetUrl);
      let targetUrls: string[] = [];

      $list("a.archive__link").each((_, element) => {
        const relativeUrl = $list(element).attr("href");
        if (relativeUrl) {
          const fullUrl = relativeUrl.startsWith("http") 
            ? relativeUrl 
            : `https://www.f-kankou.jp${relativeUrl}`;
          
          if (!targetUrls.includes(fullUrl)) {
            targetUrls.push(fullUrl);
          }
        }
      });

      console.log(`👉 初期URLを ${targetUrls.length} 件発見。深層クローリングを開始します...`);
      const events: Partial<FukuEvent>[] = [];
      // 修正後（環境変数から数値を安全に読み込む）
      const maxTestCount = process.env.MAX_SCRAPE_COUNT 
        ? parseInt(process.env.MAX_SCRAPE_COUNT, 10) 
        : 3;

      for (let i = 0; i < Math.min(targetUrls.length, maxTestCount); i++) {
        const url = targetUrls[i];
        console.log(`\n   ↳ 📄 [${i + 1}/${targetUrls.length}] ページを解析中: ${url}`);
        
        try {
          const $detail = await getScrapingDoc(url);
          const pageTitle = $detail("h1").text().trim();

          // 🌀【まとめページの深掘りロジック】
          if (pageTitle.includes("まとめ")) {
            console.log(`      💥 [まとめページを検知] 「${pageTitle}」から blogcard リストを個別に処理します...`);
            
            let childUrlCount = 0;

            // ✨【修正箇所】$$('div.blogcard') と同じリストを取得
            const blogCards = $detail("div.blogcard");

            // 各 div.blogcard 要素に対して、完全に独立したループを実行
            blogCards.each((_, cardElement) => {
              // 💡 修正の意図: $detail から探すのではなく、取得した cardElement の「直下のaタグ」をピンポイント指定
              // Cheerioのコンテキストを cardElement に完全に縛ります
              const href = $detail("a", cardElement).first().attr("href");
              
              if (href && href.includes("/event/")) {
                const fullChildUrl = href.startsWith("http") ? href : `https://www.f-kankou.jp${href}`;
                
                if (!targetUrls.includes(fullChildUrl)) {
                  targetUrls.push(fullChildUrl);
                  childUrlCount++;
                }
              }
            });

            console.log(`      💡 厳密抽出結果: 新たに ${childUrlCount} 件の個別イベントURLを検知しました。`);
            continue; 
          }

          // 📸 個別イベントの画像URL取得
          const rawImgUrl = $detail("figure.post__ec img").attr("src");
          let imageUrl = "";
          if (rawImgUrl) {
            imageUrl = rawImgUrl.startsWith("http") ? rawImgUrl : `https://www.f-kankou.jp${rawImgUrl}`;
          }

          // テーブルデータの自動回収辞書
          const tableData: { [key: string]: string } = {};
          $detail("table tr, .c-table tr").each((_, trElement) => {
            const thText = $detail(trElement).find("th").text().trim();
            const tdText = $detail(trElement).find("td").text().trim();
            if (thText && tdText) {
              tableData[thText] = tdText;
            }
          });

          const title = tableData["イベント名"] || pageTitle;
          const content = tableData["内容"] || "詳細は公式サイトをご確認ください。";
          const dateText = tableData["日時"] || "日程未定";
          const place = tableData["場所"] || "福島市内";

          if (title) {
            let category = "体験・展示";
            if (title.includes("マルシェ") || title.includes("食") || title.includes("フェス") || title.includes("SAKE") || title.includes("ほろ酔い")) {
              category = "グルメ";
            } else if (title.includes("音楽") || title.includes("コンサート") || title.includes("まつり") || title.includes("ピアノ")) {
              category = "音楽・フェス";
            }

            events.push({
              title,
              description: content,
              date: dateText,
              location: place,
              category: category,
              sourceUrl: url,
              ...({ imageUrl: imageUrl || "画像なし" } as any) 
            });
          }

          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (detailError) {
          console.error(`   ❌ ページの取得に失敗しました (${url}):`, detailError);
        }
      }

      return events;
    } catch (error) {
      console.error(`[${this.sourceName}] 一覧の取得失敗:`, error);
      return [];
    }
  }
}

// scraper/test.ts の CJMonmoScraper 以降を以下に丸ごと差し替えます

// ==========================================
// 2. CJ Monmo用（詳細ブロック精密抽出フェーズ）
// ==========================================
class CJMonmoScraper implements BaseScraper {
  sourceName = "CJ Monmo";
  targetUrl = "https://www.cjnavi.co.jp/event/"; 

  async scrape(): Promise<Partial<FukuEvent>[]> {
    try {
      console.log(`\n2. [${this.sourceName}] 一覧ページからイベントURLを収穫中...`);
      const $list = await getScrapingDoc(this.targetUrl);
      const targetUrls: string[] = [];

      const cards = $list("ul.cardContainer li a.card");
      cards.each((_, element) => {
        const href = $list(element).attr("href");
        if (href) {
          const fullUrl = href.startsWith("http") ? href : `https://www.cjnavi.co.jp${href}`;
          if (!targetUrls.includes(fullUrl)) {
            targetUrls.push(fullUrl);
          }
        }
      });

      console.log(`👉 一覧から ${targetUrls.length} 件のイベントURLを発見。深層クローリングを開始します...`);
      
      const finalEvents: Partial<FukuEvent>[] = [];
      // 修正後（環境変数から数値を安全に読み込む）
      const maxTestCount = process.env.MAX_SCRAPE_COUNT 
        ? parseInt(process.env.MAX_SCRAPE_COUNT, 10) 
        : 3;

      for (let i = 0; i < Math.min(targetUrls.length, maxTestCount); i++) {
        const url = targetUrls[i];
        console.log(`\n   ↳ 📄 [${i + 1}/${maxTestCount}] 詳細ページを解析中: ${url}`);
        
        try {
          const $detail = await getScrapingDoc(url);
          
          // 💡 修正の意図: .article-summary ブロックを基準点（コンテキスト）にしてスコープを絞り込みます
          const $summaryArea = $detail(".article-summary");

          // 1. タイトルの精密取得
          const title = $summaryArea.find(".article-categoryname").text().trim();

          // 2. 開催日・開催地の取得 (.article-categorysummary 内の ul.data の li リスト)
          const infoItems = $summaryArea.find(".article-categorysummary ul.data li");
          const dateText = $detail(infoItems.get(0)).text().trim() || "日程詳細は公式サイトをご確認ください";
          const place = $detail(infoItems.get(1)).text().trim() || "会場詳細は公式サイトをご確認ください";

          // 3. キャッチコピーや説明文の抽出
          const catchCopy = $summaryArea.find(".article-catchcopy").text().trim();
          const mainContent = $detail(".post-content, article").text().trim().substring(0, 120);
          const description = catchCopy ? `${catchCopy} / ${mainContent}...` : `${mainContent}...`;

          // 4. タグコンテナからジャンルや地域タグを配列で一括回収
          const tags: string[] = [];
          $summaryArea.find("ul.tagContainer a.tag_genre").each((_, tagElement) => {
            tags.push($detail(tagElement).text().trim());
          });

          // 5. 回収したタグとタイトルを組み合わせてカテゴリ判定
          let category = "体験・展示";
          const allTextForCategory = `${title} ${tags.join(" ")}`;
          if (allTextForCategory.includes("マルシェ") || allTextForCategory.includes("食") || allTextForCategory.includes("フェス") || allTextForCategory.includes("グルメ")) {
            category = "グルメ";
          } else if (allTextForCategory.includes("音楽") || allTextForCategory.includes("コンサート") || allTextForCategory.includes("まつり") || allTextForCategory.includes("ライブ")) {
            category = "音楽・フェス";
          } else if (allTextForCategory.includes("キッズ") || allTextForCategory.includes("子ども") || allTextForCategory.includes("恐竜")) {
            category = "ファミリー・キッズ";
          }

          if (title) {
            finalEvents.push({
              title: title,
              description: description.replace(/\s+/g, " "),
              date: dateText,
              location: place,
              category: category,
              sourceUrl: url,
              ...({ imageUrl: $detail(".post-content img, article img, .card-img").first().attr("src") || "画像なし" } as any)
            });
          }

          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (detailError) {
          console.error(`   ❌ ページの取得に失敗しました (${url}):`, detailError);
        }
      }

      return finalEvents;

    } catch (error) {
      console.error(`[${this.sourceName}] 巡回取得失敗:`, error);
      return [];
    }
  }
}

// ==========================================
// 3. テスト実行メイン処理（詳細データを出力するように拡張）
// ==========================================
async function runTestScraper() {
  console.log("🚀 === CJ Monmo 詳細深掘りクローリングテストを開始します ===");
  const scrapers = [new CJMonmoScraper()];

  for (const scraper of scrapers) {
    const result = await scraper.scrape();
    
    console.log(`\n--------------------------------------------------`);
    console.log(`✨ [${scraper.sourceName}] 完了: ${result.length} 件の詳細データを抽出！`);
    
    result.forEach((event, index) => {
      console.log(`\n🔥 [イベント情報 #${index + 1}]`);
      console.log(`【タイトル】: ${event.title}`);
      console.log(`【開 催 日】: ${event.date}`);
      console.log(`【開 催 地】: ${event.location}`);
      console.log(`【カテゴリ】: ${event.category}`);
      console.log(`【概  要】: ${event.description}`);
      console.log(`【U  R  L】: ${event.sourceUrl}`);
    });
  }
  console.log("\n✅ === すべてのテストが完了しました ===");
}

runTestScraper();