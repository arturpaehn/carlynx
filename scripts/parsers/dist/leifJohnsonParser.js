"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.syncLeifJohnson = syncLeifJohnson;
var puppeteer_1 = __importDefault(require("puppeteer"));
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv = __importStar(require("dotenv"));
var path = __importStar(require("path"));
// Load environment variables
var envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envPath) });
var SOURCE = 'leif_johnson';
var PHONE = '(512) 697-9012';
var CITY = 'Austin';
var STATE = 'TX';
var BASE_URL = 'https://www.iwanttobuyused.com/search/Used+t';
function fetchImageFromDetailPage(browser, detailUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var detailPage, imageUrl, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.newPage()];
                case 1:
                    detailPage = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 9]);
                    return [4 /*yield*/, detailPage.goto(detailUrl, {
                            waitUntil: 'networkidle2',
                            timeout: 30000
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, detailPage.evaluate(function () {
                            // Ищем первую настоящую фотку машины (из homenetiol.com)
                            var images = Array.from(document.querySelectorAll('img'));
                            for (var _i = 0, images_1 = images; _i < images_1.length; _i++) {
                                var img = images_1[_i];
                                var src = img.src || img.getAttribute('src');
                                if (src && src.includes('homenetiol.com') && img.width > 300) {
                                    return src;
                                }
                            }
                            return null;
                        })];
                case 5:
                    imageUrl = _a.sent();
                    return [4 /*yield*/, detailPage.close()];
                case 6:
                    _a.sent();
                    return [2 /*return*/, imageUrl];
                case 7:
                    error_1 = _a.sent();
                    console.error("Error fetching image from ".concat(detailUrl, ":"), error_1);
                    return [4 /*yield*/, detailPage.close()];
                case 8:
                    _a.sent();
                    return [2 /*return*/, null];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function fetchVehiclesFromPage(page, pageNum) {
    return __awaiter(this, void 0, void 0, function () {
        var url, vehicles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = pageNum === 1 ? BASE_URL : "".concat(BASE_URL, "?page=").concat(pageNum);
                    console.log("\uD83D\uDCC4 Fetching page ".concat(pageNum, ": ").concat(url));
                    return [4 /*yield*/, page.goto(url, {
                            waitUntil: 'networkidle2',
                            timeout: 60000
                        })];
                case 1:
                    _a.sent();
                    // Wait for results to load
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 2:
                    // Wait for results to load
                    _a.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            var results = [];
                            // Get direct children of #result div (each child is one vehicle card)
                            var resultDiv = document.querySelector('#result');
                            if (!resultDiv) {
                                console.log('No #result div found');
                                return results;
                            }
                            var elements = resultDiv.children;
                            if (!elements || elements.length === 0) {
                                console.log('No vehicle elements found in #result');
                                return results;
                            }
                            console.log("Found ".concat(elements.length, " vehicle cards in #result"));
                            Array.from(elements).forEach(function (el) {
                                var _a, _b, _c, _d;
                                try {
                                    var vehicle = {};
                                    // Try to get VIN from data attribute
                                    vehicle.vin = el.getAttribute('data-vin') || ((_a = el.querySelector('[data-vin]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-vin')) || undefined;
                                    // Get title
                                    var titleEl = el.querySelector('h2, h3, .title, .vehicle-title, [class*="title"]');
                                    if (titleEl) {
                                        vehicle.title = (_b = titleEl.textContent) === null || _b === void 0 ? void 0 : _b.trim();
                                    }
                                    // Get link
                                    var linkEl = el.querySelector('a[href*="/detail"], a[href*="/vehicle"], a[href*="/inventory"]');
                                    if (linkEl) {
                                        vehicle.detailUrl = linkEl.getAttribute('href') || undefined;
                                    }
                                    // Get image
                                    var imgEl = el.querySelector('img');
                                    if (imgEl) {
                                        vehicle.imageUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || undefined;
                                    }
                                    // Get price
                                    var priceEl = el.querySelector('[class*="price"], .price, [data-price]');
                                    if (priceEl) {
                                        var priceText = ((_c = priceEl.textContent) === null || _c === void 0 ? void 0 : _c.replace(/[^0-9]/g, '')) || '';
                                        if (priceText) {
                                            vehicle.price = parseInt(priceText);
                                        }
                                    }
                                    // Get mileage
                                    var mileageEl = el.querySelector('[class*="mile"], [class*="mileage"]');
                                    if (mileageEl) {
                                        var mileageText = ((_d = mileageEl.textContent) === null || _d === void 0 ? void 0 : _d.replace(/[^0-9]/g, '')) || '';
                                        if (mileageText) {
                                            vehicle.mileage = parseInt(mileageText);
                                        }
                                    }
                                    // Parse title for year/make/model if not already set
                                    if (vehicle.title) {
                                        var titleParts = vehicle.title.split(' ');
                                        if (titleParts.length >= 3) {
                                            var yearMatch = vehicle.title.match(/\b(19|20)\d{2}\b/);
                                            if (yearMatch) {
                                                vehicle.year = yearMatch[0];
                                            }
                                        }
                                    }
                                    results.push(vehicle);
                                }
                                catch (err) {
                                    console.error('Error parsing vehicle:', err);
                                }
                            });
                            return results;
                        })];
                case 3:
                    vehicles = _a.sent();
                    console.log("\u2705 Found ".concat(vehicles.length, " vehicles on page ").concat(pageNum));
                    return [2 /*return*/, vehicles];
            }
        });
    });
}
function syncLeifJohnson(supabaseUrl, supabaseKey) {
    return __awaiter(this, void 0, void 0, function () {
        var url, key, supabase, browser, page, allVehicles, pageNum, maxPages, vehicles, error_2, i, vehicle, fullUrl, imageUrl, error_3, stateData, stateId, cityData, cityId, inserted, updated, skipped, _i, allVehicles_1, vehicle, externalId, existing, listingData, error, insertError, error_4, allExternalIds, deactivateError, error_5, errorMessage;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🚀 Starting Leif Johnson sync...');
                    console.log("\u23F0 Time: ".concat(new Date().toLocaleString()));
                    url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
                    key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
                    supabase = (0, supabase_js_1.createClient)(url, key);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 35, , 36]);
                    console.log('🌐 Launching browser...');
                    return [4 /*yield*/, puppeteer_1.default.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        })];
                case 2:
                    browser = _b.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 3:
                    page = _b.sent();
                    return [4 /*yield*/, page.setViewport({ width: 1920, height: 1080 })];
                case 4:
                    _b.sent();
                    allVehicles = [];
                    pageNum = 1;
                    maxPages = 25;
                    _b.label = 5;
                case 5:
                    if (!(pageNum <= maxPages)) return [3 /*break*/, 11];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 9, , 10]);
                    return [4 /*yield*/, fetchVehiclesFromPage(page, pageNum)];
                case 7:
                    vehicles = _b.sent();
                    if (vehicles.length === 0) {
                        console.log("No more vehicles found on page ".concat(pageNum, ", stopping."));
                        return [3 /*break*/, 11];
                    }
                    allVehicles.push.apply(allVehicles, vehicles);
                    pageNum++;
                    // Small delay between pages
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 8:
                    // Small delay between pages
                    _b.sent();
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _b.sent();
                    console.error("Error on page ".concat(pageNum, ":"), error_2);
                    return [3 /*break*/, 11];
                case 10: return [3 /*break*/, 5];
                case 11:
                    console.log("\n\u2705 Total vehicles found: ".concat(allVehicles.length));
                    if (!(allVehicles.length === 0)) return [3 /*break*/, 13];
                    console.log('❌ No vehicles found to sync');
                    return [4 /*yield*/, browser.close()];
                case 12:
                    _b.sent();
                    return [2 /*return*/, { success: false, message: 'No vehicles found' }];
                case 13:
                    // Теперь получаем фотки для каждой машины
                    console.log('\n📸 Fetching images from detail pages...');
                    i = 0;
                    _b.label = 14;
                case 14:
                    if (!(i < allVehicles.length)) return [3 /*break*/, 20];
                    vehicle = allVehicles[i];
                    if (!vehicle.detailUrl) return [3 /*break*/, 19];
                    _b.label = 15;
                case 15:
                    _b.trys.push([15, 18, , 19]);
                    fullUrl = vehicle.detailUrl.startsWith('http')
                        ? vehicle.detailUrl
                        : "https://www.iwanttobuyused.com".concat(vehicle.detailUrl);
                    return [4 /*yield*/, fetchImageFromDetailPage(browser, fullUrl)];
                case 16:
                    imageUrl = _b.sent();
                    if (imageUrl) {
                        vehicle.imageUrl = imageUrl;
                        console.log("\u2705 Got image for ".concat(vehicle.title || 'vehicle', " (").concat(i + 1, "/").concat(allVehicles.length, ")"));
                    }
                    else {
                        console.log("\u26A0\uFE0F  No image found for ".concat(vehicle.title || 'vehicle', " (").concat(i + 1, "/").concat(allVehicles.length, ")"));
                    }
                    // Небольшая задержка между запросами
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 17:
                    // Небольшая задержка между запросами
                    _b.sent();
                    return [3 /*break*/, 19];
                case 18:
                    error_3 = _b.sent();
                    console.error("Error fetching image for ".concat(vehicle.title, ":"), error_3);
                    return [3 /*break*/, 19];
                case 19:
                    i++;
                    return [3 /*break*/, 14];
                case 20: return [4 /*yield*/, browser.close()];
                case 21:
                    _b.sent();
                    // Get location IDs (using same approach as other parsers)
                    console.log("\uD83D\uDCCD Looking up location: ".concat(CITY, ", ").concat(STATE));
                    return [4 /*yield*/, supabase
                            .from('states')
                            .select('id')
                            .eq('code', STATE)
                            .single()];
                case 22:
                    stateData = (_b.sent()).data;
                    if (!stateData) {
                        throw new Error("State not found: ".concat(STATE));
                    }
                    stateId = stateData.id;
                    return [4 /*yield*/, supabase
                            .from('cities')
                            .select('id')
                            .eq('state_id', stateId)
                            .ilike('name', CITY)
                            .single()];
                case 23:
                    cityData = (_b.sent()).data;
                    cityId = cityData ? cityData.id : null;
                    console.log("\uD83D\uDCCD Location: ".concat(CITY, ", ").concat(STATE, " (state_id=").concat(stateId, ", city_id=").concat(cityId, ")"));
                    // Sync to database
                    console.log("\n\uD83D\uDCBE Syncing ".concat(allVehicles.length, " listings to database..."));
                    inserted = 0;
                    updated = 0;
                    skipped = 0;
                    _i = 0, allVehicles_1 = allVehicles;
                    _b.label = 24;
                case 24:
                    if (!(_i < allVehicles_1.length)) return [3 /*break*/, 33];
                    vehicle = allVehicles_1[_i];
                    _b.label = 25;
                case 25:
                    _b.trys.push([25, 31, , 32]);
                    // Skip vehicles without price OR without image
                    if (!vehicle.price || !vehicle.imageUrl) {
                        console.log("\u23ED\uFE0F  Skipping ".concat(vehicle.title || 'vehicle', ": ").concat(!vehicle.price ? 'no price' : 'no image'));
                        skipped++;
                        return [3 /*break*/, 32];
                    }
                    externalId = vehicle.vin || ((_a = vehicle.detailUrl) === null || _a === void 0 ? void 0 : _a.split('/').pop()) || "".concat(vehicle.title, "-").concat(Math.random());
                    if (!externalId) {
                        console.log('⏭️  Skipping vehicle without ID');
                        skipped++;
                        return [3 /*break*/, 32];
                    }
                    return [4 /*yield*/, supabase
                            .from('external_listings')
                            .select('id, image_url')
                            .eq('external_id', externalId)
                            .eq('source', SOURCE)
                            .single()];
                case 26:
                    existing = (_b.sent()).data;
                    listingData = {
                        external_id: externalId,
                        source: SOURCE,
                        external_url: vehicle.detailUrl || BASE_URL,
                        title: vehicle.title || "".concat(vehicle.year || '', " ").concat(vehicle.make || '', " ").concat(vehicle.model || '').trim() || 'Vehicle',
                        year: vehicle.year ? parseInt(vehicle.year) : null,
                        make: vehicle.make || null,
                        model: vehicle.model || null,
                        price: vehicle.price || null,
                        mileage: vehicle.mileage || null,
                        state_id: stateId,
                        city_id: cityId,
                        city_name: CITY,
                        image_url: vehicle.imageUrl || null,
                        contact_phone: PHONE,
                        contact_email: null,
                        is_active: true,
                        last_seen_at: new Date().toISOString(),
                        vehicle_type: 'car'
                    };
                    if (!existing) return [3 /*break*/, 28];
                    return [4 /*yield*/, supabase
                            .from('external_listings')
                            .update(listingData)
                            .eq('id', existing.id)];
                case 27:
                    error = (_b.sent()).error;
                    if (error) {
                        console.error("\u274C Error updating ".concat(externalId, ":"), error.message);
                    }
                    else {
                        console.log("\uD83D\uDD04 Updated listing: ".concat(listingData.title));
                        updated++;
                    }
                    return [3 /*break*/, 30];
                case 28: return [4 /*yield*/, supabase
                        .from('external_listings')
                        .insert(listingData)];
                case 29:
                    insertError = (_b.sent()).error;
                    if (insertError) {
                        console.error("\u274C Error inserting ".concat(externalId, ":"), insertError.message);
                    }
                    else {
                        console.log("\u2705 Inserted listing: ".concat(listingData.title));
                        inserted++;
                    }
                    _b.label = 30;
                case 30: return [3 /*break*/, 32];
                case 31:
                    error_4 = _b.sent();
                    console.error('❌ Error processing vehicle:', error_4 instanceof Error ? error_4.message : String(error_4));
                    skipped++;
                    return [3 /*break*/, 32];
                case 32:
                    _i++;
                    return [3 /*break*/, 24];
                case 33:
                    // Deactivate removed listings
                    console.log('\n🔄 Deactivating removed listings...');
                    allExternalIds = allVehicles
                        .map(function (v) { var _a; return v.vin || ((_a = v.detailUrl) === null || _a === void 0 ? void 0 : _a.split('/').pop()); })
                        .filter(Boolean);
                    return [4 /*yield*/, supabase
                            .from('external_listings')
                            .update({ is_active: false })
                            .eq('source', SOURCE)
                            .not('external_id', 'in', "(".concat(allExternalIds.join(','), ")"))];
                case 34:
                    deactivateError = (_b.sent()).error;
                    if (deactivateError) {
                        console.error('❌ Error deactivating listings:', deactivateError.message);
                    }
                    else {
                        console.log('✅ Deactivated removed listings');
                    }
                    console.log('\n🎉 Sync complete!');
                    console.log("   \uD83D\uDCCA Inserted: ".concat(inserted));
                    console.log("   \uD83D\uDD04 Updated: ".concat(updated));
                    console.log("   \u23ED\uFE0F  Skipped: ".concat(skipped));
                    console.log("   \uD83D\uDCDD Total processed: ".concat(inserted + updated + skipped));
                    return [2 /*return*/, {
                            success: true,
                            inserted: inserted,
                            updated: updated,
                            skipped: skipped,
                            total: allVehicles.length
                        }];
                case 35:
                    error_5 = _b.sent();
                    errorMessage = error_5 instanceof Error ? error_5.message : String(error_5);
                    console.error('❌ Error syncing Leif Johnson:', errorMessage);
                    return [2 /*return*/, { success: false, error: errorMessage }];
                case 36: return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (require.main === module) {
    syncLeifJohnson()
        .then(function (result) {
        if (result.success) {
            console.log('✅ Leif Johnson sync completed successfully!');
            process.exit(0);
        }
        else {
            console.error('❌ Leif Johnson sync failed!');
            process.exit(1);
        }
    })
        .catch(function (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}
