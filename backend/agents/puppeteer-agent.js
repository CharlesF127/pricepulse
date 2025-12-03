// agents/puppeteer-agent.js
// Currently: GOAT implementation + dispatcher. Later: add StockX, Nike, etc.

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const UserAgent = require("user-agents");
const goatSelectors = require("./sites/goatSelectors");
require("dotenv").config();

// Apply the stealth plugin
puppeteer.use(StealthPlugin());

// Helper delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Extracts and converts a raw price string (e.g., "$423", "$1,234.50") to a numeric float.
 */
function extractNumericPrice(raw) {
  if (!raw) return null;
  const match = raw.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(/,/g, "")) : null;
}

/**
 * Standardized result shape for scrapers
 */
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
 * GOAT-specific implementation
 * @param {string} url
 * @param {string|number} size
 * @param {number} retries
 * @returns {Promise<ReturnType<typeof buildResult>>}
 */
async function scrapeGoat({ url, size, retries = 3 }) {
  const userAgent = new UserAgent();
  let browser;
  let attempt = 0;

  while (attempt < retries) {
    attempt++;
    console.log(`📥 [GOAT] Scraping attempt ${attempt}/${retries}: ${url} for size: ${size}`);

    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--window-size=1920,1080",
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent(userAgent.toString());
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

      await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
      await delay(3000);

      console.log(`🕒 Waiting for buy bar container: ${goatSelectors.buyBarContainer}`);
      await page.waitForSelector(goatSelectors.buyBarContainer, { timeout: 60000 });

      // Gather all available prices for debugging / error messages
      const availablePricesRaw = await page.evaluate(() => {
        const priceElements = document.querySelectorAll('[data-qa^="buy_bar_price_size_"]');
        const prices = [];
        priceElements.forEach((el) => {
          const qaAttribute = el.getAttribute("data-qa");
          const sizeMatch = qaAttribute && qaAttribute.match(/size_([\d\.]+)/);
          if (sizeMatch && sizeMatch[1]) {
            prices.push({
              size: sizeMatch[1],
              rawPrice: el.textContent ? el.textContent.trim() : null,
            });
          }
        });
        return prices;
      });

      console.log("🧪 [GOAT] Available prices on page:", availablePricesRaw);

      const priceSelector = goatSelectors.priceForSize(size);
      const sizeSelector = goatSelectors.sizeForSize(size);

      const specificPriceElementExists = await page.$(priceSelector);

      if (!specificPriceElementExists) {
        console.log(
          `⚠️ [GOAT] Price element for size ${size} not found on attempt ${attempt}.`
        );
        await browser.close();

        if (attempt < retries) {
          console.log("🔁 Retrying in 5 seconds...");
          await delay(5000);
          continue;
        }

        return buildResult({
          success: false,
          error: `Price not found for size ${size} after ${retries} attempts.`,
          availablePrices: availablePricesRaw.map(
            (p) => `size_${p.size}: ${p.rawPrice || "N/A"}`
          ),
        });
      }

      console.log(`🕒 [GOAT] Waiting for specific size price: ${priceSelector}`);
      await page.waitForSelector(priceSelector, { visible: true, timeout: 30000 });
      await page.waitForSelector(sizeSelector, { visible: true, timeout: 10000 });

      const extracted = await page.evaluate(
        (priceSel, sizeSel, selectors) => {
          const priceEl = document.querySelector(priceSel);
          const sizeEl = document.querySelector(sizeSel);
          const titleEl = document.querySelector(selectors.title);
          const imageEl = document.querySelector(selectors.image);

          return {
            priceText: priceEl ? priceEl.textContent?.trim() : null,
            sizeText: sizeEl ? sizeEl.textContent?.trim() : null,
            title: titleEl ? titleEl.textContent?.trim() : "No Title Found",
            image: imageEl ? imageEl.src : null,
          };
        },
        priceSelector,
        sizeSelector,
        goatSelectors
      );

      const numericPrice = extractNumericPrice(extracted.priceText);

      if (numericPrice === null) {
        console.error(
          `🚫 [GOAT] Failed to parse numeric price from "${extracted.priceText}" for size ${size} on attempt ${attempt}.`
        );

        await browser.close();

        if (attempt < retries) {
          console.log("🔁 Retrying in 5 seconds...");
          await delay(5000);
          continue;
        }

        return buildResult({
          success: false,
          error: `Failed to parse numeric price for size ${size} after ${retries} attempts.`,
          availablePrices: availablePricesRaw.map(
            (p) => `size_${p.size}: ${p.rawPrice || "N/A"}`
          ),
        });
      }

      await browser.close();

      console.log(`🎉 [GOAT] Successfully scraped price for size ${size} on attempt ${attempt}!`);
      return buildResult({
        success: true,
        price: numericPrice,
        rawPrice: extracted.priceText,
        size: extracted.sizeText,
        title: extracted.title,
        image: extracted.image,
        error: null,
        availablePrices: availablePricesRaw.map(
          (p) => `size_${p.size}: ${p.rawPrice || "N/A"}`
        ),
      });
    } catch (err) {
      console.error(`🚫 [GOAT] Error during scraping attempt ${attempt}: ${err.message}`);

      try {
        if (browser) {
          await browser.close();
        }
      } catch (closeErr) {
        console.warn("⚠️ [GOAT] Error closing browser:", closeErr.message);
      }

      if (attempt < retries) {
        console.log("🔁 Retrying in 5 seconds...");
        await delay(5000);
      } else {
        // Last failure → one more quick attempt to get available prices for a better message
        let finalAvailablePrices = [];
        try {
          const tempBrowser = await puppeteer.launch({ headless: "new" });
          const tempPage = await tempBrowser.newPage();
          await tempPage.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          finalAvailablePrices = await tempPage.evaluate(() => {
            const priceElements = document.querySelectorAll('[data-qa^="buy_bar_price_size_"]');
            const prices = [];
            priceElements.forEach((el) => {
              const qaAttribute = el.getAttribute("data-qa");
              const sizeMatch = qaAttribute && qaAttribute.match(/size_([\d\.]+)/);
              if (sizeMatch && sizeMatch[1]) {
                prices.push(
                  `size_${sizeMatch[1]}: ${el.textContent ? el.textContent.trim() : "N/A"}`
                );
              }
            });
            return prices;
          });
          await tempBrowser.close();
        } catch (tempError) {
          console.warn(
            "⚠️ [GOAT] Could not get available prices for final error message:",
            tempError.message
          );
        }

        return buildResult({
          success: false,
          error: `Scraping failed after ${retries} attempts: ${err.message}`,
          availablePrices: finalAvailablePrices,
        });
      }
    }
  }
}

/**
 * Generic dispatcher for scraping a product.
 * For now, only supports GOAT but is ready for 'stockx', 'nike', etc.
 *
 * @param {object} params
 * @param {string} params.url
 * @param {string} params.site  e.g. "goat"
 * @param {string|number} params.size
 * @param {number} [params.retries]
 */
async function scrapeProduct({ url, site, size, retries = 3 }) {
  if (!url) throw new Error("scrapeProduct: 'url' is required");
  if (!site) throw new Error("scrapeProduct: 'site' is required");

  const normalizedSite = site.toLowerCase();

  switch (normalizedSite) {
    case "goat":
      return scrapeGoat({ url, size, retries });

    // case "stockx":
    //   return scrapeStockX({ url, size, retries });

    default:
      return buildResult({
        success: false,
        error: `Unsupported site: ${site}`,
      });
  }
}

module.exports = {
  scrapeProduct,
};
