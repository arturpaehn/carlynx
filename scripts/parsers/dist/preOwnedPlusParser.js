"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPreOwnedPlus = syncPreOwnedPlus;
var puppeteer_1 = __importDefault(require("puppeteer"));
var supabase_js_1 = require("@supabase/supabase-js");
var BASE_URL = 'https://www.preownedplus.com';
var INVENTORY_URL = "".concat(BASE_URL, "/inventory");
var SOURCE = 'preowned_plus';
var COMPANY_PHONE = '(210) 951-5575';
var COMPANY_EMAIL = null; // No email on website
var CITY = 'San Antonio';
var STATE = 'TX';
// Get Supabase client
function getSupabase(url, key) {
    var supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL;
    var supabaseKey = key || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials missing: url=".concat(!!supabaseUrl, ", key=").concat(!!supabaseKey));
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
// Fetch image from vehicle detail page
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchImageFromDetailPage(url, browser) {
    return __awaiter(this, void 0, void 0, function () {
        var page, imageUrl, error_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    page = null;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 12]);
                    console.log('🔗 DEBUG: Opening detail page:', url);
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _b.sent();
                    return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })];
                case 3:
                    _b.sent();
                    // Wait a bit for lazy-loaded images
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 4:
                    // Wait a bit for lazy-loaded images
                    _b.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            // Debug logging
                            var allImages = document.querySelectorAll('img');
                            console.log('🔍 DEBUG: Total images on page:', allImages.length);
                            // First, try to find ProMax inventory images (most reliable for this site)
                            var promaxImages = Array.from(document.querySelectorAll('img[src*="imageserver.promaxinventory.com"]'));
                            console.log('🔍 DEBUG: ProMax images found:', promaxImages.length);
                            if (promaxImages.length > 0) {
                                var firstImage = promaxImages[0];
                                var src = firstImage.src;
                                console.log('🔍 DEBUG: First ProMax src:', src);
                                // Make sure it's not a thumbnail
                                if (src && !src.includes('/thumb/')) {
                                    console.log('✅ DEBUG: Returning full-size image');
                                    return src;
                                }
                                else {
                                    console.log('❌ DEBUG: Image is thumbnail or empty');
                                }
                            }
                            else {
                                console.log('❌ DEBUG: No ProMax images found, trying fallbacks...');
                            }
                            // Try multiple selectors in order of priority
                            var selectors = [
                                'img[src*="promaxinventory"]',
                                '.vehicle-image img',
                                '#vehicle-image',
                                'img[src*="/inventory/"]',
                                'img[src*="/vehicles/"]',
                                'img[src*="/photos/"]',
                                '.main-image img',
                                '.photo-gallery img',
                                '[class*="photo"] img',
                                '[class*="image"] img:not([class*="logo"])',
                                '[id*="photo"] img',
                                'img[alt*="Vehicle"]',
                                'img[alt*="Photo"]',
                                'img[alt*="Hyundai"]',
                                'img[alt*="BMW"]',
                                'img[alt*="Mercedes"]',
                                'img[alt*="Used"]'
                            ];
                            for (var _i = 0, selectors_1 = selectors; _i < selectors_1.length; _i++) {
                                var selector = selectors_1[_i];
                                var img = document.querySelector(selector);
                                if (img) {
                                    var src = img.src;
                                    if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !src.includes('/thumb/') && !src.includes('onepix.png')) {
                                        return src;
                                    }
                                }
                            }
                            // Final fallback: find the largest image that looks like a vehicle photo
                            var images = Array.from(document.querySelectorAll('img'));
                            var vehicleImages = images.filter(function (img) {
                                var src = img.src || '';
                                var alt = img.getAttribute('alt') || '';
                                var width = img.naturalWidth || img.width;
                                var height = img.naturalHeight || img.height;
                                // Filter criteria
                                return src.startsWith('http') &&
                                    !src.includes('logo') &&
                                    !src.includes('icon') &&
                                    !src.includes('banner') &&
                                    !src.includes('/thumb/') &&
                                    !src.includes('onepix.png') &&
                                    !alt.toLowerCase().includes('logo') &&
                                    width > 250 &&
                                    height > 180;
                            });
                            // Return the largest image
                            if (vehicleImages.length > 0) {
                                vehicleImages.sort(function (a, b) {
                                    var aSize = (a.naturalWidth || a.width) *
                                        (a.naturalHeight || a.height);
                                    var bSize = (b.naturalWidth || b.width) *
                                        (b.naturalHeight || b.height);
                                    return bSize - aSize;
                                });
                                return vehicleImages[0].src;
                            }
                            return null;
                        })];
                case 5:
                    imageUrl = _b.sent();
                    console.log('📸 DEBUG: Extracted imageUrl:', imageUrl || 'NULL');
                    return [4 /*yield*/, page.close()];
                case 6:
                    _b.sent();
                    return [2 /*return*/, imageUrl];
                case 7:
                    error_1 = _b.sent();
                    console.error('❌ DEBUG: Error fetching image:', error_1);
                    if (!page) return [3 /*break*/, 11];
                    _b.label = 8;
                case 8:
                    _b.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, page.close()];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 10:
                    _a = _b.sent();
                    return [3 /*break*/, 11];
                case 11: 
                // Silently fail - image is optional
                return [2 /*return*/, null];
                case 12: return [2 /*return*/];
            }
        });
    });
}
// Fetch all listings using Puppeteer (handles JavaScript "Load Next Page")
function fetchListings() {
    return __awaiter(this, void 0, void 0, function () {
        var listings, browser, page, clickCount, maxClicks, buttonClicked, _a, vehicleData, i, listing, progress, imageUrl, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    listings = [];
                    console.log('🔍 Fetching Pre-owned Plus listings with Puppeteer...');
                    console.log('🌐 Launching browser...');
                    return [4 /*yield*/, puppeteer_1.default.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        })];
                case 1:
                    browser = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 18, 19, 21]);
                    return [4 /*yield*/, browser.newPage()];
                case 3:
                    page = _b.sent();
                    return [4 /*yield*/, page.goto(INVENTORY_URL, { waitUntil: 'networkidle2', timeout: 60000 })];
                case 4:
                    _b.sent();
                    console.log('📄 Page loaded, clicking "Load Next Page" until all listings loaded...');
                    clickCount = 0;
                    maxClicks = 10;
                    _b.label = 5;
                case 5:
                    if (!(clickCount < maxClicks)) return [3 /*break*/, 11];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 9, , 10]);
                    return [4 /*yield*/, page.evaluate(function () {
                            var elements = Array.from(document.querySelectorAll('button, a, div[role="button"], span[onclick]'));
                            var loadButton = elements.find(function (el) {
                                var text = el.textContent || '';
                                return text.includes('Load Next Page') ||
                                    text.includes('Load More') ||
                                    text.includes('Next Page') ||
                                    text.includes('next page');
                            });
                            if (loadButton) {
                                loadButton.click();
                                return true;
                            }
                            return false;
                        })];
                case 7:
                    buttonClicked = _b.sent();
                    if (!buttonClicked) {
                        console.log('  ✅ No more "Load Next Page" button found');
                        return [3 /*break*/, 11];
                    }
                    console.log("  \uD83D\uDDB1\uFE0F  Clicked \"Load Next Page\" (".concat(clickCount + 1, ")..."));
                    // Wait for new content to load
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 8:
                    // Wait for new content to load
                    _b.sent();
                    clickCount++;
                    return [3 /*break*/, 10];
                case 9:
                    _a = _b.sent();
                    console.log('  ✅ Finished loading all pages');
                    return [3 /*break*/, 11];
                case 10: return [3 /*break*/, 5];
                case 11:
                    console.log('📊 Extracting listing data from page...');
                    return [4 /*yield*/, page.evaluate(function (baseUrl) {
                            var results = [];
                            // Find all links to VehicleDetails pages
                            var links = document.querySelectorAll('a[href*="/VehicleDetails/"]');
                            var processed = new Set();
                            links.forEach(function (link) {
                                var _a;
                                var href = link.getAttribute('href');
                                if (!href || processed.has(href))
                                    return;
                                processed.add(href);
                                // Fix URL construction: handle //domain.com/ URLs
                                var fullUrl;
                                if (href.startsWith('http://') || href.startsWith('https://')) {
                                    fullUrl = href;
                                }
                                else if (href.startsWith('//')) {
                                    fullUrl = 'https:' + href;
                                }
                                else if (href.startsWith('/')) {
                                    fullUrl = baseUrl + href;
                                }
                                else {
                                    fullUrl = baseUrl + '/' + href;
                                }
                                // Find the parent container for this listing
                                var container = link;
                                for (var i = 0; i < 5; i++) {
                                    if (!container)
                                        break;
                                    var parent_1 = container.parentElement;
                                    if (!parent_1)
                                        break;
                                    // Check if this parent has stock/price/mileage info
                                    var text = parent_1.textContent || '';
                                    if (text.includes('Stock#:') && text.includes('Internet Price:')) {
                                        container = parent_1;
                                        break;
                                    }
                                    container = parent_1;
                                }
                                var containerText = (container === null || container === void 0 ? void 0 : container.textContent) || '';
                                // Extract title
                                var title = ((_a = link.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                                if (!title)
                                    return;
                                // Extract year
                                var yearMatch = title.match(/(\d{4})/);
                                var year = yearMatch ? parseInt(yearMatch[1]) : null;
                                // Extract make and model
                                var make = null;
                                var model = null;
                                var parts = title.replace(/^\d{4}\s+/, '').trim().split(' ');
                                if (parts.length >= 2) {
                                    make = parts[0];
                                    model = parts.slice(1).join(' ');
                                }
                                // Extract price
                                var priceMatch = containerText.match(/Internet Price:\s*\$\s*([\d,]+)/);
                                var price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;
                                // Extract mileage
                                var mileageMatch = containerText.match(/Mileage:\s*([\d,]+)/);
                                var mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : null;
                                // Only add if we have minimum required data (no image yet - will fetch from detail page)
                                if (title && fullUrl && price) {
                                    results.push({
                                        url: fullUrl,
                                        title: title,
                                        year: year,
                                        make: make,
                                        model: model,
                                        price: price,
                                        mileage: mileage,
                                        imageUrl: null // Will be fetched later
                                    });
                                }
                            });
                            return results;
                        }, BASE_URL)];
                case 12:
                    vehicleData = _b.sent();
                    console.log("\u2705 Found ".concat(vehicleData.length, " listings"));
                    console.log('📸 Fetching images from detail pages (this may take a while)...');
                    i = 0;
                    _b.label = 13;
                case 13:
                    if (!(i < vehicleData.length)) return [3 /*break*/, 17];
                    listing = vehicleData[i];
                    progress = "[".concat(i + 1, "/").concat(vehicleData.length, "]");
                    console.log("  ".concat(progress, " ").concat(listing.title));
                    return [4 /*yield*/, fetchImageFromDetailPage(listing.url, browser)];
                case 14:
                    imageUrl = _b.sent();
                    listing.imageUrl = imageUrl;
                    if (!(i < vehicleData.length - 1)) return [3 /*break*/, 16];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 15:
                    _b.sent();
                    _b.label = 16;
                case 16:
                    i++;
                    return [3 /*break*/, 13];
                case 17:
                    listings.push.apply(listings, vehicleData);
                    console.log("\u2705 Completed! Total: ".concat(listings.length, " listings with images"));
                    return [3 /*break*/, 21];
                case 18:
                    error_2 = _b.sent();
                    console.error('❌ Error during Puppeteer scraping:', error_2);
                    throw error_2;
                case 19: return [4 /*yield*/, browser.close()];
                case 20:
                    _b.sent();
                    console.log('🔒 Browser closed');
                    return [7 /*endfinally*/];
                case 21: return [2 /*return*/, listings];
            }
        });
    });
}
// Download image and upload to Supabase Storage
function downloadAndUploadImage(imageUrl, listingId, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
supabase) {
    return __awaiter(this, void 0, void 0, function () {
        var response, buffer, ext, filename, path, uploadError, publicUrl, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch(imageUrl)];
                case 1:
                    response = _b.sent();
                    if (!response.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, response.arrayBuffer()];
                case 2:
                    buffer = _b.sent();
                    ext = ((_a = imageUrl.split('.').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0]) || 'jpg';
                    filename = "".concat(listingId, ".").concat(ext);
                    path = "".concat(SOURCE, "/").concat(filename);
                    return [4 /*yield*/, supabase.storage
                            .from('external-listing-images')
                            .upload(path, buffer, {
                            contentType: "image/".concat(ext),
                            upsert: true
                        })];
                case 3:
                    uploadError = (_b.sent()).error;
                    if (uploadError) {
                        console.error("\u274C Image upload error for ".concat(listingId, ":"), uploadError.message);
                        return [2 /*return*/, null];
                    }
                    publicUrl = supabase.storage
                        .from('external-listing-images')
                        .getPublicUrl(path).data.publicUrl;
                    return [2 /*return*/, publicUrl];
                case 4:
                    error_3 = _b.sent();
                    console.error("\u274C Error downloading image for ".concat(listingId, ":"), error_3);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Get San Antonio, TX location IDs from database
function getLocationIds(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
supabase) {
    return __awaiter(this, void 0, void 0, function () {
        var stateData, stateId, cityData, cityId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('states')
                        .select('id')
                        .eq('code', STATE)
                        .single()];
                case 1:
                    stateData = (_a.sent()).data;
                    if (!stateData) {
                        throw new Error('Texas state not found in database');
                    }
                    stateId = stateData.id;
                    return [4 /*yield*/, supabase
                            .from('cities')
                            .select('id')
                            .eq('state_id', stateId)
                            .ilike('name', CITY)
                            .single()];
                case 2:
                    cityData = (_a.sent()).data;
                    cityId = cityData ? cityData.id : null;
                    return [2 /*return*/, {
                            stateId: stateId,
                            cityId: cityId
                        }];
            }
        });
    });
}
// Sync listings to database
function syncListings(listings, supabaseUrl, supabaseKey) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, _a, stateId, cityId, currentTime, insertedCount, updatedCount, skippedCount, _i, listings_1, listing, urlMatch, listingId, existing, uploadedImageUrl, listingData, error, error, error_4, deactivateError;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    supabase = getSupabase(supabaseUrl, supabaseKey);
                    return [4 /*yield*/, getLocationIds(supabase)];
                case 1:
                    _a = _b.sent(), stateId = _a.stateId, cityId = _a.cityId;
                    currentTime = new Date().toISOString();
                    console.log("\n\uD83D\uDCBE Syncing ".concat(listings.length, " listings to database..."));
                    console.log("\uD83D\uDCCD Location: ".concat(CITY, ", ").concat(STATE, " (state_id=").concat(stateId, ", city_id=").concat(cityId || 'null', ")"));
                    insertedCount = 0;
                    updatedCount = 0;
                    skippedCount = 0;
                    _i = 0, listings_1 = listings;
                    _b.label = 2;
                case 2:
                    if (!(_i < listings_1.length)) return [3 /*break*/, 13];
                    listing = listings_1[_i];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 11, , 12]);
                    urlMatch = listing.url.match(/VehicleDetails\/(\d+)\/([^\/]+)/);
                    listingId = urlMatch ? "".concat(urlMatch[1], "-").concat(urlMatch[2]) : listing.title.replace(/\s+/g, '-').toLowerCase();
                    return [4 /*yield*/, supabase
                            .from('external_listings')
                            .select('id, image_url')
                            .eq('source', SOURCE)
                            .eq('external_url', listing.url)
                            .single()];
                case 4:
                    existing = (_b.sent()).data;
                    uploadedImageUrl = (existing === null || existing === void 0 ? void 0 : existing.image_url) || null;
                    if (!(listing.imageUrl && !(existing === null || existing === void 0 ? void 0 : existing.image_url))) return [3 /*break*/, 6];
                    console.log("\uD83D\uDCE5 Downloading image for ".concat(listingId, "..."));
                    return [4 /*yield*/, downloadAndUploadImage(listing.imageUrl, listingId, supabase)];
                case 5:
                    uploadedImageUrl = _b.sent();
                    if (uploadedImageUrl) {
                        console.log("\u2705 Image uploaded for ".concat(listingId));
                    }
                    _b.label = 6;
                case 6:
                    listingData = {
                        external_id: listingId, // Use generated listing ID as external_id
                        source: SOURCE,
                        external_url: listing.url,
                        title: listing.title,
                        year: listing.year,
                        make: listing.make,
                        model: listing.model,
                        price: listing.price,
                        mileage: listing.mileage,
                        state_id: stateId,
                        city_id: cityId,
                        city_name: CITY,
                        image_url: uploadedImageUrl,
                        contact_phone: COMPANY_PHONE,
                        contact_email: COMPANY_EMAIL,
                        is_active: true,
                        last_seen_at: currentTime,
                        vehicle_type: 'car' // Default to car
                    };
                    if (!existing) return [3 /*break*/, 8];
                    return [4 /*yield*/, supabase
                            .from('external_listings')
                            .update(__assign(__assign({}, listingData), { updated_at: currentTime }))
                            .eq('id', existing.id)];
                case 7:
                    error = (_b.sent()).error;
                    if (error) {
                        console.error("\u274C Error updating listing ".concat(listingId, ":"), error);
                        skippedCount++;
                    }
                    else {
                        console.log("\u2705 Updated listing: ".concat(listing.title));
                        updatedCount++;
                    }
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, supabase
                        .from('external_listings')
                        .insert(listingData)];
                case 9:
                    error = (_b.sent()).error;
                    if (error) {
                        console.error("\u274C Error inserting listing ".concat(listingId, ":"), error);
                        skippedCount++;
                    }
                    else {
                        console.log("\u2705 Inserted listing: ".concat(listing.title));
                        insertedCount++;
                    }
                    _b.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_4 = _b.sent();
                    console.error("\u274C Error processing listing:", error_4);
                    skippedCount++;
                    return [3 /*break*/, 12];
                case 12:
                    _i++;
                    return [3 /*break*/, 2];
                case 13: return [4 /*yield*/, supabase
                        .from('external_listings')
                        .update({ is_active: false })
                        .eq('source', SOURCE)
                        .lt('last_seen_at', currentTime)];
                case 14:
                    deactivateError = (_b.sent()).error;
                    if (deactivateError) {
                        console.error('❌ Error deactivating old listings:', deactivateError);
                    }
                    else {
                        console.log('✅ Deactivated removed listings');
                    }
                    console.log("\n\uD83C\uDF89 Sync complete!");
                    console.log("   \uD83D\uDCCA Inserted: ".concat(insertedCount));
                    console.log("   \uD83D\uDD04 Updated: ".concat(updatedCount));
                    console.log("   \u23ED\uFE0F  Skipped: ".concat(skippedCount));
                    console.log("   \uD83D\uDCDD Total processed: ".concat(listings.length));
                    return [2 /*return*/];
            }
        });
    });
}
// Main sync function
function syncPreOwnedPlus(supabaseUrl, supabaseKey) {
    return __awaiter(this, void 0, void 0, function () {
        var url, key, listings, validListings, skipped, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting Pre-owned Plus sync...');
                    console.log("\u23F0 Time: ".concat(new Date().toLocaleString('en-US', { timeZone: 'Europe/Tallinn' }), " (Estonian Time)"));
                    url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
                    key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
                    console.log("\uD83D\uDD11 Credentials check: url=".concat(!!url, ", key=").concat(!!key));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetchListings()];
                case 2:
                    listings = _a.sent();
                    validListings = listings.filter(function (l) { return l.price !== null; });
                    skipped = listings.length - validListings.length;
                    if (skipped > 0) {
                        console.log("\u26A0\uFE0F  Skipped ".concat(skipped, " listings without price"));
                    }
                    console.log("\u2705 Total listings found: ".concat(validListings.length));
                    if (validListings.length === 0) {
                        console.log('⚠️  No listings found, skipping sync');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, syncListings(validListings, supabaseUrl, supabaseKey)];
                case 3:
                    _a.sent();
                    console.log('✅ Pre-owned Plus sync completed successfully!');
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    console.error('❌ Fatal error during sync:', error_5);
                    throw error_5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (require.main === module) {
    syncPreOwnedPlus().catch(function (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
