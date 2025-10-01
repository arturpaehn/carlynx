"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  | 'notProvided'
  | 'contactInformation'
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
  | 'loadingListing' | 'deactivateListing';

interface Translations {
  [key: string]: string;
}

interface I18nContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
}

// Переводы загружаются из JSON файлов
const translations: Record<string, Translations> = {};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  useEffect(() => {
    // Загружаем переводы из JSON файлов
    const loadTranslations = async () => {
      try {
        // Загружаем английские переводы
        const enResponse = await fetch('/locales/en/common.json');
        const enData = await enResponse.json();
        translations['en'] = enData;

        // Загружаем испанские переводы
        const esResponse = await fetch('/locales/es/common.json');
        const esData = await esResponse.json();
        translations['es'] = esData;

        setTranslationsLoaded(true);

        // Определяем язык браузера или используем сохраненный
        const savedLang = localStorage.getItem('language');
        const browserLang = navigator.language.split('-')[0];
        const lang = savedLang || (translations[browserLang] ? browserLang : 'en');
        setCurrentLanguage(lang);
      } catch (error) {
        console.error('Failed to load translations:', error);
        setTranslationsLoaded(true); // Продолжаем с английским по умолчанию
      }
    };

    loadTranslations();
  }, []);

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: TranslationKey): string => {
    // Fallback значения для критичных переводов
    const fallbacks: Partial<Record<TranslationKey, string>> = {
      'nameOnlyLettersAndSpaces': 'Name can only contain English letters and spaces.',
      'invalidPhoneNumber': 'Invalid phone number.',
      'invalidEmailAddress': 'Invalid email address.',
      'passwordMinLength': 'Password must be at least 6 characters long.',
      'pleaseEnterEmailAndPassword': 'Please enter your email and password.',
      'pleaseEnterEmail': 'Please enter your email.',
      'pleaseEnterValidEmail': 'Please enter a valid email address.',
      'pleaseEnterPassword': 'Please enter your password.',
    };

    if (!translationsLoaded) {
      return fallbacks[key] || key; // Используем fallback или ключ
    }
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || fallbacks[key] || key;
  };

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