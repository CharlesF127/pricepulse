// agents/sites/goatSelectors.js

module.exports = {
  // Container that must exist before price elements show
  buyBarContainer: '[data-qa="buy_bar_item_desktop"]',

  // Selector for the title of the sneaker
  title: '[data-qa="product_name"]',

  // Selector for images on GOAT
  image: 'img[src*="image.goat.com"]',

  // Selector for the price of a specific size
  priceForSize: (size) => `[data-qa="buy_bar_price_size_${size}"]`,

  // Selector for the size label (ex: "10.5")
  sizeForSize: (size) => `[data-qa="buy_bar_size_${size}"]`,
};
