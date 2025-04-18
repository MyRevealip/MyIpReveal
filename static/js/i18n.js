/**
 * Internationalization and language support for MyIPReveal.com
 * Supports multiple languages and provides translation functions
 */

// Store language preference in local storage
const LANGUAGE_KEY = 'myipreveal_language';

// Default language
const DEFAULT_LANGUAGE = 'en';

// Available languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ru'];

// Translations object - will be populated from server or separate files
const translations = {
  en: {
    // English is the default language - keys match the text in templates
  },
  es: {
    // Spanish translations
    'What Is My IP Address?': '¿Cuál es mi dirección IP?',
    'IP Address Lookup': 'Búsqueda de dirección IP',
    'Network Tools': 'Herramientas de red',
    'Your IP Address': 'Tu dirección IP',
    'IP Version': 'Versión IP',
    'Location': 'Ubicación',
    'ISP': 'Proveedor de servicios',
    'Country': 'País',
    'Region': 'Región',
    'City': 'Ciudad',
    'Share Results': 'Compartir resultados',
    'Copy': 'Copiar',
    'Copied!': '¡Copiado!',
    'Print Results': 'Imprimir resultados',
    'DNS Lookup': 'Búsqueda DNS',
    'Port Scanner': 'Escáner de puertos',
    'Traceroute': 'Traceroute',
    'Ping Tool': 'Herramienta de Ping',
    'Home': 'Inicio',
    'About Us': 'Acerca de nosotros',
    'Privacy Policy': 'Política de privacidad',
    'Terms of Service': 'Términos de servicio',
    'Cookie Policy': 'Política de cookies'
  },
  fr: {
    // French translations
    'What Is My IP Address?': 'Quelle est mon adresse IP?',
    'IP Address Lookup': 'Recherche d\'adresse IP',
    'Network Tools': 'Outils réseau',
    'Your IP Address': 'Votre adresse IP',
    'IP Version': 'Version IP',
    'Location': 'Emplacement',
    'ISP': 'Fournisseur d\'accès',
    'Country': 'Pays',
    'Region': 'Région',
    'City': 'Ville',
    'Share Results': 'Partager les résultats',
    'Copy': 'Copier',
    'Copied!': 'Copié!',
    'Print Results': 'Imprimer les résultats',
    'DNS Lookup': 'Recherche DNS',
    'Port Scanner': 'Scanner de ports',
    'Traceroute': 'Traceroute',
    'Ping Tool': 'Outil de Ping',
    'Home': 'Accueil',
    'About Us': 'À propos',
    'Privacy Policy': 'Politique de confidentialité',
    'Terms of Service': 'Conditions d\'utilisation',
    'Cookie Policy': 'Politique des cookies'
  },
  // Add other languages as needed
};

// Function to get current language
function getCurrentLanguage() {
  let lang = localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
  
  // Validate it's a supported language
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    lang = DEFAULT_LANGUAGE;
  }
  
  return lang;
}

// Function to set language
function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.warn(`Language ${lang} is not supported. Using default.`);
    lang = DEFAULT_LANGUAGE;
  }
  
  // Save to local storage
  localStorage.setItem(LANGUAGE_KEY, lang);
  
  // Apply translations to the page
  applyTranslations();
  
  // Set the language selector value
  const langSelector = document.getElementById('language-select');
  if (langSelector) {
    langSelector.value = lang;
  }
  
  // Update html lang attribute
  document.documentElement.lang = lang;
  
  // Return the language code for chaining
  return lang;
}

// Function to translate a string
function translate(text) {
  const lang = getCurrentLanguage();
  
  // Return original text for default language
  if (lang === DEFAULT_LANGUAGE) {
    return text;
  }
  
  // Get the translated text if available
  return translations[lang]?.[text] || text;
}

// Apply translations to all elements with data-i18n attribute
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = translate(key);
  });
}

// Initialize language support when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing internationalization support');
  
  // Get current language
  const currentLang = getCurrentLanguage();
  console.log('Current language:', currentLang);
  
  // Set language selector value
  const langSelector = document.getElementById('language-select');
  if (langSelector) {
    console.log('Language selector found');
    langSelector.value = currentLang;
    
    // Add event listener to change language
    langSelector.addEventListener('change', function() {
      console.log('Language changed to:', this.value);
      setLanguage(this.value);
      
      // Reload the page to apply translations to server-rendered content
      window.location.reload();
    });
  } else {
    console.warn('Language selector not found');
  }
  
  // Apply translations to dynamic content
  applyTranslations();
  
  // Add data-i18n attributes to all elements that need translation
  const elementsToTranslate = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, button, label, span');
  console.log('Found', elementsToTranslate.length, 'potential elements to translate');
  
  let translatedCount = 0;
  elementsToTranslate.forEach(element => {
    // Skip elements that already have data-i18n
    if (element.hasAttribute('data-i18n')) {
      return;
    }
    
    // Skip elements with only whitespace or no text
    if (!element.textContent || element.textContent.trim() === '') {
      return;
    }
    
    // Skip elements with only numbers or special characters
    if (/^[\d\s\W]+$/.test(element.textContent)) {
      return;
    }
    
    // Add data-i18n attribute with the text content as the key
    const text = element.textContent.trim();
    element.setAttribute('data-i18n', text);
    translatedCount++;
  });
  
  console.log('Added data-i18n attributes to', translatedCount, 'elements');
});

// Expose these functions globally
window.i18n = {
  translate,
  setLanguage,
  getCurrentLanguage
};