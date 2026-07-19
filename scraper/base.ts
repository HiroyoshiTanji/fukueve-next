// scraper/base.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { FukuEvent } from "../types/event";

// 新しいサイトを追加するときは、この約束事（インターフェース）に従って作ります
export interface BaseScraper {
  sourceName: string;
  targetUrl: string;
  scrape(): Promise<Partial<FukuEvent>[]>;
}

// サイトのHTMLを取得するための共通ヘルパー関数
export async function getScrapingDoc(url: string): Promise<cheerio.CheerioAPI> {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  return cheerio.load(data);
}