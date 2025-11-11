"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import enTranslations from '@/../public/locales/en/common.json';
import esTranslations from '@/../public/locales/es/common.json';

// Типы для переводов
type TranslationKey = 
  | 'search' 
  | 'usefulInformation' 
  | 'hello' 
  | 'welcome' 
  | 'article' 
  | 'articles' 
  | 'back'
  | 'welcomeToCarLynx'
  | 'marketplaceDescription'
  | 'latestCars'
  | 'discoverListings'
  | 'loadingCars'
  | 'noCarsYet'
  | 'beTheFirst'
  | 'admin'
  | 'myProfile'
  | 'addListing'
  | 'myListings'
  | 'logOut'
  | 'loggingOut'
  | 'welcomeBack'
  | 'login'
  | 'register'
  | 'signInToAccount'
  | 'emailAddress'
  | 'password'
  | 'enterEmail'
  | 'enterPassword'
  | 'forgotPassword'
  | 'signIn'
  | 'signingIn'
  | 'dontHaveAccount'
  | 'createOneHere'
  | 'pleaseEnterEmailAndPassword'
  | 'pleaseEnterEmail'
  | 'pleaseEnterValidEmail'
  | 'pleaseEnterPassword'
  | 'noAccountFoundOrWrongPassword'
  | 'loginFailedCheckCredentials'
  | 'announcement1'
  | 'announcement2'
  | 'announcement3'
  | 'createAccount'
  | 'joinCarLynx'
  | 'fullName'
  | 'phoneNumber'
  | 'enterFullName'
  | 'enterPhoneNumber'
  | 'nameOnlyLettersAndSpaces'
  | 'invalidEmailAddress'
  | 'invalidPhoneNumber'
  | 'passwordMinLength'
  | 'registrationFailed'
  | 'checkEmailConfirmation'
  | 'confirmationEmailSent'
  | 'alreadyHaveAccount'
  | 'signInHere'
  | 'creating'
  | 'connectingCarOwners'
  | 'contactUs'
  | 'termsOfService'
  | 'privacyPolicy'
  | 'refundPolicy'
  | 'cookiesPolicy'
  | 'allRightsReserved'
  | 'activeListings'
  | 'resetPassword'
  | 'enterEmailForReset'
  | 'sendResetLink'
  | 'sending'
  | 'checkEmailForReset'
  | 'backToLogin'
  | 'newPassword'
  | 'setNewPassword'
  | 'newPasswordPlaceholder'
  | 'updatePassword'
  | 'updatingPassword'
  | 'passwordUpdated'
  | 'verifyingEmail'
  | 'emailConfirmed'
  | 'emailConfirmedLogin'
  | 'emailVerified'
  | 'redirecting'
  | 'goToLogin'
  | 'email'
  | 'emailPlaceholder'
  | 'rememberPassword'
  | 'setNewPassword'
  | 'newPasswordPlaceholder'
  | 'updatePassword'
  | 'updatingPassword'
  | 'passwordUpdated'
  | 'verifyingEmail'
  | 'emailConfirmed'
  | 'emailConfirmedLogin'
  | 'emailVerified'
  | 'redirecting'
  | 'goToLogin'
  | 'allFieldsRequired'
  | 'sendFailed'
  | 'messageSent'
  | 'backToHome'
  | 'contactCarLynx'
  | 'yourEmail'
  | 'emailExample'
  | 'subject'
  | 'subjectPlaceholder'
  | 'messageLabel'
  | 'messagePlaceholder'
  | 'cancel'
  | 'send'
  | 'loadingProfile'
  | 'allVehicles'
  | 'cars'
  | 'motorcycles'
  | 'motorcycleBrand'
  | 'carBrand'
  | 'model'
  | 'minPrice'
  | 'maxPrice'
  | 'minCC'
  | 'maxCC'
  | 'minLiters'
  | 'maxLiters'
  | 'selectStates'
  | 'cityOptional'
  | 'startTypingCity'
  | 'yearFrom'
  | 'yearTo'
  | 'transmission'
  | 'manual'
  | 'automatic'
  | 'fuelType'
  | 'gasoline'
  | 'diesel'
  | 'hybrid'
  | 'electric'
  | 'compressedGas'
  | 'liquefiedGas'
  | 'cng'
  | 'lpg'
  | 'apply'
  | 'modelNotAvailableMotorcycles'
  | 'searchResults'
  | 'discoverPerfectCar'
  | 'loadingSearchResults'
  | 'city'
  | 'enterCityName'
  | 'sortBy'
  | 'defaultNewestFirst'
  | 'priceLowToHigh'
  | 'priceHighToLow'
  | 'yearOldToNew'
  | 'yearNewToOld'
  | 'searchingForCars'
  | 'searchError'
  | 'noResultsFound'
  | 'noResultsDescription'
  | 'backToHome'
  | 'foundResults'
  | 'results'
  | 'result'
  | 'page'
  | 'of'
  | 'showing'
  | 'myListingsTitle'
  | 'manageYourListings'
  | 'noListingsYet'
  | 'createFirstListing'
  | 'createListing'
  | 'active'
  | 'inactive'
  | 'inactiveListingsNote'
  | 'loadingYourListings'
  | 'errorLoadingListings'
  | 'edit'
  | 'addListingTitle'
  | 'sellYourCarDescription'
  | 'car'
  | 'motorcycle'
  | 'optional'
  | 'price'
  | 'year'
  | 'carBrand'
  | 'motorcycleBrand'
  | 'selectCarBrand'
  | 'selectMotorcycleBrand'
  | 'selectModel'
  | 'enterYear'
  | 'enterPrice'
  | 'selectTransmission'
  | 'engineSize'
  | 'engineSizeHelp'
  | 'state'
  | 'selectState'
  | 'description'
  | 'descriptionPlaceholder'
  | 'tellBuyersSpecial'
  | 'uploadPhotos'
  | 'photos'
  | 'mileage'
  | 'miles'
  | 'enterMileage'
  | 'selectFuelType'
  | 'loadingListingDetails'
  | 'listingNotFound'
  | 'listingNoLongerAvailable'
  | 'goBack'
  | 'backToMyListings'
  | 'backToSearchResults'
  | 'views'
  | 'noPhotosAvailable'
  | 'sellerNoPhotos'
  | 'specifications'
  | 'vehicleType'
  | 'sellerInformation'
  | 'dealer'
  | 'privateSeller'
  | 'visitDealerWebsite'
  | 'notProvided'
  | 'contactInformation'
  | 'contactSeller'
  | 'whatsappUs'
  | 'callUs'
  | 'emailUs'
  | 'brand'
  | 'name'
  | 'phone'
  | 'contactEmail'
  | 'createYourAccount'
  | 'checkYourEmail'
  | 'enterYourEmail'
  | 'createPassword'
  | 'minimumCharacters'
  | 'creatingAccount'
  | 'accountExistsLogin'
  | 'registrationSuccessNoId'
  | 'unexpectedError'
  | 'yourProfile'
  | 'managePersonalInfo'
  | 'enterYourPhone'
  | 'enterNewPassword'
  | 'leaveEmptyKeepPassword'
  | 'savingChanges'
  | 'saveChanges'
  | 'userNotFound'
  | 'errorUpdatingProfile'
  | 'passwordUpdateFailed'
  | 'profileUpdatedSuccessfully'
  | 'sendResetEmailInfo'
  | 'loading' | 'noArticlesYet' | 'readMore' | 'backToArticlesList'
  | 'nicbVinCheckTitle' | 'nicbVinCheckDesc' | 'nicbVinCheckCta'
  | 'txdmvTitleCheckTitle' | 'txdmvTitleCheckDesc' | 'txdmvTitleCheckCta'
  | 'iseecarsVinLookupTitle' | 'iseecarsVinLookupDesc' | 'iseecarsVinLookupCta'
  | 'views' | 'photos' | 'loadingListingDetails' | 'listingNoLongerAvailable' 
  | 'goBack' | 'backToHome' | 'backToSearchResults' | 'backToMyListings'
  | 'yourProfile' | 'managePersonalInfo' | 'saveChanges' | 'savingChanges'
  | 'termsAndConditions' | 'agreementIntro' | 'agreementVisible' | 'agreementAccuracy' | 'agreementRemoval'
  | 'acceptTerms' | 'agreeSubmit' | 'startTypingCity' | 'startTypingInstructions' | 'engineSizeInstructions'
  | 'contactPreferences' | 'allowPhoneContact' | 'allowEmailContact' | 'selectContactMethod' | 'pleaseSelectContact'
  | 'yearRange' | 'engineSizeMotorcycle' | 'invalidEngineSize' | 'engineSizeCars' | 'photosUploadLimit'
  | 'city' | 'optional' | 'imageFormatsInfo' | 'preview' | 'carLabel' | 'motorcycleLabel' 
  | 'engineSizePlaceholderMotorcycle' | 'engineSizePlaceholderCarWhole' | 'engineSizePlaceholderCarDecimal'
  | 'pleaseSelectTransmission'
  | 'editYourListing' | 'updateCarListingDetails' | 'selectMotorcycleBrandOption' | 'toyotaHondaBmw' | 'camryCivicX5'
  | 'chooseFromDropdownOrType' | 'clickToUpload' | 'dragAndDrop' | 'pngJpgWebp' | 'youCanUploadImages'
  | 'deleteListingQuestion' | 'actionCannotBeUndone' | 'keepListing' | 'deleteForever' | 'permanentlyRemoveFromSite'
  | 'failedToLoadListing' | 'failedToUpdateListing' | 'failedToDeactivateListing' | 'pleaseUploadAtLeastOneImage'
  | 'cannotHaveMoreThanImages' | 'listingAppearsToBeDealership' | 'imageUploadFailedError'
  | 'pleaseSelectVehicleType' | 'enterValidEngineSizeMotorcycle' | 'newImageLabel' | 'maximumImagesAllowed'
  | 'imagesAllowed' | 'onOrMoreImagesTooLarge' | 'images' | 'maxImages' | 'max' | 'each'
  | 'createYourAccount' | 'enterYourEmail' | 'createPassword' | 'minimumCharacters' | 'signInHere'
  | 'email' | 'emailPlaceholder' | 'rememberPassword'
  | 'loadingListing' | 'deactivateListing'
  | 'confirmListingFree' | 'confirmListingPayment' | 'close' | 'limitedTimeOffer' | 'freeTrialDescription'
  | 'listingTitle' | 'title' | 'vehicle' | 'vehiclePrice' | 'uploaded' | 'includedFeatures'
  | 'feature30DaysFree' | 'feature30Days' | 'featureUnlimitedViews' | 'featureDirectContact'
  | 'featureEditAnytime' | 'featureHighQualityPhotos' | 'total' | 'oneTimePayment'
  | 'addForFree' | 'proceedToPayment' | 'processing' | 'byConfirmingYouAgree' | 'errorCreatingListing'
  | 'accountType' | 'individualUser' | 'individualUserDescription' | 'dealerAccount' 
  | 'dealerAccountDescription' | 'pleaseSelectAccountType'
  | 'dashboard' | 'profile' | 'dealerDashboard' | 'subscription'
  | 'chooseYourPlan' | 'startWithFreeTrial' | 'currentStatus' | 'trialEnds'
  | 'loadingSubscriptionPlans' | 'failedToLoadSubscription' | 'currentPlan' | 'selectPlan'
  | 'month' | 'activeListingsLimit' | 'allPlansInclude' | 'sevenDayFreeTrial'
  | 'bulkListingCreation' | 'csvExcelImport' | 'listingReactivation' | 'advancedFiltering'
  | 'cancelAnytime' | 'needToCancel' | 'cancelAnytimeDescription' | 'cancelSubscription'
  | 'canceling' | 'subscriptionCancellationScheduled' | 'subscriptionWillBeCanceledOn'
  | 'continueAccessUntil' | 'reactivateSubscription' | 'reactivating' | 'areYouSureCancel'
  | 'subscriptionReactivated' | 'subscriptionCanceled' | 'trial' | 'trialing' | 'pastDue' | 'canceled' | 'unlimited'
  | 'tier100' | 'tier250' | 'tier500' | 'tier1000' | 'tierUnlimited'
  | 'trialPlan' | 'freeForSevenDays' | 'unlimitedDuringTrial' | 'noSubscription'
  | 'totalViews' | 'totalViewsDesc' | 'nextBilling' | 'nextBillingDesc' | 'mostPopular'
  | 'inactiveListings' | 'youHave' | 'reactivateNow' | 'verifiedDealer' | 'notVerified' 
  | 'verifiedDealerDesc' | 'notVerifiedDesc' | 'getVerified' | 'recentListings'
  | 'welcomeToDealerPanel' | 'subscriptionStatus' | 'daysRemaining' | 'quickActions'
  | 'addNewListing' | 'addNewListingDesc' | 'myListingsDesc' | 'manageSubscription' | 'manageSubscriptionDesc'
  | 'addMultipleVehicles' | 'unlimitedTrial' | 'limitReached' | 'maxListingsReached' 
  | 'upgradeOrDeactivate' | 'upgrade' | 'manage' | 'remove' | 'maxImagesAllowed'
  | 'addAnotherListing' | 'submitAllListings' | 'mustHaveAtLeastOne' | 'imagesTooLarge'
  | 'fillAllRequired' | 'listing' | 'inappropriateWord' | 'pleaseRemoveIt' | 'pleaseLogIn'
  | 'adding' | 'listingsWouldExceed' | 'current' | 'failedToCreate' | 'unknownError'
  | 'listingsCreated' | 'checkAndRetry' | 'failedToCreateListings' | 'status' | 'all'
  | 'newestFirst' | 'oldestFirst' | 'nameAZ' | 'nameZA' | 'resetFilters' | 'privateSellersOnly' | 'selected'
  | 'activate' | 'deactivate' | 'clear' | 'selectAll' | 'tryAdjustingFilters'
  | 'contactSupport' | 'supportModalTitle' | 'supportSubject' | 'supportMessage' | 'supportEmail'
  | 'supportEmailPlaceholder' | 'supportSubjectPlaceholder' | 'supportMessagePlaceholder'
  | 'supportSuccess' | 'supportSuccessDescription' | 'closeModal'
  | 'averagePriceTitle' | 'averagePriceDescription' | 'selectBrandAverage' | 'selectModelAverage' | 'selectYearAverage'
  | 'calculate' | 'calculating' | 'averagePrice' | 'noListingsFound' | 'listingsFound' 
  | 'basedOnListings' | 'selectAllFields' | 'vehicleOrBrand'
  | 'calculateAutoLoan' | 'autoLoanCalculator' | 'loanCalculatorDescription' | 'loanVehiclePrice'
  | 'downPayment' | 'downPaymentPlaceholder' | 'loanTerm' | 'loanTermPlaceholder'
  | 'interestRate' | 'interestRatePlaceholder' | 'monthlyPayment' | 'totalPayment'
  | 'totalInterest' | 'resetToRecommended' | 'applyForLoan' | 'lendingTreeApply'
  | 'boaApply' | 'carsDirectApply' | 'lenderOptions' | 'compareMultipleLenders';

interface Translations {
  [key: string]: string;
}

interface I18nContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
}

// Переводы статически импортированы для мгновенной доступности
const translations: Record<string, Translations> = {
  en: enTranslations as Translations,
  es: esTranslations as Translations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always initialize with 'en' on server to prevent hydration mismatch
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load language from localStorage or browser on client side only
    const savedLang = localStorage.getItem('language');
    if (savedLang && translations[savedLang]) {
      setCurrentLanguage(savedLang);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (translations[browserLang]) {
        setCurrentLanguage(browserLang);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Save selected language when it changes (but not on initial mount)
    if (isInitialized) {
      localStorage.setItem('language', currentLanguage);
    }
  }, [currentLanguage, isInitialized]);

  const setLanguage = useCallback((lang: string) => {
    if (translations[lang]) {
      setCurrentLanguage(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
      }
    }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    // Переводы доступны мгновенно через статический импорт
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  }, [currentLanguage]);

  return (
    <I18nContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}