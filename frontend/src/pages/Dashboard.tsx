/**
 * Robust Puppeteer Scraper for GOAT
 * Supports: retries, alternate selectors, better logging, Render compatibility
 */

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const UserAgent = require("user-agents");
const goatSelectors = require("./sites/goatSelectors");
require("dotenv").config();

puppeteer.use(StealthPlugin());

// Delay helper
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/** Normalize size: convert 10.0 → 10, correct decimal formats */
function normalizeSize(size) {
  if (!size) return size;
  return String(size).replace(/^(\d+)\.0$/, "$1");
}

/** Convert "$230" or "$1,240.50" → 230 or 1240.50 */
function extractNumericPrice(raw) {
  if (!raw) return null;
  const match = raw.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(/,/g, "")) : null;
}

function buildResult({
  success,
  price = null,
  rawPrice = null,
  size = null,
  title = null,
  image = null,
  error = null,
  availablePrices = [],
}) {
  return {
    success,
    price,
    rawPrice,
    size,
    title,
    image,
    error,
    availablePrices,
  };
}

/**
 * MAIN GOAT SCRAPER
 */
async function scrapeGoat({ url, size, retries = 3 }) {
  let attempt = 0;
  size = normalizeSize(size);

  while (attempt < retries) {
    attempt++;
    console.log(
      `📥 [GOAT] Attempt ${attempt}/${retries} — URL: ${url} | Size: ${size}`
    );

    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
          "--window-size=1920,1080",
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent(new UserAgent().toString());
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

      // GOAT sometimes redirects; enable failure handling
      await page.setDefaultNavigationTimeout(90000);

      console.log("▶️ Navigating to page...");
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // Additional wait to let dynamic GOAT UI load
      await delay(4000);

      // Primary selector
      try {
        console.log(`⏳ Waiting for main container: ${goatSelectors.buyBarContainer}`);
        await page.waitForSelector(goatSelectors.buyBarContainer, {
          timeout: 45000,
        });
      } catch (err) {
        console.warn("⚠️ GOAT UI did not load the buy bar. Retrying...");
        throw new Error("GOAT buy bar not found");
      }

      // Extract all available size/price pairs
      const availablePricesRaw = await page.evaluate(() => {
        const nodes = document.querySelectorAll('[data-qa^="buy_bar_price_size_"]');
        return Array.from(nodes).map((el) => {
          const qa = el.getAttribute("data-qa");
          const sizeMatch = qa?.match(/size_([\d\.]+)/);
          return {
            size: sizeMatch?.[1],
            rawPrice: el.textContent?.trim() || null,
          };
        });
      });

      console.log("🧪 Available Prices:", availablePricesRaw);

      // Ensure the size exists
      const target = availablePricesRaw.find((p) => p.size === size);
      if (!target) {
        console.log(`❌ Size ${size} not found. Retrying...`);

        if (attempt < retries) {
          await delay(5000);
          continue;
        }

        return buildResult({
          success: false,
          error: `Size ${size} not found on GOAT.`,
          availablePrices: availablePricesRaw,
        });
      }

      // Use selectors
      const priceSelector = goatSelectors.priceForSize(size);
      const sizeSelector = goatSelectors.sizeForSize(size);

      console.log("⏳ Waiting for price element:", priceSelector);
      await page.waitForSelector(priceSelector, { visible: true, timeout: 30000 });

      const extracted = await page.evaluate(
        (priceSel, sizeSel, selectors) => {
          const priceEl = document.querySelector(priceSel);
          const sizeEl = document.querySelector(sizeSel);
          const titleEl = document.querySelector(selectors.title);
          const imageEl = document.querySelector(selectors.image);

          return {
            priceText: priceEl?.textContent?.trim() || null,
            sizeText: sizeEl?.textContent?.trim() || null,
            title: titleEl?.textContent?.trim() || "No Title Found",
            image: imageEl?.src || null,
          };
        },
        priceSelector,
        sizeSelector,
        goatSelectors
      );

      const numericPrice = extractNumericPrice(extracted.priceText);

      if (!numericPrice) {
        console.log(
          `❌ Could not extract numeric price from "${extracted.priceText}". Retrying...`
        );

        if (attempt < retries) {
          await delay(5000);
          continue;
        }

        return buildResult({
          success: false,
          error: `Failed to extract price for size ${size}.`,
          availablePrices: availablePricesRaw,
        });
      }

      await browser.close();

      console.log("🎉 Successfully scraped price:", numericPrice);
      return buildResult({
        success: true,
        price: numericPrice,
        rawPrice: extracted.priceText,
        size: extracted.sizeText,
        title: extracted.title,
        image: extracted.image,
        availablePrices: availablePricesRaw,
      });
    } catch (err) {
      console.error(`🚫 Scrape error attempt ${attempt}:`, err.message);

      if (browser) {
        try {
          await browser.close();
        } catch {}
      }

      if (attempt < retries) {
        console.log("🔁 Retrying in 6 seconds...");
        await delay(6000);
      } else {
        return buildResult({
          success: false,
          error: `GOAT scraping failed after ${retries} attempts: ${err.message}`,
        });
      }
    }
  }
}

/**
 * DISPATCHER — supports multiple sites
 */
async function scrapeProduct({ url, site, size, retries = 3 }) {
  if (!url) throw new Error("scrapeProduct: 'url' required");
  if (!site) throw new Error("scrapeProduct: 'site' required");

  site = site.toLowerCase();

  switch (site) {
    case "goat":
      return scrapeGoat({ url, size, retries });

    default:
      return buildResult({
        success: false,
        error: `Unsupported site: ${site}`,
      });
  }
}

module.exports = { scrapeProduct };
