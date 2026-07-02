/**
 * MedClarity – app.js
 * Features: Auth (in-memory + sessionStorage), Report Analysis (Canvas),
 * Web Speech API, Geolocation, Canvas Profile Card, Drag-and-Drop, Share API
 * NO localStorage used anywhere in this file.
 */

'use strict';

/* ============================================================
   0.  GLOBAL STATE
============================================================ */
// Server-backed authentication will manage the active session
const _accounts = new Map();
const protectedViews = ['view-upload', 'view-speech', 'view-geolocation', 'view-preferences', 'view-health', 'view-faq'];

let _session = null;         // current logged-in user object
let platformVoices = [];
let dynamicSpeechRecognition = null;
let isDictating = false;
let currentAuthMode = 'signin';
let _siteLanguage = 'en';
let _themeMode = 'light';

// In-memory preferences (replaces localStorage for preferences)
let _prefs = { name: '', lang: '', hospital: '' };
let _hospitalResults = [];

const translations = {
  en: {
    greeting: 'Hi',
    logoutButton: 'Log Out',
    signInButton: 'Sign In',
    secureAccess: 'Secure access',
    welcomeTitle: 'Welcome to MedClarity',
    authSubtitle: 'Sign in to continue or create a free account in seconds.',
    signInTab: 'Sign In',
    signUpTab: 'Create Account',
    signUpButton: 'Create Account',
    heroTagline: 'AI-Powered Patient Literacy',
    heroHeading1: 'Understand Your Health.',
    heroHeading2: 'Navigate with Confidence.',
    heroText: 'Understand medical reports in simple words.',
    startUnderstanding: 'Start Understanding My Report',
    seeHowItHelps: 'See How It Helps',
    seeStepsButton: 'See the Steps',
    home: 'Home',
    tools: 'Tools',
    healthNav: 'Health',
    faqNav: 'FAQ',
    languageSelect: 'Language',
    langEnglish: 'English',
    langHindi: 'Hindi',
    langKannada: 'Kannada',
    langTamil: 'Tamil',
    langMalayalam: 'Malayalam',
    langTelugu: 'Telugu',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g. Susan Matilda',
    emailAddressLabel: 'Email Address',
    emailAddressPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: '••••••••',
    preferredLanguageLabel: 'Preferred Language',
    preferredLanguagePlaceholder: 'Select your language',
    preferredHospitalLabel: 'Preferred Hospital',
    preferredHospitalPlaceholder: 'e.g. Apollo Hospital, Chennai',
    more: 'More',
    analyzeReport: 'Analyze Report',
    voiceAssistant: 'Voice Assistant',
    nearbyHospitals: 'Nearby Hospitals',
    preferences: 'Preferences',
    howItWorks: 'How It Works',
    reviews: 'Reviews',
    contact: 'Contact',
    themeDark: 'Dark',
    themeLight: 'Light',
    languageSelect: 'Language',
    reportSectionTitle: 'Understand Your Medical Report',
    reportSectionDescription: 'Upload a report and get a clear explanation.',
    reportStatusText: 'Upload a report and see the main points clearly.',
    statsTerms: 'Terms Decoded',
    statsClarityRate: 'Clarity Rate',
    statsSupport: 'Support',
    demoWalkthroughLabel: 'Simple guide for every patient',
    demoWalkthroughTitle: 'A calm, easy way to understand medical information and next steps',
    demoWalkthroughText: 'Simple help for reports, care steps, and hospital questions.',
    demoVideoLabel: 'Demo walkthrough',
    demoVideoHeading: 'How MedClarity helps in real life',
    demoVideoText: 'Watch a guided example showing how a report is simplified, how hospital options are explained, and how voice support makes the experience easier for families and seniors.',
    decodeNowButton: 'Decode Now',
    hospitalNavigatorTitle: 'Hospital Navigator',
    hospitalNavigatorDescription: 'Find hospitals near you, get directions, and see which ones have emergency care.',
    navigateNowButton: 'Navigate Now',
    voiceReaderTitle: 'Voice Reader',
    voiceReaderDescription: 'Have your health report read to you aloud — perfect if reading is difficult.',
    listenNowButton: 'Listen Now',
    myPreferencesTitle: 'My Preferences',
    myPreferencesDescription: 'Save your name, language, and preferred hospital and see your personal profile card.',
    setPreferencesButton: 'Set Preferences',
    howLabel: 'How it works',
    howHeading: 'A simple path from confusion to clarity',
    howDescription: 'A simple path from upload to clarity.',
    step1Title: 'Upload Report',
    step1Text: 'Photo, PDF, or document — we make it simple to begin.',
    step2Title: 'We Decode It',
    step2Text: 'Medical terms are rewritten in plain, everyday language.',
    step3Title: 'Explore Guidance',
    step3Text: 'Learn what questions to ask and what to do next.',
    step4Title: 'Decide Confidently',
    step4Text: 'Walk into your appointment prepared and informed.',
    reviewsLabel: 'Patient stories',
    reviewsHeading: 'What Our Users Say',
    reviewsDescription: 'Helpful feedback from patients and caregivers.',
    review1Quote: '"MedClarity explained my blood test in 2 minutes. I finally understood my cholesterol and knew exactly what to change in my diet."',
    review1Author: 'Ravi Kumar',
    review1Role: 'Bangalore · Patient',
    review2Quote: '"The hospital navigator was a lifesaver when I travelled to a new city for surgery. Knew exactly where to go and what documents to carry."',
    review2Author: 'Priya Joshi',
    review2Role: 'Pune · Caregiver',
    review3Quote: '"Medical jargon always scared me. MedClarity made my discharge summary feel like a friendly letter. My daughter set it up and I use it every week."',
    review3Author: 'Suresh Mehta',
    review3Role: 'Chennai · Senior Patient',
    dropZoneTitle: 'Drag & Drop Your Report Here',
    dropZoneSubtitle: 'Supports PDF, Word (DOCX), image (PNG / JPG), and text files (TXT)',
    chooseFileButton: 'Choose a File from My Device',
    voiceSectionTitle: 'Read My Report Aloud',
    voiceSectionDescription: 'Paste text or speak aloud for a simple reading experience.',
    hospitalsSectionTitle: 'Find a Hospital Near You',
    hospitalsSectionDescription: 'Find the nearest hospital quickly.',
    findHospitalsButton: 'Find Hospitals Near Me',
    preferencesSectionTitle: 'My Preferences',
    preferencesSectionDescription: 'Save your language, hospital, and personal details.',
    savePreferencesButton: 'Save My Preferences',
    clearButton: 'Clear',
    readyHospitalTitle: 'Ready to find hospitals near you',
    readyHospitalText: 'Tap the button above and allow location access when asked. Your location stays private and is never stored.',
    healthHub: 'Health Literacy Hub',
    faqCenter: 'FAQ Center',
    healthHubHeadline: 'Health Literacy Hub',
    healthHubIntro: 'Short health guides in simple language.',
    healthSearchInfo: 'Quickly find the health topic you need, whether it is symptoms, tests, or simple guidance.',
    healthSearchLabel: 'Search health topics',
    healthSearchPlaceholder: 'Search health topics…',
    noHealthResults: 'No matching topics found. Try another keyword.',
    healthHubDiabetesTitle: 'Diabetes Made Simple',
    healthHubDiabetesText: 'Diabetes happens when the body cannot use sugar properly. Common signs are feeling very thirsty, needing to pee often, slow-healing wounds, and feeling tired. Managing it means eating balanced meals, taking medicines if prescribed, and checking blood sugar regularly.',
    healthHubDiabetesTip1: 'Know your blood sugar targets and follow your doctor’s plan.',
    healthHubDiabetesTip2: 'Small changes such as a daily walk can make a big difference.',
    healthHubBloodPressureTitle: 'Blood Pressure Basics',
    healthHubBloodPressureText: 'Blood pressure measures how hard your blood pushes against your arteries. Two numbers appear in a report: systolic (top) and diastolic (bottom). High blood pressure may not cause symptoms, but it raises the risk of stroke, heart attack, and kidney problems.',
    healthHubBloodPressureTip1: 'Aim for regular checks and share the numbers with your doctor.',
    healthHubBloodPressureTip2: 'Healthy food, less salt, and gentle exercise help keep pressure lower.',
    healthHubHeartHealthTitle: 'Heart Health Signals',
    healthHubHeartHealthText: 'Heart health is about more than chest pain. Look for tiredness during walking, shortness of breath, swelling in the feet, or feeling tight in the chest. These can be signs that your heart needs attention.',
    healthHubHeartHealthTip1: 'Tell a doctor if you feel heaviness, nausea, or sweating with activity.',
    healthHubHeartHealthTip2: 'Simple habits like gentle activity and avoiding tobacco protect your heart.',
    healthHubReportTermsTitle: 'Report Terms to Know',
    healthHubReportTermsText: 'Medical reports often mention sugar, cholesterol, kidney function, and liver tests. These numbers tell your doctor whether your body is balanced or needs a change in medicines, diet, or care.',
    healthHubReportTermsTip1: 'HbA1c shows your average blood sugar over months, not just one day.',
    healthHubReportTermsTip2: 'Ask if a number is normal for your age, gender, or health history.',
    faqTitle: 'FAQ Center',
    faqIntro: 'Common questions about using MedClarity.',
    faqQ1: 'What should I upload to get help?',
    faqA1: 'Upload lab reports, prescriptions, doctor notes, or test results. The tool turns them into simple words so you know what the numbers mean.',
    faqQ2: 'How do I read my report results?',
    faqA2: 'The analyzer highlights important values, explains whether they are normal, and tells you what to ask your doctor next.',
    faqQ3: 'Can I use this site in Hindi?',
    faqA3: 'Yes. Choose Hindi from the language selector at the top and the entire site will update instantly.',
    faqQ4: 'What if I need nearby care urgently?',
    faqA4: 'Open the Nearby Hospitals tool, allow location access, and it will show nearby hospitals, emergency centers, and directions.',
    hospitalSearchLabel: 'Search nearby hospitals',
    hospitalSearchPlaceholder: 'Search hospitals by name or area…',
    noHospitalResults: 'No hospitals match your search. Clear the filter to see all results.',
    faqQ5: 'What if I still have questions after reading?',
    faqA5: 'You can use the voice assistant, save the summary, or show it to a family member or doctor for extra help.',
    prefSavedError: 'Please fill in at least one field before saving.',
    prefSavedSuccess: '✓ Your preferences have been saved!',
    prefStatusSaved: 'Done! Your Patient Profile Card has been updated below.',
    prefCleared: 'Preferences cleared.',
    prefStatusCleared: 'All preferences have been cleared. Fill in and save again.',
    prefNameRequired: 'Please enter at least 2 characters for name.',
    prefHospitalTooLong: 'Please keep the hospital name under 80 characters.',
    platformFeatures: 'Platform Features',
    everythingNeeded: 'Everything You Need to Understand Your Health',
    elderlyDescription: 'Simple tools for reports, care steps, and nearby support.',
    readyToTakeControl: 'Ready to Take Control of Your Healthcare?',
    startUnderstanding: 'Start understanding your reports with clear, simple support.',
    contactUs: 'Contact Us',
    copyrightNotice: '© 2026 MedClarity · Susan Matilda · 1 MCA B · Reg. No: 2647254',
    
    // Voice & Utilities Tabs
    voiceInputInstruction: 'Use voice input and text-to-speech so reading your health information is simple and comfortable.',
    readAloud: 'Read aloud',
    dictation: 'Dictation',
    shareResults: 'Share results',
    speakInsteadText: 'Speak Instead of Typing',
    tapMicrophone: 'Tap the microphone button and speak. Your words will appear in the box below.',
    reportTextPlaceholder: 'Report Text (paste or type here)',
    readReportBtn: 'Read Report Aloud',
    stopReadingBtn: 'Stop Reading',
    shareSummaryBtn: 'Share Summary',
    
    // Facilities Tab
    oneTap: 'One tap',
    nearbyFacilities: 'Nearby facilities',
    liveMap: 'Live map',
    
    // Profile Management
    yourName: 'Your Name',
    preferredLanguage: 'Preferred Language',
    selectLanguageOpt: 'Select your language',
    preferredHospital: 'Preferred Hospital',
    savePreferencesBtn: 'Save My Preferences',
    clearBtn: 'Clear',
    patientProfileCardHeader: 'Your Patient Profile Card',
    privacyNotice: 'Your preferences are stored only in this browser window and are never sent anywhere.',
    
    // Features Badges
    personalProfileBadge: 'Personal profile',
    languageChoiceBadge: 'Language choice',
    hospitalMatchBadge: 'Hospital match',
    
    // Authentication & Validation
    emailAddressLabel: 'Email Address',
    passwordLabel: 'Password',
    fullNameLabel: 'Full Name',
    confirmPasswordLabel: 'Confirm Password',
    passwordRequirementHint: 'Use 8 or more characters with at least one capital letter, one number, and one symbol (like @, !, #).'
  },
  ta: {
    greeting: 'வணக்கம்',
    logoutButton: 'வெளியேறு',
    signInButton: 'சைன் இன்',
    secureAccess: 'பாதுகாப்பான அணுகல்',
    welcomeTitle: 'மெட்கிளாரிட்டிக்கு (MedClarity) உங்களை வரவேற்கிறோம்',
    authSubtitle: 'தொடர சைன் இன் செய்யவும் அல்லது சில நொடிகளில் இலவச கணக்கை உருவாக்கவும்.',
    signInTab: 'சைன் இன்',
    signUpTab: 'கணக்கை உருவாக்கு',
    signUpButton: 'கணக்கை உருவாக்கு',
    heroTagline: 'ஏஐ-மூலம் இயங்கும் நோயாளி கல்வியறிவு',
    heroHeading1: 'உங்கள் ஆரோக்கியத்தைப் புரிந்து கொள்ளுங்கள்.',
    heroHeading2: 'நம்பிக்கையுடன் கையாளுங்கள்.',
    heroText: 'மெட்கிளாரிட்டி குழப்பமான மருத்துவ அறிக்கைகளை எளிய, அன்றாட மொழியாக மாற்றுகிறது. இது முதியவர்கள், குடும்பங்கள் மற்றும் மருத்துவ வார்த்தைகளால் திணறுபவர்கள் அனைவரும் தங்கள் மருத்துவ சிகிச்சையை நம்பிக்கையுடன் புரிந்துகொள்ள உதவுகிறது.',
    startUnderstanding: 'எனது அறிக்கையைப் புரிந்துகொள்ளத் தொடங்கு',
    seeHowItHelps: 'இது எவ்வாறு உதவுகிறது என்று பாருங்கள்',
    seeStepsButton: 'வழிமுறைகளைப் பார்க்கவும்',
    home: 'முகப்பு',
    tools: 'கருவிகள்',
    healthNav: 'ஆரோக்கியம்',
    faqNav: 'கேள்வி-பதில்',
    more: 'மேலும்',
    analyzeReport: 'அறிக்கையை ஆய்வு செய்',
    voiceAssistant: 'குரல் உதவியாளர்',
    nearbyHospitals: 'அருகிலுள்ள மருத்துவமனைகள்',
    preferences: 'விருப்பத்தேர்வுகள்',
    howItWorks: 'இது எவ்வாறு செயல்படுகிறது',
    reviews: 'மதிப்புரைகள்',
    contact: 'தொடர்பு கொள்ள',
    themeDark: 'இருண்ட நிறம்',
    themeLight: 'ஒளி நிறம்',
    languageSelect: 'மொழி',
    reportSectionTitle: 'உங்கள் மருத்துவ அறிக்கையைப் புரிந்து கொள்ளுங்கள்',
    reportSectionDescription: 'உங்கள் மருத்துவக் கோப்பை கீழே பதிவேற்றவும். நாங்கள் அதைப் படித்து எளிய சொற்களில் விளக்குவோம் — மருத்துவ அறிவு எதுவும் தேவையில்லை.',
    reportStatusText: 'மருத்துவ அறிக்கையை உடனடியாகப் பதிவேற்றி, உங்களுக்காகத் தெளிவாக ஒழுங்கமைக்கப்பட்ட முக்கியக் கண்டுபிடிப்புகளைப் பாருங்கள்.',
    statsTerms: 'விளக்கப்பட்ட சொற்கள்',
    statsClarityRate: 'தெளிவு விகிதம்',
    statsSupport: 'ஆதரவு',
    demoWalkthroughLabel: 'ஒவ்வொரு நோயாளிக்குமான எளிய வழிகாட்டி',
    demoWalkthroughTitle: 'மருத்துவத் தகவல்களையும் அடுத்த கட்ட நடவடிக்கைகளையும் புரிந்துகொள்வதற்கான அமைதியான, எளிதான வழி',
    demoWalkthroughText: 'ஆய்வக முடிவுகள், டிஸ்சார்ஜ் ஆவணங்கள் அல்லது மருத்துவமனை வழிமுறைகளைப் பார்க்கும்போது பலர் பதற்றமடைகிறார்கள். மெட்கிளாரிட்டி அவற்றை எளிய, நட்பான விளக்கங்களாக மாற்றுகிறது, இதனால் நீங்கள் சிறந்த கேள்விகளைக் கேட்கவும், மேலும் தயாராக இருக்கவும் முடியும்.',
    demoVideoLabel: 'செயல்முறை விளக்கம்',
    demoVideoHeading: 'நிஜ வாழ்க்கையில் மெட்கிளாரிட்டி எவ்வாறு உதவுகிறது',
    demoVideoText: 'ஒரு அறிக்கை எவ்வாறு எளிமைப்படுத்தப்படுகிறது, மருத்துவமனை விருப்பங்கள் எவ்வாறு விளக்கப்படுகின்றன மற்றும் குரல் ஆதரவு எவ்வாறு குடும்பங்களுக்கும் முதியவர்களுக்கும் அனுபவத்தை எளிதாக்குகிறது என்பதைக் காட்டும் வழிகாட்டப்பட்ட உதாரணத்தைப் பாருங்கள்.',
    decodeNowButton: 'இப்போதே புரிந்துகொள்',
    hospitalNavigatorTitle: 'மருத்துவமனை வழிகாட்டி',
    hospitalNavigatorDescription: 'உங்களுக்கு அருகிலுள்ள மருத்துவமனைகளைக் கண்டறியவும், வழிகளைப் பெறவும், அவசர சிகிச்சை உள்ளவைகளைக் கண்டறியவும்.',
    navigateNowButton: 'இப்போதே வழியைக் காண்',
    voiceReaderTitle: 'குரல் வாசிப்பாளர்',
    voiceReaderDescription: 'உங்கள் சுகாதார அறிக்கையை உங்களுக்காக உரக்கப் படிக்கக் கேளுங்கள் — வாசிப்பது கடினமாக இருந்தால் இது மிகவும் பொருத்தமானது.',
    listenNowButton: 'இப்போதே கேளுங்கள்',
    myPreferencesTitle: 'எனது விருப்பத்தேர்வுகள்',
    myPreferencesDescription: 'உங்கள் பெயர், மொழி மற்றும் விருப்பமான மருத்துவமனையைச் சேமித்து, உங்கள் தனிப்பட்ட சுயவிவர அட்டையைப் பாருங்கள்.',
    setPreferencesButton: 'விருப்பங்களை அமை',
    howLabel: 'செயல்படும் முறை',
    howHeading: 'குழப்பத்திலிருந்து தெளிவை நோக்கிய ஒரு எளிய பாதை',
    howDescription: 'ஒவ்வொரு படியும் அமைதியாகவும், காட்சிப்பூர்வமாகவும், பின்பற்றுவதற்கு எளிதாகவும் வடிவமைக்கப்பட்டுள்ளது, இதனால் யாரும் விடுபட்டதாக உணர மாட்டார்கள்.',
    step1Title: 'அறிக்கையைப் பதிவேற்றவும்',
    step1Text: 'புகைப்படம், PDF அல்லது ஆவணம் — தொடங்குவதை நாங்கள் எளிதாக்குகிறோம்.',
    step2Title: 'நாங்கள் விளக்குகிறோம்',
    step2Text: 'மருத்துவச் சொற்கள் எளிய, அன்றாட மொழியில் மீண்டும் எழுதப்படுகின்றன.',
    step3Title: 'வழிகாட்டுதலை ஆராயுங்கள்',
    step3Text: 'என்ன கேள்விகளைக் கேட்க வேண்டும், அடுத்து என்ன செய்ய வேண்டும் என்பதைத் தெரிந்துகொள்ளுங்கள்.',
    step4Title: 'நம்பிக்கையுடன் முடிவெடுங்கள்',
    step4Text: 'தயாராகவும் விவரம் அறிந்தவராகவும் உங்கள் மருத்துவச் சந்திப்பிற்குச் செல்லுங்கள்.',
    reviewsLabel: 'நோயாளிகளின் கதைகள்',
    reviewsHeading: 'எங்கள் பயனர்கள் கூறுவது',
    reviewsDescription: 'குடும்பங்கள், பராமரிப்பாளர்கள் மற்றும் முதியவர்கள் மெட்கிளாரிட்டியைப் பயன்படுத்துகிறார்கள், ஏனெனில் இது அவர்களுக்குத் தனியாக இல்லை என்ற உணர்வையும் கூடுதல் தகவல்களையும் தருகிறது.',
    review1Quote: '"மெட்கிளாரிட்டி எனது இரத்தப் பரிசோதனையை 2 நிமிடங்களில் விளக்கியது. இறுதியாக எனது கொழுப்பின் அளவைப் புரிந்து கொண்டு, எனது உணவில் எதை மாற்ற வேண்டும் என்பதைத் துல்லியமாகத் தெரிந்துகொண்டேன்."',
    review1Author: 'ரவி குமார்',
    review1Role: 'பெங்களூரு · நோயாளி',
    review2Quote: '"அறுவை சிகிச்சைக்காக ஒரு புதிய நகரத்திற்குச் சென்றபோது மருத்துவமனை வழிகாட்டி ஒரு உயிர் காப்பானாக இருந்தது. எங்கு செல்ல வேண்டும், என்ன ஆவணங்களை எடுத்துச் செல்ல வேண்டும் என்பதைத் துல்லியமாக அறிந்திருந்தேன்."',
    review2Author: 'பிரியா ஜோஷி',
    review2Role: 'புனே · பராமரிப்பாளர்',
    review3Quote: '"மருத்துவக் கலைச்சொற்கள் எப்போதும் என்னை பயமுறுத்தும். மெட்கிளாரிட்டி எனது டிஸ்சார்ஜ் சுருக்கத்தை ஒரு நட்பான கடிதத்தைப் போல உணர வைத்தது. என் மகள் இதை அமைத்துக் கொடுத்தாள், நான் இதை ஒவ்வொரு வாரமும் பயன்படுத்துகிறேன்."',
    review3Author: 'சுரேஷ் மேத்தா',
    review3Role: 'சென்னை · மூத்த நோயாளி',
    dropZoneTitle: 'உங்கள் அறிக்கையை இங்கே இழுத்து விடவும் (Drag & Drop)',
    dropZoneSubtitle: 'PDF, Word (DOCX), படம் (PNG / JPG) மற்றும் உரை கோப்புகளை (TXT) ஆதரிக்கிறது',
    chooseFileButton: 'எனது சாதனத்திலிருந்து ஒரு கோப்பைத் தேர்ந்தெடு',
    voiceSectionTitle: 'எனது அறிக்கையை உரக்கப் படிக்கவும்',
    voiceSectionDescription: 'உங்கள் அறிக்கை உரையை கீழே ஒட்டி, "அறிக்கையை உரக்கப் படி" என்பதை அழுத்தவும். நீங்கள் மைக்ரோஃபோனைத் தட்டிப் பேசலாம், நாங்கள் அதை உங்களுக்காக எழுதுவோம்.',
    hospitalsSectionTitle: 'உங்களுக்கு அருகிலுள்ள ஒரு மருத்துவமனையைக் கண்டறியவும்',
    hospitalsSectionDescription: 'கீழே உள்ள பொத்தானை அழுத்தி, இருப்பிட அணுகலை (Location Access) அனுமதிக்கவும். வழிகள் மற்றும் தொடர்பு எண்களுடன் அருகிலுள்ள மருத்துவமனைகளை நாங்கள் உங்களுக்குக் காண்பிப்போம்.',
    findHospitalsButton: 'எனக்கு அருகிலுள்ள மருத்துவமனைகளைக் கண்டறி',
    preferencesSectionTitle: 'எனது விருப்பத்தேர்வுகள்',
    preferencesSectionDescription: 'உங்கள் விவரங்களைக் கீழே பூர்த்தி செய்து "சேமி" என்பதை அழுத்தவும். கேன்வாஸ் (Canvas API) மூலம் வரையப்பட்ட உங்கள் தனிப்பட்ட சுயவிவர அட்டை கீழே தோன்றும்.',
    savePreferencesButton: 'எனது விருப்பங்களைச் சேமி',
    clearButton: 'அழி',
    readyHospitalTitle: 'உங்களுக்கு அருகிலுள்ள மருத்துவமனைகளைக் கண்டறியத் தயார்',
    readyHospitalText: 'மேலே உள்ள பொத்தானைத் தட்டி, கேட்கும்போது இருப்பிட அணுகலை அனுமதிக்கவும். உங்கள் இருப்பிடம் தனிப்பட்டதாக இருக்கும், அது ஒருபோதும் சேமிக்கப்படாது.',
    healthHub: 'ஆரோக்கிய அறிவு மையம்',
    faqCenter: 'கேள்வி-பதில் மையம்',
    healthHubHeadline: 'ஆரோக்கிய அறிவு மையம்',
    healthHubIntro: 'நம்பகமான ஆரோக்கிய அடிப்படைகள், பொதுவான அறிகுறிகள் மற்றும் தெளிவான வழிகாட்டுதல்களை ஆராயுங்கள், இதன் மூலம் உங்கள் சொந்த சிகிச்சையைப் பற்றி நீங்கள் அதிக நம்பிக்கையுடன் இருக்க முடியும்.',
    healthSearchInfo: 'அறிகுறிகள், சோதனைகள் அல்லது எளிய வழிகாட்டுதல் எதுவாக இருந்தாலும், உங்களுக்குத் தேவையான ஆரோக்கிய தலைப்பை விரைவாகக் கண்டறியவும்.',
    healthSearchLabel: 'ஆரோக்கிய தலைப்புகளைத் தேடுங்கள்',
    healthSearchPlaceholder: 'ஆரோக்கிய தலைப்புகளைத் தேடுங்கள்…',
    noHealthResults: 'பொருந்தும் தலைப்புகள் எதுவும் இல்லை. வேறு வார்த்தையை முயற்சிக்கவும்.',
    healthHubDiabetesTitle: 'நீரிழிவு நோய் - எளிய விளக்கம்',
    healthHubDiabetesText: 'உடலால் சர்க்கரையை சரியாகப் பயன்படுத்த முடியாதபோது நீரிழிவு நோய் (சர்க்கரை நோய்) ஏற்படுகிறது. அதிக தாகம், அடிக்கடி சிறுநீர் கழிக்க வேண்டிய அவசியம், மெதுவாக ஆறக்கூடிய காயங்கள் மற்றும் சோர்வு ஆகியவை பொதுவான அறிகுறிகளாகும். இதை நிர்வகிப்பது என்பது சீரான உணவை உண்பது, பரிந்துரைக்கப்பட்ட மருந்துகளை உட்கொள்வது மற்றும் இரத்தச் சர்க்கரையைத் தவறாமல் பரிசோதிப்பது ஆகும்.',
    healthHubDiabetesTip1: 'உங்கள் இரத்தச் சர்க்கரை இலக்குகளைத் தெரிந்துகொண்டு உங்கள் மருத்துவரின் திட்டத்தைப் பின்பற்றுங்கள்.',
    healthHubDiabetesTip2: 'தினசரி நடைப்பயிற்சி போன்ற சிறிய மாற்றங்கள் பெரிய மாற்றத்தை ஏற்படுத்தும்.',
    healthHubBloodPressureTitle: 'இரத்த அழுத்த அடிப்படைகள்',
    healthHubBloodPressureText: 'இரத்த அழுத்தம் என்பது உங்கள் தமனிகளுக்கு எதிராக உங்கள் இரத்தம் எவ்வளவு பலமாகத் தள்ளுகிறது என்பதை அளவிடுகிறது. ஒரு அறிக்கையில் இரண்டு எண்கள் தோன்றும்: சிஸ்டாலிக் (மேலே) மற்றும் டயஸ்டாலிக் (கீழே). உயர் இரத்த அழுத்தம் அறிகுறிகளை ஏற்படுத்தாது, ஆனால் அது பக்கவாதம், மாரடைப்பு மற்றும் சிறுநீரகப் பிரச்சினைகளின் அபாயத்தை அதிகரிக்கிறது.',
    healthHubBloodPressureTip1: 'வழக்கமான சோதனைகளை மேற்கொண்டு அந்த எண்களை உங்கள் மருத்துவரிடம் பகிர்ந்து கொள்ளுங்கள்.',
    healthHubBloodPressureTip2: 'ஆரோக்கியமான உணவு, குறைந்த உப்பு மற்றும் மென்மையான உடற்பயிற்சி ஆகியவை இரத்த அழுத்தத்தைக் குறைக்க உதவுகின்றன.',
    healthHubHeartHealthTitle: 'இதய ஆரோக்கிய சமிக்ஞைகள்',
    healthHubHeartHealthText: 'இதய ஆரோக்கியம் என்பது மார்பு வலியை விட மேலானது. நடக்கும்போது சோர்வு, மூச்சுத் திணறல், கால்களில் வீக்கம் அல்லது மார்பில் இறுக்கம் போன்றவற்றை கவனியுங்கள். இவை உங்கள் இதயத்திற்கு கவனிப்பு தேவை என்பதற்கான அறிகுறிகளாக இருக்கலாம்.',
    healthHubHeartHealthTip1: 'செயல்பாட்டின் போது கனம், குமட்டல் அல்லது வியர்த்தல் போன்றவற்றை உணர்ந்தால் மருத்துவரிடம் தெரிவிக்கவும்.',
    healthHubHeartHealthTip2: 'மென்மையான செயல்பாடு மற்றும் புகையிலையைத் தவிர்த்தல் போன்ற எளிய பழக்கங்கள் உங்கள் இதயத்தைப் பாதுகாக்கின்றன.',
    healthHubReportTermsTitle: 'தெரிந்து கொள்ள வேண்டிய அறிக்கைச் சொற்கள்',
    healthHubReportTermsText: 'மருத்துவ அறிக்கைகள் பெரும்பாலும் சர்க்கரை, கொலஸ்ட்ரால், சிறுநீரக செயல்பாடு மற்றும் கல்லீரல் பரிசோதனைகளைக் குறிப்பிடுகின்றன. இந்த எண்கள் உங்கள் உடல் சீராக இருக்கிறதா அல்லது மருந்துகள், உணவு அல்லது சிகிச்சையில் மாற்றம் தேவையா என்பதை உங்கள் மருத்துவருக்குத் தெரிவிக்கின்றன.',
    healthHubReportTermsTip1: 'HbA1c என்பது ஒரு நாள் மட்டுமல்லாமல், பல மாதங்களில் உங்கள் சராசரி இரத்தச் சர்க்கரையைக் காட்டுகிறது.',
    healthHubReportTermsTip2: 'ஒரு எண் உங்கள் வயது, பாலினம் அல்லது சுகாதார வரலாற்றிற்கு இயல்பானதா என்று கேளுங்கள்.',
    faqTitle: 'கேள்வி-பதில் மையம்',
    faqIntro: 'முதியவர்கள், பராமரிப்பாளர்கள் மற்றும் மெட்கிளாரிட்டியை எளிதாகப் பயன்படுத்த விரும்பும் எவருக்கும் தேவையான கேள்விகள் மற்றும் பதில்கள்.',
    faqQ1: 'உதவி பெற நான் எதைப் பதிவேற்ற வேண்டும்?',
    faqA1: 'ஆய்வக அறிக்கைகள், மருந்துச் சீட்டுகள், மருத்துவர் குறிப்புகள் அல்லது சோதனை முடிவுகளைப் பதிவேற்றவும். இந்த கருவி அவற்றை எளிய சொற்களாக மாற்றுகிறது, இதன் மூலம் எண்கள் என்ன அர்த்தம் என்பதை நீங்கள் அறிந்து கொள்ளலாம்.',
    faqQ2: 'எனது அறிக்கை முடிவுகளை நான் எவ்வாறு படிப்பது?',
    faqA2: 'ஆய்வாளர் முக்கியமான மதிப்புகளை முன்னிலைப்படுத்துகிறார், அவை இயல்பானவையா என்பதை விளக்குகிறார், மேலும் உங்கள் மருத்துவரிடம் அடுத்து என்ன கேட்க வேண்டும் என்று உங்களுக்குக் கூறுகிறார்.',
    faqQ3: 'இந்த தளத்தை நான் இந்தியில் பயன்படுத்தலாமா?',
    faqA3: 'ஆம். மேலே உள்ள மொழித் தேர்விலிருந்து இந்தியைத் தேர்ந்தெடுக்கவும், முழு தளமும் உடனடியாக புதுப்பிக்கப்படும்.',
    faqQ4: 'அருகிலுள்ள அவசர சிகிச்சை எனக்குத் தேவைப்பட்டால் என்ன செய்வது?',
    faqA4: 'அருகிலுள்ள மருத்துவமனைகள் கருவியைத் திறந்து, இருப்பிட அணுகலை அனுமதிக்கவும், அது அருகிலுள்ள மருத்துவமனைகள், அவசர சிகிச்சை மையங்கள் மற்றும் வழிகளைக் காண்பிக்கும்.',
    hospitalSearchLabel: 'அருகிலுள்ள மருத்துவமனைகளைத் தேடுங்கள்',
    hospitalSearchPlaceholder: 'மருத்துவமனைகளை பெயர் அல்லது பகுதி வாரியாகத் தேடுங்கள்…',
    noHospitalResults: 'உங்கள் தேடலுக்கு எந்த மருத்துவமனைகளும் பொருந்தவில்லை. அனைத்து முடிவுகளையும் காண வடிகட்டியை அழிக்கவும்.',
    faqQ5: 'படித்த பிறகும் எனக்கு கேள்விகள் இருந்தால் என்ன செய்வது?',
    faqA5: 'நீங்கள் குரல் உதவியாளரைப் பயன்படுத்தலாம், சுருக்கத்தைச் சேமிக்கலாம் அல்லது கூடுதல் உதவிக்கு குடும்ப உறுப்பினர் அல்லது மருத்துவரிடம் காட்டலாம்.',
    prefSavedError: 'சேமிப்பதற்கு முன் குறைந்தபட்சம் ஒரு புலத்தையாவது நிரப்பவும்.',
    prefSavedSuccess: '✓ உங்கள் விருப்பத்தேர்வுகள் சேமிக்கப்பட்டன!',
    prefStatusSaved: 'முடிந்தது! உங்கள் நோயாளி சுயவிவர அட்டை கீழே புதுப்பிக்கப்பட்டுள்ளது.',
    prefCleared: 'விருப்பத்தேர்வுகள் அழிக்கப்பட்டன.',
    prefStatusCleared: 'அனைத்து விருப்பத்தேர்வுகளும் அழிக்கப்பட்டன. மீண்டும் பூர்த்தி செய்து சேமிக்கவும்.',
    prefNameRequired: 'பெயருக்கு குறைந்தபட்சம் 2 எழுத்துக்களை உள்ளிடவும்.',
    prefHospitalTooLong: 'மருத்துவமனையின் பெயரை 80 எழுத்துகளுக்குள் வைத்திருக்கவும்.',
    platformFeatures: 'தளத்தின் அம்சங்கள்',
    everythingNeeded: 'உங்கள் ஆரோக்கியத்தைப் புரிந்துகொள்ள உங்களுக்குத் தேவையான அனைத்தும்',
    elderlyDescription: 'குழப்பமான ஆய்வக முடிவுகள் முதல் மருத்துவமனை வழிகள் வரை, ஒவ்வொரு கருவியும் முதியவர்கள் ಮತ್ತು பராமரிப்பாளர்களுக்காக எளிமையாகவும், தெளிவாகவும், உதவியாகவும் வடிவமைக்கப்பட்டுள்ளது.',
    readyToTakeControl: 'உங்கள் சுகாதாரப் பாதுகாப்பைக் கட்டுக்குள் கொண்டுவரத் தயாரா?',
    startUnderstanding: 'உங்கள் அறிக்கைகளைப் புரிந்துகொண்டு, நம்பிக்கையுடன் மருத்துவச் சேவைகளைப் பயன்படுத்தத் தொடங்குங்கள். மருத்துவப் பட்டம் தேவையில்லை.',
    contactUs: 'எங்களைத் தொடர்பு கொள்ளவும்',
    copyrightNotice: '© 2026 மெட்கிளாரிட்டி · சூசன் மாடில்டா · 1 MCA B · பதிவு எண்: 2647254',
    voiceInputInstruction: 'குரல் உள்ளீடு மற்றும் உரையிலிருந்து பேச்சு அம்சத்தைப் பயன்படுத்துங்கள், ಇದರಿಂದ உங்கள் சுகாதாரத் தகவலைப் படிப்பது எளிமையாகவும் வசதியாகவும் இருக்கும்.',
    readAloud: 'சத்தமாக வாசி',
    dictation: 'குரல் எழுதுதல்',
    shareResults: 'முடிவுகளைப் பகிர்ந்து கொள்ளுங்கள்',
    speakInsteadText: 'தட்டச்சு செய்வதற்குப் பதிலாகப் பேசுங்கள்',
    tapMicrophone: 'மைக்ரோஃபோன் பொத்தானைத் தட்டிப் பேசுங்கள். ನಿಮ್ಮ வார்த்தைகள் கீழே உள்ள பெட்டியில் தோன்றும்.',
    reportTextPlaceholder: 'அறிக்கை உரை (இங்கே ஒட்டவும் அல்லது தட்டச்சு செய்யவும்)',
    readReportBtn: 'அறிக்கையைச் சத்தமாக வாசி',
    stopReadingBtn: 'வாசிப்பதை நிறுத்து',
    shareSummaryBtn: 'சுருக்கத்தைப் பகிர்ந்து கொள்ளுங்கள்',
    oneTap: 'ஒரு தட்டல்',
    nearbyFacilities: 'அருகிலுள்ள வசதிகள்',
    liveMap: 'நேரடி வரைபடம்',
    yourName: 'உங்கள் பெயர்',
    preferredLanguage: 'விருப்பமான மொழி',
    selectLanguageOpt: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    preferredHospital: 'விருப்பமான மருத்துவமனை',
    savePreferencesBtn: 'என் விருப்பங்களைச் சேமி',
    clearBtn: 'அழி',
    patientProfileCardHeader: 'உங்கள் நோயாளி சுயவிவர அட்டை',
    privacyNotice: 'உங்கள் விருப்பத்தேர்வுகள் இந்த உலாவி சாளரத்தில் மட்டுமே சேமிக்கப்படும், அவை எங்கும் அனுப்பப்படாது.',
    personalProfileBadge: 'சுயவிவரம்',
    languageChoiceBadge: 'மொழித் தேர்வு',
    hospitalMatchBadge: 'மருத்துவமனைப் பொருத்தம்',
    emailAddressLabel: 'மின்னஞ்சல் முகவரி',
    passwordLabel: 'கடவுச்சொல்',
    fullNameLabel: 'முழு பெயர்',
    confirmPasswordLabel: 'கடவுச்சொல்லை உறுதிப்படுத்துக',
    passwordRequirementHint: 'குறைந்தது 8 அல்லது அதற்கு மேற்பட்ட எழுத்துக்களைப் பயன்படுத்தவும், அதில் ஒரு பெரிய எழுத்து, ஒரு எண் மற்றும் ஒரு குறியீடு (যেমন @, !, #) இருக்க வேண்டும்.'
  
  },
  kn: {
    greeting: 'ನಮಸ್ಕಾರ',
    logoutButton: 'ಲಾಗ್ ಔಟ್',
    signInButton: 'ಸೈನ್ ಇನ್',
    secureAccess: 'ಸುರಕ್ಷಿತ ಪ್ರವೇಶ',
    welcomeTitle: 'ಮೆಡ್‌ಕ್ಲಾರಿಟಿಗೆ (MedClarity) ಸುಸ್ವಾಗತ',
    authSubtitle: 'ಮುಂದುವರೆಯಲು ಸೈನ್ ಇನ್ ಮಾಡಿ ಅಥವಾ ಕೆಲವೇ ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಉಚಿತ ಖಾತೆಯನ್ನು ರಚಿಸಿ.',
    signInTab: 'ಸೈನ್ ಇನ್',
    signUpTab: 'ಖಾತೆಯನ್ನು ರಚಿಸಿ',
    signUpButton: 'ಖಾತೆಯನ್ನು ರಚಿಸಿ',
    heroTagline: 'ಎಐ-ಚಾಲಿತ ರೋಗಿ ಸಾಕ್ಷರತೆ',
    heroHeading1: 'ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.',
    heroHeading2: 'ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಮುನ್ನಡೆಯಿರಿ.',
    heroText: 'ಮೆಡ್‌ಕ್ಲಾರಿಟಿ ಗೊಂದಲಮಯ ವೈದ್ಯಕೀಯ ವರದಿಗಳನ್ನು ಸರಳ, ದೈನಂದಿನ ಭಾಷೆಯಾಗಿ ಬದಲಾಯಿಸುತ್ತದೆ. ಇದು ಹಿರಿಯ ನಾಗರಿಕರು, ಕುಟುಂಬಗಳು ಮತ್ತು ವೈದ್ಯಕೀಯ ಪದಗಳಿಂದ ಗೊಂದಲಕ್ಕೊಳಗಾದ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ತಮ್ಮ ಚಿಕಿತ್ಸೆಯನ್ನು ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
    startUnderstanding: 'ನನ್ನ ವರದಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಪ್ರಾರಂಭಿಸಿ',
    seeHowItHelps: 'ಇದು ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ ಎಂದು ನೋಡಿ',
    seeStepsButton: 'ಹಂತಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    home: 'ಮುಖಪುಟ',
    tools: 'ಉಪಕರಣಗಳು',
    healthNav: 'ಆರೋಗ್ಯ',
    faqNav: 'FAQ (ಪ್ರಶ್ನೋತ್ತರ)',
    more: 'ಇನ್ನಷ್ಟು',
    analyzeReport: 'ವರದಿ ವಿಶ್ಲೇಷಿಸಿ',
    voiceAssistant: 'ಧ್ವನಿ ಸಹಾಯಕ',
    nearbyHospitals: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು',
    preferences: 'ಆದ್ಯತೆಗಳು',
    howItWorks: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    reviews: 'ಅಭಿಪ್ರಾಯಗಳು',
    contact: 'ಸಂಪರ್ಕಿಸಿ',
    themeDark: 'ಡಾರ್ಕ್ ಮೋಡ್',
    themeLight: 'ಲೈಟ್ ಮೋಡ್',
    languageSelect: 'ಭಾಷೆ',
    reportSectionTitle: 'ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ವರದಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ',
    reportSectionDescription: 'ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ಫೈಲ್ ಅನ್ನು ಕೆಳಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಾವು ಅದನ್ನು ಓದಿ ಸರಳ ಪದಗಳಲ್ಲಿ ವಿವರಿಸುತ್ತೇವೆ — ಯಾವುದೇ ವೈದ್ಯಕೀಯ ಜ್ಞಾನದ ಅಗತ್ಯವಿಲ್ಲ.',
    reportStatusText: 'ವೈದ್ಯಕೀಯ ವರದಿಯನ್ನು ತಕ್ಷಣ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ನಿಮಗಾಗಿ ಸ್ಪಷ್ಟವಾಗಿ ಜೋಡಿಸಲಾದ ಪ್ರಮುಖ ಅಂಶಗಳನ್ನು ವೀಕ್ಷಿಸಿ.',
    statsTerms: 'ವಿವರಿಸಲಾದ ಪದಗಳು',
    statsClarityRate: 'ಸ್ಪಷ್ಟತೆಯ ದರ',
    statsSupport: 'ಬೆಂಬಲ',
    demoWalkthroughLabel: 'ಪ್ರತಿಯೊಬ್ಬ ರೋಗಿಗೂ ಸರಳ ಮಾರ್ಗದರ್ಶಿ',
    demoWalkthroughTitle: 'ವೈದ್ಯಕೀಯ ಮಾಹಿತಿ ಮತ್ತು ಮುಂದಿನ ಹಂತಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಒಂದು ಸುಲಭ ಮಾರ್ಗ',
    demoWalkthroughText: 'ಲ್ಯಾಬ್ ಫಲಿತಾಂಶಗಳು, ಡಿಸ್ಚಾರ್ಜ್ ಪತ್ರಗಳು ಅಥವಾ ಆಸ್ಪತ್ರೆಯ ಸೂಚನೆಗಳನ್ನು ನೋಡಿದಾಗ ಅನೇಕ ಜನರು ಆತಂಕಕ್ಕೊಳಗಾಗುತ್ತಾರೆ. ಮೆಡ್‌ಕ್ಲಾರಿಟಿ ಅವುಗಳನ್ನು ಸರಳ, ಸ್ನೇಹಪರ ವಿವರಣೆಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ ಇದರಿಂದ ನೀವು ಉತ್ತಮ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು ಮತ್ತು ಹೆಚ್ಚು ಸಿದ್ಧರಾಗಬಹುದು.',
    demoVideoLabel: 'ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ವಿವರಣೆ',
    demoVideoHeading: 'ನಿಜ ಜೀವನದಲ್ಲಿ ಮೆಡ್‌ಕ್ಲಾರಿಟಿ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ',
    demoVideoText: 'ವರದಿಯನ್ನು ಹೇಗೆ ಸರಳಗೊಳಿಸಲಾಗುತ್ತದೆ, ಆಸ್ಪತ್ರೆಯ ಆಯ್ಕೆಗಳನ್ನು ಹೇಗೆ ವಿವರಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ಧ್ವನಿ ಬೆಂಬಲವು ಕುಟುಂಬಗಳು ಮತ್ತು ಹಿರಿಯರಿಗೆ ಅನುಭವವನ್ನು ಹೇಗೆ ಸುಲಭಗೊಳಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ತೋರಿಸುವ ಮಾರ್ಗದರ್ಶಿ ಉದಾಹರಣೆಯನ್ನು ವೀಕ್ಷಿಸಿ.',
    decodeNowButton: 'ಈಗಲೇ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ',
    hospitalNavigatorTitle: 'ಆಸ್ಪತ್ರೆ ಮಾರ್ಗದರ್ಶಿ',
    hospitalNavigatorDescription: 'ನಿಮ್ಮ ಹತ್ತಿರವಿರುವ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಿ, ಮಾರ್ಗಗಳನ್ನು ಪಡೆಯಿರಿ ಮತ್ತು ಯಾವ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ತುರ್ತು ಚಿಕಿತ್ಸೆ ಲಭ್ಯವಿದೆ ಎಂದು ತಿಳಿಯಿರಿ.',
    navigateNowButton: 'ಈಗಲೇ ಮಾರ್ಗ ತಿಳಿಯಿರಿ',
    voiceReaderTitle: 'ಧ್ವನಿ ಓದುಗ',
    voiceReaderDescription: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ವರದಿಯನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿಸಿ ಕೇಳಿ — ಓದಲು ಕಷ್ಟವಾಗುವವರಿಗೆ ಇದು ಅತ್ಯುತ್ತಮವಾಗಿದೆ.',
    listenNowButton: 'ಈಗಲೇ ಆಲಿಸಿ',
    myPreferencesTitle: 'ನನ್ನ ಆದ್ಯತೆಗಳು',
    myPreferencesDescription: 'ನಿಮ್ಮ ಹೆಸರು, ಭಾಷೆ ಮತ್ತು ಆದ್ಯತೆಯ ಆಸ್ಪತ್ರೆಯನ್ನು ಉಳಿಸಿ ಮತ್ತು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಅನ್ನು ವೀಕ್ಷಿಸಿ.',
    setPreferencesButton: 'ಆದ್ಯತೆಗಳನ್ನು ಹೊಂದಿಸಿ',
    howLabel: 'ಕೆಲಸ ಮಾಡುವ ವಿಧಾನ',
    howHeading: 'ಗೊಂದಲದಿಂದ ಸ್ಪಷ್ಟತೆಯ ಕಡೆಗೆ ಒಂದು ಸರಳ ಹಾದಿ',
    howDescription: 'ಪ್ರತಿಯೊಂದು ಹಂತವನ್ನು ಶಾಂತವಾಗಿ, ದೃಶ್ಯರೂಪದಲ್ಲಿ ಮತ್ತು ಸುಲಭವಾಗಿ ಅನುಸರಿಸಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ ಇದರಿಂದ ಯಾರೂ ಹಿಂದೆ ಉಳಿದಂತೆ ಅನಿಸುವುದಿಲ್ಲ.',
    step1Title: 'ವರದಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    step1Text: 'ಫೋಟೋ, PDF ಅಥವಾ ಡಾಕ್ಯುಮೆಂಟ್ — ಪ್ರಾರಂಭಿಸುವುದನ್ನು ನಾವು ಸರಳಗೊಳಿಸುತ್ತೇವೆ.',
    step2Title: 'ನಾವು ವಿವರಿಸುತ್ತೇವೆ',
    step2Text: 'ವೈದ್ಯಕೀಯ ಪದಗಳನ್ನು ಸರಳ, ದೈನಂದಿನ ಭಾಷೆಯಲ್ಲಿ ಮರುಬರೆಯಲಾಗುತ್ತದೆ.',
    step3Title: 'ಮಾರ್ಗದರ್ಶನ ಪರಿಶೀಲಿಸಿ',
    step3Text: 'ಯಾವ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬೇಕು ಮತ್ತು ಮುಂದೆ ಏನು ಮಾಡಬೇಕೆಂದು ತಿಳಿಯಿರಿ.',
    step4Title: 'ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ನಿರ್ಧರಿಸಿ',
    step4Text: 'ಸಂಪೂರ್ಣ ಮಾಹಿತಿ ಮತ್ತು ಸಿದ್ಧತೆಯೊಂದಿಗೆ ನಿಮ್ಮ ವೈದ್ಯರ ಭೇಟಿಗೆ ಹೋಗಿ.',
    reviewsLabel: 'ರೋಗಿಗಳ ಕಥೆಗಳು',
    reviewsHeading: 'ನಮ್ಮ ಬಳಕೆದಾರರು ಏನು ಹೇಳುತ್ತಾರೆ',
    reviewsDescription: 'ಕುಟುಂಬಗಳು, ಆರೈಕೆದಾರರು ಮತ್ತು ಹಿರಿಯ ನಾಗರಿಕರು ಮೆಡ್‌ಕ್ಲಾರಿಟಿಯನ್ನು ಬಳಸುತ್ತಾರೆ ಏಕೆಂದರೆ ಇದು ಅವರಿಗೆ ಹೆಚ್ಚು ಮಾಹಿತಿ ಮತ್ತು ಧೈರ್ಯವನ್ನು ನೀಡುತ್ತದೆ.',
    review1Quote: '"ಮೆಡ್‌ಕ್ಲಾರಿಟಿ ನನ್ನ ರಕ್ತದ ಪರೀಕ್ಷೆಯನ್ನು 2 ನಿಮಿಷಗಳಲ್ಲಿ ವಿವರಿಸಿತು. ಕೊನೆಗೂ ನನ್ನ ಕೊಲೆಸ್ಟ್ರಾಲ್ ಮಟ್ಟವನ್ನು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ ಮತ್ತು ನನ್ನ ಆಹಾರದಲ್ಲಿ ಏನನ್ನು ಬದಲಾಯಿಸಬೇಕು ಎಂದು ನನಗೆ ಸರಿಯಾಗಿ ತಿಳಿಯಿತು."',
    review1Author: 'ರವಿ ಕುಮಾರ್',
    review1Role: 'ಬೆಂಗಳೂರು · ರೋಗಿ',
    review2Quote: '"ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಾಗಿ ನಾನು ಹೊಸ ನಗರಕ್ಕೆ ಪ್ರಯಾಣಿಸಿದಾಗ ಆಸ್ಪತ್ರೆ ಮಾರ್ಗದರ್ಶಿ ನನ್ನ ಜೀವ ಉಳಿಸಿತು. ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು ಮತ್ತು ಯಾವ ದಾಖಲೆಗಳನ್ನು ತೆಗೆದುಕೊಂಡು ಹೋಗಬೇಕು ಎಂದು ನನಗೆ ನಿಖರವಾಗಿ ತಿಳಿದಿತ್ತು."',
    review2Author: 'ಪ್ರಿಯಾ ಜೋಶಿ',
    review2Role: 'ಪುಣೆ · ಆರೈಕೆದಾರರು',
    review3Quote: '"ವೈದ್ಯಕೀಯ ಭಾಷೆ ಯಾವಾಗಲೂ ನನಗೆ ಭಯ ಹುಟ್ಟಿಸುತ್ತಿತ್ತು. ಮೆಡ್‌ಕ್ಲಾರಿಟಿ ನನ್ನ ಡಿಸ್ಚಾರ್ಜ್ ಸಾರಾಂಶವನ್ನು ಒಂದು ಆಪ್ತ ಪತ್ರದಂತೆ ಅನಿಸುವಂತೆ ಮಾಡಿತು. ನನ್ನ ಮಗಳು ಇದನ್ನು ಸೆಟಪ್ ಮಾಡಿಕೊಟ್ಟಿದ್ದಾಳೆ, ನಾನು ಇದನ್ನು ಪ್ರತಿ ವಾರ ಬಳಸುತ್ತೇನೆ."',
    review3Author: 'ಸುರೇಶ್ ಮೆಹ್ತಾ',
    review3Role: 'ಚೆನ್ನೈ · ಹಿರಿಯ ರೋಗಿ',
    dropZoneTitle: 'ನಿಮ್ಮ ವರದಿಯನ್ನು ಇಲ್ಲಿಗೆ ಎಳೆದು ಬಿಡಿ (Drag & Drop)',
    dropZoneSubtitle: 'PDF, Word (DOCX), ಚಿತ್ರ (PNG / JPG) ಮತ್ತು ಪಠ್ಯ ಫೈಲ್‌ಗಳನ್ನು (TXT) ಬೆಂಬಲಿಸುತ್ತದೆ',
    chooseFileButton: 'ನನ್ನ ಸಾಧನದಿಂದ ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ',
    voiceSectionTitle: 'ನನ್ನ ವರದಿಯನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ',
    voiceSectionDescription: 'ನಿಮ್ಮ ವರದಿಯ ಪಠ್ಯವನ್ನು ಕೆಳಗೆ ಪೇಸ್ಟ್ ಮಾಡಿ ಮತ್ತು "ವರದಿಯನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ" ಒತ್ತಿರಿ. ನೀವು ಮೈಕ್ರೊಫೋನ್ ಟ್ಯಾಪ್ ಮಾಡಿ ಮಾತನಾಡಬಹುದು, ನಾವು ಅದನ್ನು ನಿಮಗಾಗಿ ಬರೆಯುತ್ತೇವೆ.',
    hospitalsSectionTitle: 'ನಿಮ್ಮ ಹತ್ತಿರವಿರುವ ಆಸ್ಪತ್ರೆಯನ್ನು ಹುಡುಕಿ',
    hospitalsSectionDescription: 'ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ ಮತ್ತು ಸ್ಥಳ ಪ್ರವೇಶವನ್ನು (Location Access) ಅನುಮತಿಸಿ. ಮಾರ್ಗಗಳು ಮತ್ತು ಸಂಪರ್ಕ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ನಾವು ನಿಮಗೆ ತೋರಿಸುತ್ತೇವೆ.',
    findHospitalsButton: 'ನನ್ನ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಿ',
    preferencesSectionTitle: 'ನನ್ನ ಆದ್ಯತೆಗಳು',
    preferencesSectionDescription: 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಕೆಳಗೆ ಭರ್ತಿ ಮಾಡಿ ಮತ್ತು "ಉಳಿಸಿ" ಒತ್ತಿರಿ. ಕ್ಯಾನ್ವಾಸ್ (Canvas API) ಬಳಸಿ ರಚಿಸಲಾದ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಕೆಳಗೆ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ.',
    savePreferencesButton: 'ನನ್ನ ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ',
    clearButton: 'ಅಳಿಸು',
    readyHospitalTitle: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಲು ಸಿದ್ಧರಾಗಿ',
    readyHospitalText: 'ಮೇಲಿನ ಬಟನ್ ಟ್ಯಾಪ್ ಮಾಡಿ ಮತ್ತು ಕೇಳಿದಾಗ ಸ್ಥಳ ಪ್ರವೇಶವನ್ನು ಅನುಮತಿಸಿ. ನಿಮ್ಮ ಸ್ಥಳವು ಖಾಸಗಿಯಾಗಿರುತ್ತದೆ ಮತ್ತು ಅದನ್ನು ಎಂದಿಗೂ ಉಳಿಸಲಾಗುವುದಿಲ್ಲ.',
    healthHub: 'ಆರೋಗ್ಯ ಸಾಕ್ಷರತಾ ಕೇಂದ್ರ',
    faqCenter: 'ಪ್ರಶ್ನೋತ್ತರ ಕೇಂದ್ರ',
    healthHubHeadline: 'ಆರೋಗ್ಯ ಸಾಕ್ಷರತಾ ಕೇಂದ್ರ',
    healthHubIntro: 'ವಿಶ್ವಾಸಾರ್ಹ ಆರೋಗ್ಯದ ಮೂಲಭೂತ ಅಂಶಗಳು, ಸಾಮಾನ್ಯ ಲಕ್ಷಣಗಳು ಮತ್ತು ಸ್ಪಷ್ಟ ಮಾರ್ಗದರ್ಶನವನ್ನು ಅನ್ವೇಷಿಸಿ, ಇದರಿಂದ ನಿಮ್ಮ ಸ್ವಂತ ಚಿಕಿತ್ಸೆಯ ಬಗ್ಗೆ ನೀವು ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ಹೊಂದಬಹುದು.',
    healthSearchInfo: 'ಲಕ್ಷಣಗಳು, ಪರೀಕ್ಷೆಗಳು ಅಥವಾ ಸರಳ ಮಾರ್ಗದರ್ಶನ ಏನೇ ಇರಲಿ, ನಿಮಗೆ ಅಗತ್ಯವಿರುವ ಆರೋಗ್ಯ ವಿಷಯವನ್ನು ತ್ವರಿತವಾಗಿ ಹುಡುಕಿ.',
    healthSearchLabel: 'ಆರೋಗ್ಯ ವಿಷಯಗಳನ್ನು ಹುಡುಕಿ',
    healthSearchPlaceholder: 'ಆರೋಗ್ಯ ವಿಷಯಗಳನ್ನು ಹುಡುಕಿ…',
    noHealthResults: 'ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ವಿಷಯಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಬೇರೆ ಪದವನ್ನು ಪ್ರಯತ್ನಿಸಿ.',
    healthHubDiabetesTitle: 'ಮಧುಮೇಹ - ಸರಳ ವಿವರಣೆ',
    healthHubDiabetesText: 'ದೇಹವು ಸಕ್ಕರೆಯನ್ನು ಸರಿಯಾಗಿ ಬಳಸಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗದಿದ್ದಾಗ ಮಧುಮೇಹ (ಸಕ್ಕರೆ ಕಾಯಿಲೆ) ಸಂಭವಿಸುತ್ತದೆ. ಅತಿಯಾದ ಬಾಯಾರಿಕೆ, ಆಗಾಗ್ಗೆ ಮೂತ್ರ ವಿಸರ್ಜನೆ ಮಾಡಬೇಕಾದ ಅವಶ್ಯಕತೆ, ನಿಧಾನವಾಗಿ ಗುಣವಾಗುವ ಗಾಯಗಳು ಮತ್ತು ಆಯಾಸ ಸಾಮಾನ್ಯ ಲಕ್ಷಣಗಳಾಗಿವೆ. ಇದನ್ನು ನಿರ್ವಹಿಸುವುದು ಎಂದರೆ ಸಮತೋಲಿತ ಆಹಾರವನ್ನು ಸೇವಿಸುವುದು, ಸೂಚಿಸಿದ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುವುದು ಮತ್ತು ನಿಯಮಿತವಾಗಿ ರಕ್ತದ ಸಕ್ಕರೆಯನ್ನು ಪರೀಕ್ಷಿಸುವುದು.',
    healthHubDiabetesTip1: 'ನಿಮ್ಮ ರಕ್ತದ ಸಕ್ಕರೆಯ ಗುರಿಗಳನ್ನು ತಿಳಿದುಕೊಳ್ಳಿ ಮತ್ತು ನಿಮ್ಮ ವೈದ್ಯರ ಯೋಜನೆಯನ್ನು ಅನುಸರಿಸಿ.',
    healthHubDiabetesTip2: 'ದೈನಂದಿನ ನಡಿಗೆಯಂತಹ ಸಣ್ಣ ಬದಲಾವಣೆಗಳು ದೊಡ್ಡ ವ್ಯತ್ಯಾಸವನ್ನು ಉಂಟುಮಾಡಬಹುದು.',
    healthHubBloodPressureTitle: 'ರಕ್ತದೊತ್ತಡದ ಮೂಲಭೂತ ಅಂಶಗಳು',
    healthHubBloodPressureText: 'ರಕ್ತದೊತ್ತಡವು ನಿಮ್ಮ ಅಪಧಮನಿಗಳ ವಿರುದ್ಧ ನಿಮ್ಮ ರಕ್ತವು ಎಷ್ಟು ಬಲವಾಗಿ ತಳ್ಳುತ್ತದೆ ಎಂಬುದನ್ನು ಅಳೆಯುತ್ತದೆ. ವರದಿಯಲ್ಲಿ ಎರಡು ಸಂಖ್ಯೆಗಳು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ: ಸಿಸ್ಟೊಲಿಕ್ (ಮೇಲಿನದು) ಮತ್ತು ಡಯಾಸ್ಟೊಲಿಕ್ (ಕೆಳಗಿನದು). ಅಧಿಕ ರಕ್ತದೊತ್ತಡವು ಯಾವುದೇ ಲಕ್ಷಣಗಳನ್ನು ಉಂಟುಮಾಡದೇ ಇರಬಹುದು, ಆದರೆ ಇದು ಪಾರ್ಶ್ವವಾಯು, ಹೃದಯಾಘಾತ ಮತ್ತು ಮೂತ್ರಪಿಂಡದ ಸಮಸ್ಯೆಗಳ ಅಪಾಯವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.',
    healthHubBloodPressureTip1: 'ನಿಯಮಿತ ತಪಾಸಣೆಗಳನ್ನು ಮಾಡಿಸಿಕೊಳ್ಳಿ ಮತ್ತು ಆ ಸಂಖ್ಯೆಗಳನ್ನು ನಿಮ್ಮ ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ.',
    healthHubBloodPressureTip2: 'ಆರೋಗ್ಯಕರ ಆಹಾರ, ಕಡಿಮೆ ಉಪ್ಪು ಮತ್ತು ಶಾಂತ ವ್ಯಾಯಾಮವು ರಕ್ತದೊತ್ತಡವನ್ನು ಕಡಿಮೆ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
    healthHubHeartHealthTitle: 'ಹೃದಯದ ಆರೋಗ್ಯದ ಸಂಕೇತಗಳು',
    healthHubHeartHealthText: 'ಹೃದಯದ ಆರೋಗ್ಯ ಎಂದರೆ ಕೇವಲ ಎದೆ ನೋವು ಮಾತ್ರವಲ್ಲ. ನಡೆಯುವಾಗ ಆಯಾಸ, ಉಸಿರಾಟದ ತೊಂದರೆ, ಪಾದಗಳಲ್ಲಿ ಉತ ಅಥವಾ ಎದೆಯಲ್ಲಿ ಬಿಗಿತದ ಭಾವನೆಯನ್ನು ಗಮನಿಸಿ. ಇವು ನಿಮ್ಮ ಹೃದಯಕ್ಕೆ ಗಮನ ಅಗತ್ಯವಿರುವ ಲಕ್ಷಣಗಳಾಗಿರಬಹುದು.',
    healthHubHeartHealthTip1: 'ಚಟುವಟಿಕೆಯ ಸಮಯದಲ್ಲಿ ಭಾರವಾದ ಭಾವನೆ, ವಾಕರಿಕೆ ಅಥವಾ ಬೆವರು ಬಂದರೆ ವೈದ್ಯರಿಗೆ ತಿಳಿಸಿ.',
    healthHubHeartHealthTip2: 'ಶಾಂತ ಚಟುವಟಿಕೆ ಮತ್ತು ತಂಬಾಕು ವರ್ಜನೆಯಂತಹ ಸರಳ ಅಭ್ಯಾಸಗಳು ನಿಮ್ಮ ಹೃದಯವನ್ನು ರಕ್ಷಿಸುತ್ತವೆ.',
    healthHubReportTermsTitle: 'ತಿಳಿದುಕೊಳ್ಳಬೇಕಾದ ವರದಿ ಪದಗಳು',
    healthHubReportTermsText: 'ವೈದ್ಯಕೀಯ ವರದಿಗಳು ಹೆಚ್ಚಾಗಿ ಸಕ್ಕರೆ, ಕೊಲೆಸ್ಟ್ರಾಲ್, ಮೂತ್ರಪಿಂಡದ ಕಾರ್ಯಕ್ಷಮತೆ ಮತ್ತು ಲಿವರ್ ಪರೀಕ್ಷೆಗಳನ್ನು ಉಲ್ಲೇಖಿಸುತ್ತವೆ. ಈ ಸಂಖ್ಯೆಗಳು ನಿಮ್ಮ ದೇಹವು ಸಮತೋಲನದಲ್ಲಿದೆಯೇ ಅಥವಾ ಔಷಧಿಗಳು, ಆಹಾರ ಅಥವಾ ಆರೈಕೆಯಲ್ಲಿ ಬದಲಾವಣೆಯ ಅಗತ್ಯವಿದೆಯೇ ಎಂದು ನಿಮ್ಮ ವೈದ್ಯರಿಗೆ ತಿಳಿಸುತ್ತವೆ.',
    healthHubReportTermsTip1: 'HbA1c ಕೇವಲ ಒಂದು ದಿನದ ಬದಲಾಗಿ, ಹಲವು ತಿಂಗಳುಗಳ ನಿಮ್ಮ ಸರಾಸರಿ ರಕ್ತದ ಸಕ್ಕರೆಯನ್ನು ತೋರಿಸುತ್ತದೆ.',
    healthHubReportTermsTip2: 'ಒಂದು ಸಂಖ್ಯೆಯು ನಿಮ್ಮ ವಯಸ್ಸು, ಲಿಂಗ ಅಥವಾ ಆರೋಗ್ಯದ ಇತಿಹಾಸಕ್ಕೆ ಸಾಮಾನ್ಯವಾಗಿದೆಯೇ ಎಂದು ಕೇಳಿ ತಿಳಿಯಿರಿ.',
    faqTitle: 'ಪ್ರಶ್ನೋತ್ತರ ಕೇಂದ್ರ',
    faqIntro: 'ಹಿರಿಯ ನಾಗರಿಕರು, ಆರೈಕೆದಾರರು ಮತ್ತು ಮೆಡ್‌ಕ್ಲಾರಿಟಿಯನ್ನು ಸುಲಭವಾಗಿ ಬಳಸಲು ಬಯಸುವ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಉತ್ತರಗಳು.',
    faqQ1: 'ಸಹಾಯ ಪಡೆಯಲು ನಾನು ಏನನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬೇಕು?',
    faqA1: 'ಲ್ಯಾಬ್ ವರದಿಗಳು, ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು, ವೈದ್ಯರ ಟಿಪ್ಪಣಿಗಳು ಅಥವಾ ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಈ ಉಪಕರಣವು ಅವುಗಳನ್ನು ಸರಳ ಪದಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ ಇದರಿಂದ ಸಂಖ್ಯೆಗಳ ಅರ್ಥವೇನೆಂದು ನೀವು ತಿಳಿಯಬಹುದು.',
    faqQ2: 'ನನ್ನ ವರದಿಯ ಫಲಿತಾಂಶಗಳನ್ನು ನಾನು ಹೇಗೆ ಓದಬೇಕು?',
    faqA2: 'ವಿಶ್ಲೇಷಕವು ಪ್ರಮುಖ ಮೌಲ್ಯಗಳನ್ನು ಹೈಲೈಟ್ ಮಾಡುತ್ತದೆ, ಅವು ಸಾಮಾನ್ಯವೇ ಎಂಬುದನ್ನು ವಿವರಿಸುತ್ತದೆ ಮತ್ತು ನಿಮ್ಮ ವೈದ್ಯರನ್ನು ಮುಂದೆ ಏನು ಕೇಳಬೇಕೆಂದು ನಿಮಗೆ ತಿಳಿಸುತ್ತದೆ.',
    faqQ3: 'ನಾನು ಈ ಸೈಟ್ ಅನ್ನು ಹಿಂದಿಯಲ್ಲಿ ಬಳಸಬಹುದೇ?',
    faqA3: 'ಹೌದು. ಮೇಲ್ಭಾಗದಲ್ಲಿರುವ ಭಾಷಾ ಆಯ್ಕೆಯಿಂದ ಹಿಂದಿಯನ್ನು ಆರಿಸಿ ಮತ್ತು ಇಡೀ ಸೈಟ್ ತಕ್ಷಣವೇ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ.',
    faqQ4: 'ನನಗೆ ಹತ್ತಿರದ ತುರ್ತು ಚಿಕಿತ್ಸೆ ಅಗತ್ಯವಿದ್ದರೆ ಏನು ಮಾಡಬೇಕು?',
    faqA4: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು ಉಪಕರಣವನ್ನು ತೆರೆಯಿರಿ, ಸ್ಥಳ ಪ್ರವೇಶವನ್ನು ಅನುಮತಿಸಿ, ಮತ್ತು ಇದು ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು, ತುರ್ತು ಚಿಕಿತ್ಸಾ ಕೇಂದ್ರಗಳು ಮತ್ತು ಮಾರ್ಗಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.',
    hospitalSearchLabel: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಿ',
    hospitalSearchPlaceholder: 'ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹೆಸರು ಅಥವಾ ಪ್ರದೇಶದ ಮೂಲಕ ಹುಡುಕಿ…',
    noHospitalResults: 'ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಯಾವುದೇ ಆಸ್ಪತ್ರೆಗಳು ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ಎಲ್ಲಾ ಫಲಿತಾಂಶಗಳನ್ನು ನೋಡಲು ಫಿಲ್ಟರ್ ಅನ್ನು ತೆರವುಗೊಳಿಸಿ.',
    faqQ5: 'ಓದಿದ ನಂತರವೂ ನನಗೆ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ ಏನು ಮಾಡಬೇಕು?',
    faqA5: 'ಹೆಚ್ಚಿನ ಸಹಾಯಕ್ಕಾಗಿ ನೀವು ಧ್ವನಿ ಸಹಾಯಕವನ್ನು ಬಳಸಬಹುದು, ಸಾರಾಂಶವನ್ನು ಉಳಿಸಬಹುದು ಅಥವಾ ಅದನ್ನು ಕುಟುಂಬದ ಸದಸ್ಯರಿಗೆ ಅಥವಾ ವೈದ್ಯರಿಗೆ ತೋರಿಸಬಹುದು.',
    prefSavedError: 'ಉಳಿಸುವ ಮೊದಲು ಕನಿಷ್ಠ ಒಂದು ಕ್ಷೇತ್ರವನ್ನು ಭರ್ತಿ ಮಾಡಿ.',
    prefSavedSuccess: '✓ ನಿಮ್ಮ ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ!',
    prefStatusSaved: 'ಮುಗಿದಿದೆ! ನಿಮ್ಮ ರೋಗಿಯ ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಅನ್ನು ಕೆಳಗೆ ನವೀಕರಿಸಲಾಗಿದೆ.',
    prefCleared: 'ಆದ್ಯತೆಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.',
    prefStatusCleared: 'ಎಲ್ಲಾ ಆದ್ಯತೆಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ. ಮತ್ತೆ ಭರ್ತಿ ಮಾಡಿ ಮತ್ತು ಉಳಿಸಿ.',
    prefNameRequired: 'ಹೆಸರಿಗಾಗಿ ಕನಿಷ್ಠ 2 ಅಕ್ಷರಗಳನ್ನು ನಮೂದಿಸಿ.',
    prefHospitalTooLong: 'ಆಸ್ಪತ್ರೆಯ ಹೆಸರನ್ನು 80 ಅಕ್ಷರಗಳ ಒಳಗೆ ಇರಿಸಿ.',
    platformFeatures: 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ವೈಶಿಷ್ಟ್ಯಗಳು',
    everythingNeeded: 'ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಿಮಗೆ ಬೇಕಾದ ಎಲ್ಲವೂ',
    elderlyDescription: 'ಗೊಂದಲಮಯ ಲ್ಯಾಬ್ ವರದಿಗಳಿಂದ ಹಿಡಿದು ಆಸ್ಪತ್ರೆಯ ದಿಕ್ಕುಗಳವರೆಗೆ, ಪ್ರತಿಯೊಂದು ಸಾಧನವನ್ನು ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಮತ್ತು ಆರೈಕೆದಾರರಿಗೆ ಸರಳ, ಸ್ಪಷ್ಟ ಮತ್ತು ಸಹಾಯಕವಾಗುವಂತೆ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.',
    readyToTakeControl: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ರಕ್ಷಣೆಯ ನಿಯಂತ್ರಣವನ್ನು ತೆಗೆದುಕೊಳ್ಳಲು ಸಿದ್ಧರಿದ್ದೀರಾ?',
    startUnderstanding: 'ನಿಮ್ಮ ವರದಿಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಮತ್ತು ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಆರೋಗ್ಯ ಸೇವೆಯನ್ನು ಬಳಸಲು ಪ್ರಾರಂಭಿಸಿ. ಯಾವುದೇ ವೈದ್ಯಕೀಯ ಪದವಿ ಅಗತ್ಯವಿಲ್ಲ.',
    contactUs: 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
    copyrightNotice: '© 2026 ಮೆಡ್‌ಕ್ಲಾರಿಟಿ · ಸುಸಾನ್ ಮಟಿಲ್ಡಾ · 1 MCA B · ನೋಂದಣಿ ಸಂಖ್ಯೆ: 2647254',
    voiceInputInstruction: 'ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಮತ್ತು ಪಠ್ಯದಿಂದ ಧ್ವನಿ ವೈಶಿಷ್ಟ್ಯ ಬಳಸಿ ಇದರಿಂದ ನಿಮ್ಮ ಆರೋಗ್ಯದ ಮಾಹಿತಿಯನ್ನು ಓದುವುದು ಸರಳ ಮತ್ತು ಆರಾಮದಾಯಕವಾಗುತ್ತದೆ.',
    readAloud: 'ಗಟ್ಟಿಯಾಗಿ ಓದಿ',
    dictation: 'ಧ್ವನಿ ಲೇಖನ',
    shareResults: 'ಫಲಿತಾಂಶಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
    speakInsteadText: 'ಟೈಪ್ ಮಾಡುವ ಬದಲು ಮಾತನಾಡಿ',
    tapMicrophone: 'ಮೈಕ್ರೊಫೋನ್ ಬಟನ್ ಟ್ಯಾಪ್ ಮಾಡಿ ಮತ್ತು ಮಾತನಾಡಿ. ನಿಮ್ಮ ಪದಗಳು ಕೆಳಗಿನ ಬಾಕ್ಸ್‌ನಲ್ಲಿ ಗೋಚರಿಸುತ್ತವೆ.',
    reportTextPlaceholder: 'ವರದಿ ಪಠ್ಯ (ಇಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ)',
    readReportBtn: 'ವರದಿಯನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ',
    stopReadingBtn: 'ಓದುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
    shareSummaryBtn: 'ಸಾರಾಂಶವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
    oneTap: 'ಒಂದು ಟ್ಯಾಪ್',
    nearbyFacilities: 'ಹತ್ತಿರದ ಸೌಲಭ್ಯಗಳು',
    liveMap: 'ಲೈವ್ ನಕ್ಷೆ',
    yourName: 'ನಿಮ್ಮ ಹೆಸರು',
    preferredLanguage: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
    selectLanguageOpt: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    preferredHospital: 'ಆದ್ಯತೆಯ ಆಸ್ಪತ್ರೆ',
    savePreferencesBtn: 'ನನ್ನ ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ',
    clearBtn: 'ತೆರವುಗೊಳಿಸಿ',
    patientProfileCardHeader: 'ನಿಮ್ಮ ರೋಗಿ ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್',
    privacyNotice: 'ನಿಮ್ಮ ಆದ್ಯತೆಗಳನ್ನು ಈ ಬ್ರೌಸರ್ ವಿಂಡೋದಲ್ಲಿ ಮಾತ್ರ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ಎಲ್ಲಿಯೂ ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ.',
    personalProfileBadge: 'ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್',
    languageChoiceBadge: 'ಭಾಷೆಯ ಆಯ್ಕೆ',
    hospitalMatchBadge: 'ಆಸ್ಪತ್ರೆ ಹೊಂದಾಣಿಕೆ',
    emailAddressLabel: 'ಇಮೇಲ್ ವಿಳಾಸ',
    passwordLabel: 'ಪಾಸ್‌ವರ್ಡ್',
    fullNameLabel: 'ಪೂರ್ಣ ಹೆಸರು',
    confirmPasswordLabel: 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    passwordRequirementHint: 'ಕನಿಷ್ಠ 8 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು ಅಕ್ಷರಗಳನ್ನು ಬಳಸಿ, ಅದರಲ್ಲಿ ಕನಿಷ್ಠ ಒಂದು ದೊಡ್ಡ ಅಕ್ಷರ, ಒಂದು ಸಂಖ್ಯೆ ಮತ್ತು ಒಂದು ಚಿಹ್ನೆ (ಉದಾಹರಣೆಗೆ @, !, #) ಇರಬೇಕು.'
  },
  ml: {
    greeting: 'നമസ്കാരം',
    logoutButton: 'ലോഗ് ഔട്ട്',
    signInButton: 'സൈൻ ഇൻ',
    secureAccess: 'സുരക്ഷിത പ്രവേശനം',
    welcomeTitle: 'മെഡ്ക്ലാരിറ്റിയിലേക്ക് (MedClarity) സ്വാഗതം',
    authSubtitle: 'തുടരുന്നതിന് സൈൻ ഇൻ ചെയ്യുക അല്ലെങ്കിൽ ഏതാനും സെക്കൻഡുകൾക്കുള്ളിൽ ഒരു സൌജന്യ അക്കൗണ്ട് സൃഷ്ടിക്കുക.',
    signInTab: 'സൈൻ ഇൻ',
    signUpTab: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    signUpButton: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    heroTagline: 'AI-അധിഷ്ഠിത പേഷ്യന്റ് ലിറ്ററസി',
    heroHeading1: 'നിങ്ങളുടെ ആരോഗ്യം മനസ്സിലാക്കുക.',
    heroHeading2: 'ആത്മവിശ്വാസത്തോടെ മുന്നേറുക.',
    heroText: 'മെഡ്ക്ലാരിറ്റി സങ്കീർണ്ണമായ മെഡിക്കൽ റിപ്പോർട്ടുകളെ ലളിതമായ ദൈനംദിന ഭാഷയിലേക്ക് മാറ്റുന്നു. മുതിർന്ന പൗരന്മാർക്കും കുടുംബങ്ങൾക്കും മെഡിക്കൽ പദങ്ങൾ കണ്ട് ബുദ്ധിമുട്ടുന്ന ഏതൊരാൾക്കും അവരുടെ ചികിത്സയെക്കുറിച്ച് ആത്മവിശ്വാസത്തോടെ മനസ്സിലാക്കാൻ ഇത് സഹായിക്കുന്നു.',
    startUnderstanding: 'എന്റെ റിപ്പോർട്ട് മനസ്സിലാക്കാൻ ആരംഭിക്കുക',
    seeHowItHelps: 'ഇത് എങ്ങനെ സഹായിക്കുന്നു എന്ന് കാണുക',
    seeStepsButton: 'വഴികൾ കാണുക',
    home: 'ഹോം',
    tools: 'ഉപകരണങ്ങൾ',
    healthNav: 'ആരോഗ്യം',
    faqNav: 'ചോദ്യോത്തരങ്ങൾ',
    more: 'കൂടുതൽ',
    analyzeReport: 'റിപ്പോർട്ട് പരിശോധിക്കുക',
    voiceAssistant: 'വോയ്‌സ് അസിസ്റ്റന്റ്',
    nearbyHospitals: 'അടുത്തുള്ള ആശുപത്രികൾ',
    preferences: 'താത്പര്യങ്ങൾ',
    howItWorks: 'പ്രവർത്തന രീതി',
    reviews: 'അഭിപ്രായങ്ങൾ',
    contact: 'ബന്ധപ്പെടുക',
    themeDark: 'ഡാർക്ക് മോഡ്',
    themeLight: 'ലൈറ്റ് മോഡ്',
    languageSelect: 'ഭാഷ',
    reportSectionTitle: 'നിങ്ങളുടെ മെഡിക്കൽ റിപ്പോർട്ട് മനസ്സിലാക്കുക',
    reportSectionDescription: 'നിങ്ങളുടെ മെഡിക്കൽ ഫയൽ താഴെ അപ്‌ലോഡ് ചെയ്യുക. ഞങ്ങൾ അത് വായിച്ച് ലളിതമായ വാക്കുകളിൽ വിശദീകരിക്കും — മെഡിക്കൽ അറിവ് ആവശ്യമില്ല.',
    reportStatusText: 'മെഡിക്കൽ റിപ്പോർട്ട് ഉടനടി അപ്‌ലോഡ് ചെയ്യുക, നിങ്ങൾക്കായി വ്യക്തമായി ക്രമീകരിച്ചിരിക്കുന്ന പ്രധാന കണ്ടെത്തലുകൾ കാണുക.',
    statsTerms: 'വിശദീകരിച്ച പദങ്ങൾ',
    statsClarityRate: 'വ്യക്തത നിരക്ക്',
    statsSupport: 'പിന്തുണ',
    demoWalkthroughLabel: 'ഓരോ രോഗിക്കുമുള്ള ലളിതമായ വഴികാട്ടി',
    demoWalkthroughTitle: 'മെഡിക്കൽ വിവരങ്ങളും അടുത്ത ഘട്ടങ്ങളും മനസ്സിലാക്കാനുള്ള ശാന്തവും എളുപ്പവുമായ മാർഗ്ഗം',
    demoWalkthroughText: 'ലാബ് ഫലങ്ങൾ, ഡിസ്ചാർജ് പേപ്പറുകൾ അല്ലെങ്കിൽ ആശുപത്രി നിർദ്ദേശങ്ങൾ കാണുമ്പോൾ പലരും പരിഭ്രാന്തരാകാറുണ്ട്. മെഡ്ക്ലാരിറ്റി അവയെ ലളിതവും സൗഹൃദപരവുമായ വിശദീകരണങ്ങളാക്കി മാറ്റുന്നു, അതുവഴി നിങ്ങൾക്ക് മികച്ച ചോദ്യങ്ങൾ ചോദിക്കാനും കൂടുതൽ തയ്യാറെടുക്കാനും കഴിയും.',
    demoVideoLabel: 'ഡെമോ വിശദീകരണം',
    demoVideoHeading: 'യഥാർത്ഥ ജീവിതത്തിൽ മെഡ്ക്ലാരിറ്റി എങ്ങനെ സഹായിക്കുന്നു',
    demoVideoText: 'ഒരു റിപ്പോർട്ട് എങ്ങനെ ലളിതമാക്കുന്നുവെന്നും ആശുപത്രി ഓപ്ഷനുകൾ എങ്ങനെ വിശദീകരിക്കുന്നുവെന്നും വോയ്‌സ് സപ്പോർട്ട് കുടുംബങ്ങൾക്കും മുതിർന്നവർക്കും അനുഭവം എങ്ങനെ എളുപ്പമാക്കുന്നുവെന്നും കാണിക്കുന്ന ഒരു ഗൈഡഡ് ഉദാഹരണം കാണുക.',
    decodeNowButton: 'ഇപ്പോൾ മനസ്സിലാക്കൂ',
    hospitalNavigatorTitle: 'ഹോസ്പിറ്റൽ നാവിഗേറ്റർ',
    hospitalNavigatorDescription: 'നിങ്ങൾക്ക് സമീപമുള്ള ആശുപത്രികൾ കണ്ടെത്തുക, വഴികൾ മനസ്സിലാക്കുക, ഏതിലൊക്കെ അടിയന്തിര പരിചരണം ഉണ്ടെന്ന് അറിയുക.',
    navigateNowButton: 'ഇപ്പോൾ വഴി കണ്ടെത്തൂ',
    voiceReaderTitle: 'വോയ്‌സ് റീഡർ',
    voiceReaderDescription: 'നിങ്ങളുടെ ആരോഗ്യ റിപ്പോർട്ട് നിങ്ങളെ ഉച്ചത്തിൽ വായിച്ചു കേൾപ്പിക്കുക — വായന ബുദ്ധിമുട്ടുള്ളവർക്ക് ഇത് വളരെ അനുയോജ്യമാണ്.',
    listenNowButton: 'ഇപ്പോൾ കേൾക്കുക',
    myPreferencesTitle: 'എന്റെ താത്പര്യങ്ങൾ',
    myPreferencesDescription: 'നിങ്ങളുടെ പേര്, ഭാഷ, താൽപ്പര്യമുള്ള ആശുപത്രി എന്നിവ സേവ് ചെയ്ത് നിങ്ങളുടെ വ്യക്തിഗത പ്രൊഫൈൽ കാർഡ് കാണുക.',
    setPreferencesButton: 'താത്പര്യങ്ങൾ ക്രമീകരിക്കുക',
    howLabel: 'പ്രവർത്തന രീതി',
    howHeading: 'ആശയക്കുഴപ്പത്തിൽ നിന്ന് വ്യക്തതയിലേക്കുള്ള ഒരു ലളിതമായ പാത',
    howDescription: 'ഓരോ ഘട്ടവും ശാന്തവും ദൃശ്യാത്മകവും പിന്തുടരാൻ എളുപ്പമുള്ളതുമായാണ് രൂപകൽപ്പന ചെയ്‌തിരിക്കുന്നത്, അതിനാൽ ആർക്കും പിന്നിലായതായി തോന്നില്ല.',
    step1Title: 'റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുക',
    step1Text: 'ഫോട്ടോ, PDF അല്ലെങ്കിൽ പ്രമാണം — ആരംഭിക്കുന്നത് ഞങ്ങൾ ലളിതമാക്കുന്നു.',
    step2Title: 'ഞങ്ങൾ വിശദീകരിക്കുന്നു',
    step2Text: 'മെഡിക്കൽ പദങ്ങൾ ലളിതമായ ദൈനംദിന ഭാഷയിൽ വീണ്ടും എഴുതുന്നു.',
    step3Title: 'നിർദ്ദേശങ്ങൾ പരിശോധിക്കുക',
    step3Text: 'എന്ത് ചോദ്യങ്ങളാണ് ചോദിക്കേണ്ടതെന്നും അടുത്തതായി എന്താണ് ചെയ്യേണ്ടതെന്നും അറിയുക.',
    step4Title: 'ആത്മവിശ്വാസത്തോടെ തീരുമാനിക്കുക',
    step4Text: 'പൂർണ്ണമായ വിവരങ്ങളോടെയും തയ്യാറെടുപ്പോടെയും നിങ്ങളുടെ ഡോക്ടറെ സന്ദർശിക്കുക.',
    reviewsLabel: 'രോഗികളുടെ അനുഭവങ്ങൾ',
    reviewsHeading: 'ഞങ്ങളുടെ ഉപയോക്താക്കൾ പറയുന്നത്',
    reviewsDescription: 'കുടുംബങ്ങളും പരിചാരകരും മുതിർന്നവരും മെഡ്ക്ലാരിറ്റി ഉപയോഗിക്കുന്നു, കാരണം ഇത് അവർക്ക് കൂടുതൽ വിവരങ്ങളും ആശ്വാസവും നൽകുന്നു.',
    review1Quote: '"മെഡ്ക്ലാരിറ്റി എന്റെ രക്തപരിശോധന ഫലം 2 മിനിറ്റിനുള്ളിൽ വിശദീകരിച്ചു. ഒടുവിൽ എന്റെ കൊളസ്ട്രോൾ അളവ് എനിക്ക് മനസ്സിലായി, ഭക്ഷണത്തിൽ എന്താണ് മാറ്റേണ്ടതെന്ന് കൃത്യമായി അറിഞ്ഞു."',
    review1Author: 'രവി കുമാർ',
    review1Role: 'ബെംഗളൂരു · രോഗി',
    review2Quote: '"ശസ്ത്രക്രിയയ്ക്കായി ഞാൻ ഒരു പുതിയ നഗരത്തിലേക്ക് യാത്ര ചെയ്തപ്പോൾ ഹോസ്പിറ്റൽ നാവിഗേറ്റർ ഒരു ജീവരക്ഷയായിരുന്നു. എവിടെ പോകണമെന്നും എന്തൊക്കെ രേഖകൾ കരുതണമെന്നും കൃത്യമായി അറിയാമായിരുന്നു."',
    review2Author: 'പ്രിയ ജോഷി',
    review2Role: 'പൂനെ · പരിചാരക',
    review3Quote: '"മെഡിക്കൽ പദങ്ങൾ എപ്പോഴും എന്നെ ഭയപ്പെടുത്തിയിരുന്നു. മെഡ്ക്ലാരിറ്റി എന്റെ ഡിസ്ചാർജ് സമ്മറി ഒരു സൗഹൃദ കത്ത് പോലെ തോന്നിപ്പിച്ചു. എന്റെ മകൾ ഇത് സെറ്റ് ചെയ്തു തന്നു, ഞാൻ ഇത് എല്ലാ ആഴ്ചയും ഉപയോഗിക്കുന്നു."',
    review3Author: 'സുരേഷ് മേത്ത',
    review3Role: 'ചെന്നൈ · മുതിർന്ന രോഗി',
    dropZoneTitle: 'നിങ്ങളുടെ റിപ്പോർട്ട് ഇവിടെ ഇടുക (Drag & Drop)',
    dropZoneSubtitle: 'PDF, Word (DOCX), ചിത്രം (PNG / JPG), ടെക്സ്റ്റ് ഫയലുകൾ (TXT) എന്നിവ പിന്തുണയ്ക്കുന്നു',
    chooseFileButton: 'എന്റെ ഉപകരണത്തിൽ നിന്ന് ഒരു ഫയൽ തിരഞ്ഞെടുക്കുക',
    voiceSectionTitle: 'എന്റെ റിപ്പോർട്ട് ഉച്ചത്തിൽ വായിക്കുക',
    voiceSectionDescription: 'നിങ്ങളുടെ റിപ്പോർട്ട് ടെക്സ്റ്റ് താഴെ പേസ്റ്റ് ചെയ്ത് "റിപ്പോർട്ട് ഉച്ചത്തിൽ വായിക്കുക" അമർത്തുക. നിങ്ങൾക്ക് മൈക്രോഫോൺ ടാപ്പ് ചെയ്ത് സംസാരിക്കാം, ഞങ്ങൾ അത് നിങ്ങൾക്കായി എഴുതും.',
    hospitalsSectionTitle: 'നിങ്ങൾക്ക് സമീപമുള്ള ഒരു ആശുപത്രി കണ്ടെത്തുക',
    hospitalsSectionDescription: 'താഴെയുള്ള ബട്ടൺ അമർത്തി ലൊക്കേഷൻ ആക്സസ് (Location Access) അനുവദിക്കുക. വഴികളും കോൺടാക്റ്റ് നമ്പറുകളും സഹിതം അടുത്തുള്ള ആശുപത്രികൾ ഞങ്ങൾ നിങ്ങൾക്ക് കാണിച്ചുതരാം.',
    findHospitalsButton: 'എനിക്ക് സമീപമുള്ള ആശുപത്രികൾ കണ്ടെത്തുക',
    preferencesSectionTitle: 'എന്റെ താത്പര്യങ്ങൾ',
    preferencesSectionDescription: 'നിങ്ങളുടെ വിശദാംശങ്ങൾ താഴെ പൂരിപ്പിച്ച് "സേവ്" അമർത്തുക. ക്യാൻവാസ് (Canvas API) ഉപയോഗിച്ച് വരച്ച നിങ്ങളുടെ വ്യക്തിഗത പ്രൊഫൈൽ കാർഡ് താഴെ ദൃശ്യമാകും.',
    savePreferencesButton: 'എന്റെ താത്പര്യങ്ങൾ സേവ് ചെയ്യുക',
    clearButton: 'വ്യത്തിയാക്കുക',
    readyHospitalTitle: 'നിങ്ങൾക്ക് സമീപമുള്ള ആശുപത്രികൾ കണ്ടെത്താൻ തയ്യാറാണ്',
    readyHospitalText: 'മുകളിലെ ബട്ടൺ ടാപ്പ് ചെയ്ത് ചോദിക്കുമ്പോൾ ലൊക്കേഷൻ ആക്സസ് അനുവദിക്കുക. നിങ്ങളുടെ ലൊക്കേഷൻ സ്വകാര്യമായിരിക്കും, അത് ഒരിക്കലും സംഭരിക്കപ്പെടില്ല.',
    healthHub: 'ആരോഗ്യ സാക്ഷരതാ കേന്ദ്രം',
    faqCenter: 'ചോദ്യോത്തര കേന്ദ്രം',
    healthHubHeadline: 'ആരോഗ്യ സാക്ഷരതാ കേന്ദ്രം',
    healthHubIntro: 'വിശ്വസനീയമായ ആരോഗ്യ അടിസ്ഥാനങ്ങൾ, പൊതുവായ ലക്ഷണങ്ങൾ, വ്യക്തമായ മാർഗ്ഗനിർദ്ദേശങ്ങൾ എന്നിവ പര്യവേക്ഷണം ചെയ്യുക, അതുവഴി നിങ്ങളുടെ സ്വന്തം പരിചരണത്തെക്കുറിച്ച് നിങ്ങൾക്ക് കൂടുതൽ ആത്മവിശ്വാസം തോന്നും.',
    healthSearchInfo: 'ലക്ഷണങ്ങളോ പരിശോധനകളോ ലളിതമായ മാർഗ്ഗനിർദ്ദേശങ്ങളോ ആകട്ടെ, നിങ്ങൾക്ക് ആവശ്യമുള്ള ആരോഗ്യ വിഷയം വേഗത്തിൽ കണ്ടെത്തുക.',
    healthSearchLabel: 'ആരോഗ്യ വിഷയങ്ങൾ തിരയുക',
    healthSearchPlaceholder: 'ആരോഗ്യ വിഷയങ്ങൾ തിരയുക…',
    noHealthResults: 'അനുയോജ്യമായ വിഷയങ്ങളൊന്നും കണ്ടെത്തിയില്ല. മറ്റൊരു വാക്ക് ശ്രമിക്കുക.',
    healthHubDiabetesTitle: 'പ്രമേഹം - ലളിതമായ വിവരണം',
    healthHubDiabetesText: 'ശരീരത്തിന് പഞ്ചസാര ശരിയായി ഉപയോഗിക്കാൻ കഴിയാതെ വരുമ്പോഴാണ് പ്രമേഹം സംഭവിക്കുന്നത്. കടുത്ത ദാഹം, ഇടയ്ക്കിടെ മൂത്രമൊഴിക്കാനുള്ള ആവശ്യം, പതുക്കെ മാത്രം ഉണങ്ങുന്ന മുറിവുകൾ, തളർച്ച എന്നിവയാണ് പൊതുവായ ലക്ഷണങ്ങൾ. ഇത് നിയന്ത്രിക്കുക എന്നാൽ സമീകൃതാഹാരം കഴിക്കുക, നിർദ്ദേശിച്ച മരുന്നുകൾ കഴിക്കുക, രക്തത്തിലെ പഞ്ചസാരയുടെ അളവ് പതിവായി പരിശോധിക്കുക എന്നിവയാണ്.',
    healthHubDiabetesTip1: 'നിങ്ങളുടെ രക്തത്തിലെ പഞ്ചസാരയുടെ ലക്ഷ്യങ്ങൾ മനസ്സിലാക്കുകയും ഡോക്ടറുടെ പ്ലാൻ പിന്തുടരുകയും ചെയ്യുക.',
    healthHubDiabetesTip2: 'ദിവസേനയുള്ള നടത്തം പോലുള്ള ചെറിയ മാറ്റങ്ങൾ വലിയ വ്യത്യാസം വരുത്തും.',
    healthHubBloodPressureTitle: 'രക്തസമ്മർദ്ദത്തിന്റെ അടിസ്ഥാന കാര്യങ്ങൾ',
    healthHubBloodPressureText: 'രക്തസമ്മർദ്ദം അളക്കുന്നത് നിങ്ങളുടെ ധമനികൾക്കെതിരെ രക്തം എത്ര ശക്തമായി തള്ളുന്നു എന്നാണ്. ഒരു റിപ്പോർട്ടിൽ രണ്ട് സംഖ്യകൾ കാണാം: സിസ്റ്റോളിക് (മുകളിൽ), ഡയസ്റ്റോളിക് (താഴെ). ഉയർന്ന രക്തസമ്മർദ്ദം ലക്ഷണങ്ങൾ ഉണ്ടാക്കില്ലായിരിക്കാം, പക്ഷേ ഇത് പക്ഷാഘാതം, ഹൃദയാഘാതം, വൃക്ക പ്രശ്നങ്ങൾ എന്നിവയ്ക്കുള്ള സാധ്യത വർദ്ധിപ്പിക്കുന്നു.',
    healthHubBloodPressureTip1: 'പതിവായി പരിശോധനകൾ നടത്തുകയും ആ സംഖ്യകൾ ഡോക്ടറുമായി പങ്കിടുകയും ചെയ്യുക.',
    healthHubBloodPressureTip2: 'ആരോഗ്യകരമായ ഭക്ഷണം, കുറഞ്ഞ ഉപ്പ്, ലളിതമായ വ്യായാമങ്ങൾ എന്നിവ രക്തസമ്മർദ്ദം കുറയ്ക്കാൻ സഹായിക്കുന്നു.',
    healthHubHeartHealthTitle: 'ഹൃദയാരോഗ്യ സൂചനകൾ',
    healthHubHeartHealthText: 'ഹൃദയാരോഗ്യം എന്നത് നെഞ്ചുവേദനയേക്കാൾ കൂടുതലാണ്. നടക്കുമ്പോൾ ഉണ്ടാകുന്ന തളർച്ച, ശ്വാസംമുട്ടൽ, പാദങ്ങളിലെ വീക്കം അല്ലെങ്കിൽ നെഞ്ചിൽ മുറുക്കം എന്നിവ ശ്രദ്ധിക്കുക. ഇവ നിങ്ങളുടെ ഹൃദയത്തിന് പരിചരണം ആവശ്യമാണെന്നതിന്റെ ലക്ഷണങ്ങളാകാം.',
    healthHubHeartHealthTip1: 'പ്രവർത്തനങ്ങളിലേർപ്പെടുമ്പോൾ അമിതമായ ഭാരം, ഓക്കാനം അല്ലെങ്കിൽ അമിതമായി വിയർക്കുക എന്നിവ തോന്നിയാൽ ഡോക്ടറെ അറിയിക്കുക.',
    healthHubHeartHealthTip2: 'ലളിതമായ വ്യായാമങ്ങൾ, പുകയില ഒഴിവാക്കൽ തുടങ്ങിയ ലളിതമായ ശീലങ്ങൾ നിങ്ങളുടെ ഹൃദയത്തെ സംരക്ഷിക്കുന്നു.',
    healthHubReportTermsTitle: 'അറിഞ്ഞിരിക്കേണ്ട റിപ്പോർട്ട് പദങ്ങൾ',
    healthHubReportTermsText: 'മെഡിക്കൽ റിപ്പോർട്ടുകളിൽ പലപ്പോഴും പഞ്ചസാര, കൊളസ്ട്രോൾ, വൃക്കകളുടെ പ്രവർത്തനം, കരൾ പരിശോധനകൾ എന്നിവ പരാമർശിക്കാറുണ്ട്. ഈ സംഖ്യകൾ നിങ്ങളുടെ ശരീരം സന്തുലിതമാണോ അതോ മരുന്നുകളിലോ ഭക്ഷണത്തിലോ പരിചരണത്തിലോ മാറ്റം വരുത്തേണ്ടതുണ്ടോ എന്ന് ഡോക്ടറോട് പറയുന്നു.',
    healthHubReportTermsTip1: 'HbA1c എന്നത് ഒരു ദിവസത്തെ മാത്രമല്ല, മാസങ്ങളിലെ നിങ്ങളുടെ ശരാശരി രക്തത്തിലെ പഞ്ചസാരയുടെ അളവ് കാണിക്കുന്നു.',
    healthHubReportTermsTip2: 'ഒരു സംഖ്യ നിങ്ങളുടെ പ്രായം, ലിംഗഭേദം അല്ലെങ്കിൽ ആരോഗ്യ ചരിത്രം എന്നിവയ്ക്ക് സാധാരണമാണോ എന്ന് ചോദിച്ചറിയുക.',
    faqTitle: 'ചോദ്യോത്തര കേന്ദ്രം',
    faqIntro: 'മുതിർന്നവർക്കും പരിചാരകർക്കും മെഡ്ക്ലാരിറ്റി എളുപ്പത്തിൽ ഉപയോഗിക്കാൻ ആഗ്രഹിക്കുന്ന ഏതൊരാൾക്കുമുള്ള ചോദ്യങ്ങളും ഉത്തരങ്ങളും.',
    faqQ1: 'സഹായം ലഭിക്കാൻ ഞാൻ എന്താണ് അപ്‌ലോഡ് ചെയ്യേണ്ടത്?',
    faqA1: 'ലാബ് റിപ്പോർട്ടുകൾ, കുറിപ്പടികൾ, ഡോക്ടറുടെ കുറിപ്പുകൾ അല്ലെങ്കിൽ പരിശോധനാ ഫലങ്ങൾ അപ്‌ലോഡ് ചെയ്യുക. ഈ ഉപകരണം അവയെ ലളിതമായ വാക്കുകളാക്കി മാറ്റുന്നു, അതുവഴി സംഖ്യകളുടെ അർത്ഥം എന്താണെന്ന് നിങ്ങൾക്ക് മനസ്സിലാക്കാം.',
    faqQ2: 'എന്റെ റിപ്പോർട്ട് ഫലങ്ങൾ ഞാൻ എങ്ങനെ വായിക്കും?',
    faqA2: 'അനലൈസർ പ്രധാനപ്പെട്ട മൂല്യങ്ങൾ ഹൈലൈറ്റ് ചെയ്യുകയും അവ സാധാരണമാണോ എന്ന് വിശദീകരിക്കുകയും ഡോക്ടറോട് അടുത്തതായി എന്താണ് ചോദിക്കേണ്ടതെന്ന് നിങ്ങളോട് പറയുകയും ചെയ്യുന്നു.',
    faqQ3: 'എനിക്ക് ഈ സൈറ്റ് ഹിന്ദിയിൽ ഉപയോഗിക്കാമോ?',
    faqA3: 'അതെ. മുകളിലുള്ള ഭാഷാ സെലക്ടറിൽ നിന്ന് ഹിന്ദി തിരഞ്ഞെടുക്കുക, മുഴുവൻ സൈറ്റും തൽക്ഷണം അപ്‌ഡേറ്റ് ചെയ്യപ്പെടും.',
    faqQ4: 'എനിക്ക് അടുത്തുള്ള അടിയന്തിര പരിചരണം ആവശ്യമുണ്ടെങ്കിൽ എന്ത് ചെയ്യും?',
    faqA4: 'അടുത്തുള്ള ആശുപത്രികൾ ടൂൾ തുറക്കുക, ലൊക്കേഷൻ ആക്സസ് അനുവദിക്കുക, അത് അടുത്തുള്ള ആശുപത്രികൾ, അടിയന്തിര പരിചരണ കേന്ദ്രങ്ങൾ, വഴികൾ എന്നിവ കാണിക്കും.',
    hospitalSearchLabel: 'അടുത്തുള്ള ആശുപത്രികൾ തിരയുക',
    hospitalSearchPlaceholder: 'ആശുപത്രികൾ പേരോ പ്രദേശമോ ഉപയോഗിച്ച് തിരയുക…',
    noHospitalResults: 'നിങ്ങളുടെ തിരച്ചിലിന് അനുയോജ്യമായ ആശുപത്രികളൊന്നും കണ്ടെത്തിയില്ല. എല്ലാ ഫലങ്ങളും കാണാൻ ഫിൽട്ടർ മാറ്റുക.',
    faqQ5: 'വായിച്ചതിനുശേഷവും എനിക്ക് ചോദ്യങ്ങളുണ്ടെങ്കിൽ എന്ത് ചെയ്യും?',
    faqA5: 'നിങ്ങൾക്ക് വോയ്‌സ് അസിസ്റ്റന്റ് ഉപയോഗിക്കാം, സംഗ്രഹം സേവ് ചെയ്യാം, അല്ലെങ്കിൽ കൂടുതൽ സഹായത്തിനായി ഒരു കുടുംബാംഗത്തെയോ ഡോക്ടറെയോ കാണിക്കാം.',
    prefSavedError: 'സേവ് ചെയ്യുന്നതിന് മുൻപ് ദയവായി ഒരു ഫീൽഡെങ്കിലും പൂരിപ്പിക്കുക.',
    prefSavedSuccess: '✓ നിങ്ങളുടെ താത്പര്യങ്ങൾ സേവ് ചെയ്തിരിക്കുന്നു!',
    prefStatusSaved: 'കഴിഞ്ഞു! നിങ്ങളുടെ പേഷ്യന്റ് പ്രൊഫൈൽ കാർഡ് താഴെ അപ്‌ഡേറ്റ് ചെയ്തിട്ടുണ്ട്.',
    prefCleared: 'താത്പര്യങ്ങൾ മായ്ച്ചു.',
    prefStatusCleared: 'എല്ലാ താത്പര്യങ്ങളും മായ്ച്ചിരിക്കുന്നു. വീണ്ടും പൂരിപ്പിച്ച് സേവ് ചെയ്യുക.',
    prefNameRequired: 'പേരിനായി ദയവായി കുറഞ്ഞത് 2 അക്ഷരങ്ങളെങ്കിലും നൽകുക.',
    prefHospitalTooLong: 'ആശുപത്രിയുടെ പേര് ദയവായി 80 അക്ഷരങ്ങളിൽ താഴെയായി പരിമിതപ്പെടുത്തുക.',
    platformFeatures: 'പ്ലാറ്റ്‌ഫോം സവിശേഷതകൾ',
    everythingNeeded: 'നിങ്ങളുടെ ആരോഗ്യം മനസ്സിലാക്കാൻ ആവശ്യമായതെല്ലാം',
    elderlyDescription: 'ആശയക്കുഴപ്പമുണ്ടാക്കുന്ന ലാബ് റിപ്പോർട്ടുകൾ മുതൽ ആശുപത്രി ദിശകൾ വരെ, ഓരോ ടൂളും പ്രായമായവർക്കും പരിചാരകർക്കും ലളിതവും വ്യക്തവും സഹായകരവുമായി രൂപകൽപ്പന ചെയ്‌തിരിക്കുന്നു.',
    readyToTakeControl: 'നിങ്ങളുടെ ആരോഗ്യ സംരക്ഷണത്തിന്റെ നിയന്ത്രണം ഏറ്റെടുക്കാൻ തയ്യാറാണോ?',
    startUnderstanding: 'നിങ്ങളുടെ റിപ്പോർട്ടുകൾ മനസ്സിലാക്കാനും ആത്മവിശ്വാസത്തോടെ ആരോഗ്യ പരിരക്ഷ ഉപയോഗിക്കാനും ആരംഭിക്കുക. മെഡിക്കൽ ബിരുദം ആവശ്യമില്ല.',
    contactUs: 'ഞങ്ങളെ ബന്ധപ്പെടുക',
    copyrightNotice: '© 2026 മെഡ്ക്ലാരിറ്റി · സൂസൻ മറ്റിൽഡ · 1 MCA B · രജിസ്ട്രേഷൻ നമ്പർ: 2647254',
    voiceInputInstruction: 'വോയ്‌സ് ഇൻപുട്ടും ടെക്സ്റ്റ്-ടു-സ്പീച്ചും ഉപയോഗിക്കുക, അതുവഴി നിങ്ങളുടെ ആരോഗ്യ വിവരങ്ങൾ വായിക്കുന്നത് ലളിതവും സുഖകരവുമാകും.',
    readAloud: 'ഉറക്കെ വായിക്കുക',
    dictation: 'വോയ്‌സ് ടൈപ്പിംഗ്',
    shareResults: 'ഫലങ്ങൾ പങ്കിടുക',
    speakInsteadText: 'ടൈപ്പ് ചെയ്യുന്നതിന് പകരം സംസാരിക്കുക',
    tapMicrophone: 'മൈക്രോഫോൺ ബട്ടൺ ടാപ്പ് ചെയ്ത് സംസാരിക്കുക. നിങ്ങളുടെ വാക്കുകൾ താഴെയുള്ള ബോക്സിൽ ദൃശ്യമാകും.',
    reportTextPlaceholder: 'റിപ്പോർട്ട് ടെക്സ്റ്റ് (ഇവിടെ പേസ്റ്റ് ചെയ്യുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക)',
    readReportBtn: 'റിപ്പോർട്ട് ഉറക്കെ വായിക്കുക',
    stopReadingBtn: 'വായിക്കുന്നത് നിർത്തുക',
    shareSummaryBtn: 'സംഗ്രഹം പങ്കിടുക',
    oneTap: 'ഒരു ടാപ്പ്',
    nearbyFacilities: 'അടുത്തുള്ള സൗകര്യങ്ങൾ',
    liveMap: 'ലൈവ് മാപ്പ്',
    yourName: 'നിങ്ങളുടെ പേര്',
    preferredLanguage: 'താൽപ്പര്യമുള്ള ഭാഷ',
    selectLanguageOpt: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക',
    preferredHospital: 'താൽപ്പര്യമുള്ള ആശുപത്രി',
    savePreferencesBtn: 'എന്റെ മുൻഗണനകൾ സംരക്ഷിക്കുക',
    clearBtn: 'വ്യക്തമാക്കുക',
    patientProfileCardHeader: 'നിങ്ങളുടെ പേഷ്യന്റ് പ്രൊഫൈൽ കാർഡ്',
    privacyNotice: 'നിങ്ങളുടെ മുൻഗണനകൾ ഈ ബ്രൗസർ വിൻഡോയിൽ മാത്രമേ സംഭരിക്കപ്പെടുകയുള്ളൂ, അവ ഒരിക്കലും എങ്ങോട്ടും അയയ്ക്കില്ല.',
    personalProfileBadge: 'വ്യക്തിഗത പ്രൊഫൈൽ',
    languageChoiceBadge: 'ഭാഷാ തിരഞ്ഞെടുപ്പ്',
    hospitalMatchBadge: 'ആശുപത്രി പൊരുത്തം',
    emailAddressLabel: 'ഇമെയിൽ വിലാസം',
    passwordLabel: 'പാസ്‌വേഡ്',
    fullNameLabel: 'പൂർണ്ണമായ പേര്',
    confirmPasswordLabel: 'പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക',
    passwordRequirementHint: 'കുറഞ്ഞത് 8 അക്ഷരങ്ങളെങ്കിലും ഉപയോഗിക്കുക, അതിൽ ഒരു വലിയ അക്ഷരവും ഒരു സംഖ്യയും ഒരു ചിഹ്നവും (ഉദാഹരണത്തിന് @, !, #) ഉണ്ടായിരിക്കണം.'
  
  },
  te: {
    greeting: 'నమస్కారం',
    logoutButton: 'లాగ్ అవుట్',
    signInButton: 'సైన్ ఇన్',
    secureAccess: 'సురక్షిత ప్రవేశం',
    welcomeTitle: 'మెడ్‌క్లారిటీ (MedClarity) కి స్వాగతం',
    authSubtitle: 'కొనసాగడానికి సైన్ ఇన్ చేయండి లేదా కొన్ని సెకన్లలో ఉచిత ఖాతాను సృష్టించండి.',
    signInTab: 'సైన్ ఇన్',
    signUpTab: 'ఖాతాను సృష్టించండి',
    signUpButton: 'ఖాతాను సృష్టించండి',
    heroTagline: 'AI-ఆధారిత రోగుల అక్షరాస్యత',
    heroHeading1: 'మీ ఆరోగ్యాన్ని అర్థం చేసుకోండి.',
    heroHeading2: 'ఆత్మవిశ్వాసంతో ముందడుగు వేయండి.',
    heroText: 'మెడ్‌క్లారిటీ గందరగోళంగా ఉన్న వైద్య నివేదికలను సరళమైన, రోజువారీ భాషలోకి మారుస్తుంది. ఇది వృద్ధులు, కుటుంబాలు మరియు మెడికల్ పదాల వల్ల ఇబ్బంది పడే ప్రతి ఒక్కరూ తమ చికిత్సను ఆత్మవిశ్వాసంతో అర్థం చేసుకోవడానికి సహాయపడుతుంది.',
    startUnderstanding: 'నా నివేదికను అర్థం చేసుకోవడం ప్రారంభించండి',
    seeHowItHelps: 'ఇది ఎలా సహాయపడుతుందో చూడండి',
    seeStepsButton: 'దశలను వీక్షించండి',
    home: 'హోమ్',
    tools: 'ఉపకరణాలు',
    healthNav: 'ఆరోగ్యం',
    faqNav: 'ప్రశ్నోత్తరాలు',
    more: 'ఇంకా',
    analyzeReport: 'నివేదికను విశ్లేషించండి',
    voiceAssistant: 'వాయిస్ అసిస్టెంట్',
    nearbyHospitals: 'దగ్గరలోని ఆసుపత్రులు',
    preferences: 'ప్రాధాన్యతలు',
    howItWorks: 'ఇది ఎలా పని చేస్తుంది',
    reviews: 'అభిప్రాయాలు',
    contact: 'సంప్రదించండి',
    themeDark: 'డార్క్ మోడ్',
    themeLight: 'లైట్ మోడ్',
    languageSelect: 'భాష',
    reportSectionTitle: 'మీ వైద్య నివేదికను అర్థం చేసుకోండి',
    reportSectionDescription: 'మీ వైద్య ఫైల్‌ను క్రింద అప్‌లోడ్ చేయండి. మేము దానిని చదివి సరళమైన పదాలలో వివరిస్తాము — ఎటువంటి వైద్య పరిజ్ఞానం అవసరం లేదు.',
    reportStatusText: 'వైద్య నివేదికను తక్షణమే అప్‌లోడ్ చేయండి మరియు మీ కోసం స్పష్టంగా అమర్చబడిన ముఖ్యమైన అంశాలను చూడండి.',
    statsTerms: 'వివరించబడిన పదాలు',
    statsClarityRate: 'స్పష్టత రేటు',
    statsSupport: 'మద్దతు',
    demoWalkthroughLabel: 'ప్రతి రోగికి సరళమైన గైడ్',
    demoWalkthroughTitle: 'వైద్య సమాచారం మరియు తదుపరి దశలను అర్థం చేసుకోవడానికి ఒక సులభమైన మార్గం',
    demoWalkthroughText: 'ల్యాబ్ ఫలితాలు, డిశ్చార్జ్ ಪత్రాలు లేదా ఆసుపత్రి సూచనలను చూసినప్పుడు చాలా మంది ఆందోళన చెందుతారు. మెడ్‌క్లారిటీ వాటిని సరళమైన, స్నేహపూర్వక వివరణలుగా మారుస్తుంది, తద్వారా మీరు వైద్యులను మంచి ప్రశ్నలు అడగవచ్చు మరియు మరింత సిద్ధంగా ఉండవచ్చు.',
    demoVideoLabel: 'డెమో వివరణ',
    demoVideoHeading: 'నిజ జీవితంలో మెడ్‌క్లారిటీ ఎలా సహాయపడుతుంది',
    demoVideoText: 'ఒక నివేదిక ఎలా సరళీకరించబడుతుందో, ఆసుపత్రి ఎంపికలు ఎలా వివరించబడుతున్నాయో మరియు వాయిస్ సపోర్ట్ కుటుంబాలకు మరియు వృద్ధులకు అనుభవాన్ని ఎలా సులభతరం చేస్తుందో చూపించే గైడెడ్ ఉదాహరణను చూడండి.',
    decodeNowButton: 'ఇప్పుడే అర్థం చేసుకోండి',
    hospitalNavigatorTitle: 'హాస్పిటల్ నావిగేటర్',
    hospitalNavigatorDescription: 'మీకు సమీపంలో ఉన్న ఆసుపత్రులను కనుగొనండి, మార్గాలను పొందండి మరియు ఏ ఆసుపత్రులలో అత్యవసర సంరక్షణ ఉందో తెలుసుకోండి.',
    navigateNowButton: 'ఇప్పుడే మార్గం తెలుసుకోండి',
    voiceReaderTitle: 'వాయిస్ రీడర్',
    voiceReaderDescription: 'మీ ఆరోగ్య నివేదికను గట్టిగా చదివి వినిపించుకోండి — చదవడం కష్టంగా ఉన్నవారికి ఇది చాలా బాగుంటుంది.',
    listenNowButton: 'ఇప్పుడే వినండి',
    myPreferencesTitle: 'నా ప్రాధాన్యతలు',
    myPreferencesDescription: 'మీ పేరు, భాష మరియు ఇష్టమైన ఆసుపత్రిని సేవ్ చేసి మీ వ్యక్తిగత ప్రొఫైల్ కార్డ్ చూడండి.',
    setPreferencesButton: 'ప్రాధాన్యతలను సెట్ చేయండి',
    howLabel: 'పని చేసే విధానం',
    howHeading: 'గందరగోళం నుండి స్పష్టత వైపు ఒక సరళమైన మార్గం',
    howDescription: 'ప్రతి దశ ప్రశాంతంగా, దృశ్య రూపంలో మరియు సులభంగా అనుసరించేలా రూపొందించబడింది, తద్వారా ఎవరూ వెనుకబడి ఉన్నట్లు భావించరు.',
    step1Title: 'నివేదికను అప్‌లోడ్ చేయండి',
    step1Text: 'ఫోటో, PDF లేదా డాక్యుమెంట్ — ప్రారంభించడాన్ని మేము సులభతరం చేస్తాము.',
    step2Title: 'మేము వివరిస్తాము',
    step2Text: 'వైద్య పదాలు సరళమైన, రోజువారీ భాషలో తిరిగి వ్రాయబడతాయి.',
    step3Title: 'మార్గదర్శకత్వాన్ని పరిశీలించండి',
    step3Text: 'ఏ ప్రశ్నలు అడగాలో మరియు తదుపరి ఏమి చేయాలో తెలుసుకోండి.',
    step4Title: 'ఆత్మవిశ్వాసంతో నిర్ణయించుకోండి',
    step4Text: 'పూర్తి సమాచారం మరియు సన్నద్ధతతో మీ వైద్యుల సమావేశానికి వెళ్ళండి.',
    reviewsLabel: 'రోగుల కథనాలు',
    reviewsHeading: 'మా వినియోగదారులు ఏమి చెబుతున్నారు',
    reviewsDescription: 'కుటుంబాలు, సంరక్షకులు మరియు వృద్ధులు మెడ్‌క్లారిటీని ఉపయోగిస్తారు ఎందుకంటే ఇది వారికి మరింత సమాచారం మరియు ధైర్యాన్ని ఇస్తుంది.',
    review1Quote: '"మెడ్‌క్లారిటీ నా రక్త పరీక్షను 2 నిమిషాల్లో వివరించింది. చివరికి నా కొలెస్ట్రాల్ స్థాయిని నేను అర్థం చేసుకున్నాను మరియు నా ఆహారంలో ఏమి మార్చాలో నాకు సరిగ్గా తెలిసింది."',
    review1Author: 'రవి కుమార్',
    review1Role: 'బెంగళూరు · రోగి',
    review2Quote: '"సర్జరీ కోసం నేను ఒక కొత్త నగరానికి ప్రయాణించినప్పుడు హాస్పిటల్ నావిగేటర్ నా ప్రాణాన్ని కాపాడింది. ఎక్కడికి వెళ్ళాలి మరియు ఎలాంటి పత్రాలు తీసుకెళ్ళాలో నాకు ఖచ్చితంగా తెలుసు."',
    review2Author: 'ప్రియా జోషి',
    review2Role: 'పూణే · సంరక్షకులు',
    review3Quote: '"వైద్య పరిభాష ఎప్పుడూ నన్ను భయపెట్టేది. మెడ్‌క్లారిటీ నా డిశ్చార్జ్ సారాంశాన్ని ఒక స్నేహపూర్వక లేఖలా అనిపించేలా చేసింది. నా కుమార్తె దీనిని సెటప్ చేసింది, నేను ప్రతి వారం ఉపయోగిస్తాను."',
    review3Author: 'సురేష్ మెహతా',
    review3Role: 'చెన్నై · వృద్ధ రోగి',
    dropZoneTitle: 'మీ నివేదికను ఇక్కడికి లాగి వదలండి (Drag & Drop)',
    dropZoneSubtitle: 'PDF, Word (DOCX), చిత్రం (PNG / JPG) మరియు టెక్స్ట్ ఫైల్‌లను (TXT) సపోర్ట్ చేస్తుంది',
    chooseFileButton: 'నా పరికరం నుండి ఫైల్‌ను ఎంచుకోండి',
    voiceSectionTitle: 'నా నివేదికను గట్టిగా చదవండి',
    voiceSectionDescription: 'మీ నివేదిక వచనాన్ని క్రింద పేస్ట్ చేసి "నివేదికను గట్టిగా చదువు" నొక్కండి. మీరు మైక్రోఫోన్ ట్యాప్ చేసి మాట్లాడవచ్చు, మేము దానిని మీ కోసం వ్రాస్తాము.',
    hospitalsSectionTitle: 'మీకు సమీపంలో ఉన్న ఆసుపత్రిని కనుగొనండి',
    hospitalsSectionDescription: 'క్రింది బటన్ నొక్కండి మరియు లొకేషన్ యాక్సెస్ (Location Access) అనుమతించండి. మార్గాలు మరియు సంప్రదింపు సంఖ్యలతో దగ్గరలోని ఆసుపత్రులను మేము మీకు చూపిస్తాము.',
    findHospitalsButton: 'నా దగ్గరలోని ఆసుపత్రులను కనుగొను',
    preferencesSectionTitle: 'నా ప్రాధాన్యతలు',
    preferencesSectionDescription: 'మీ వివరాలను క్రింద భర్తీ చేసి "సేవ్" నొక్కండి. కాన్వాస్ (Canvas API) ఉపయోగించి గీయబడిన మీ వ్యక్తిగత ప్రొఫైల్ కార్డ్ క్రింద కనిపిస్తుంది.',
    savePreferencesButton: 'నా ప్రాధాన్యతలను సేవ్ చేయండి',
    clearButton: 'తుడిచివేయి',
    readyHospitalTitle: 'మీకు సమీపంలోని ఆసుపత్రులను కనుగొనడానికి సిద్ధంగా ఉన్నారు',
    readyHospitalText: 'పై బటన్ ట్యాప్ చేయండి మరియు అడిగినప్పుడు లొకేషన్ యాక్సెస్ అనుమతించండి. మీ లొకేషన్ ప్రైవేట్‌గా ఉంటుంది మరియు ఎప్పటికీ నిల్వ చేయబడదు.',
    healthHub: 'ఆరోగ్య అక్షరాస్యత కేంద్రం',
    faqCenter: 'ప్రశ్నోత్తరాల కేంద్రం',
    healthHubHeadline: 'ఆరోగ్య అక్షరాస్యత కేంద్రం',
    healthHubIntro: 'విశ్వసనీయమైన ఆరోగ్య ప్రాథమిక విషయాలు, సాధారణ లక్షణాలు మరియు స్పష్టమైన మార్గదర్శకత్వాన్ని అన్వేషించండి, తద్వారా మీ స్వంత చికిత్స గురించి మీరు మరింత ఆత్మవిశ్వాసంతో ఉండవచ్చు.',
    healthSearchInfo: 'లక్షణాలు, పరీక్షలు లేదా సరళమైన మార్గదర్శకత్వం ఏదైనా కావచ్చు, మీకు కావలసిన ఆరోగ్య అంశాన్ని త్వరగా కనుగొనండి.',
    healthSearchLabel: 'ఆరోగ్య అంశాలను వెతకండి',
    healthSearchPlaceholder: 'ఆరోగ్య అంశాలను వెతకండి…',
    noHealthResults: 'సరిపోలే అంశాలు ఏవీ కనుగొనబడలేదు. మరో పదాన్ని ప్రయత్నించండి.',
    healthHubDiabetesTitle: 'మధుమేహం - సరళమైన వివరణ',
    healthHubDiabetesText: 'శరీరం చక్కెరను సరిగ్గా ఉపయోగించుకోలేనప్పుడు మధుమేహం (షుగర్ వ్యాధి) వస్తుంది. విపరీతమైన దాహం, తరచుగా మూత్రవిసర్జన చేయాల్సి రావడం, నెమ్మదిగా తగ్గే గాయాలు మరియు అలసట సాధారణ లక్షణాలు. దీనిని నిర్వహించడం అంటే సమతుల్య ఆహారం తీసుకోవడం, సూచించిన మందులు వాడటం మరియు క్రమం తప్పకుండా రక్తంలో చక్కెరను పరీక్షించుకోవడం.',
    healthHubDiabetesTip1: 'మీ రక్తంలో చక్కెర లక్ష్యాలను తెలుసుకోండి మరియు మీ వైద్యుని ప్రణాళికను అనుసరించండి.',
    healthHubDiabetesTip2: 'రోజువారీ నడక వంటి చిన్న మార్పులు పెద్ద తేడాను తీసుకురాగలవు.',
    healthHubBloodPressureTitle: 'రక్తపోటు ప్రాథమిక విషయాలు',
    healthHubBloodPressureText: 'రక్తపోటు అనేది మీ ధమనులకు వ్యతిరేకంగా మీ రక్తం ఎంత బలంగా నెట్టుతుందో కొలుస్తుంది. నివేదికలో రెండు సంఖ్యలు కనిపిస్తాయి: సిస్టోలిక్ (పైది) మరియు డయాస్టోలిక్ (క్రిందిది). అధిక రక్తపోటు ఎటువంటి లక్షణాలను కలిగించకపోవచ్చు, కానీ ఇది పక్షవాతం, గుండెపోటు మరియు మూత్రపిండాల సమస్యల ప్రమాదాన్ని పెంచుతుంది.',
    healthHubBloodPressureTip1: 'క్రమం తప్పకుండా తనిఖీలు చేయించుకోండి మరియు ఆ సంఖ్యలను మీ వైద్యుడితో పంచుకోండి.',
    healthHubBloodPressureTip2: 'ఆరోగ్యకరమైన ఆహారం, తక్కువ ఉప్పు మరియు తేలికపాటి వ్యాయామం రక్తపోటును తగ్గించడంలో సహాయపడతాయి.',
    healthHubHeartHealthTitle: 'గుండె ఆరోగ్య సంకేతాలు',
    healthHubHeartHealthText: 'గుండె ఆరోగ్యం అంటే కేవలం ఛాతీ నొప్పి మాత్రమే కాదు. నడుస్తున్నప్పుడు అలసట, శ్వాస ఆడకపోవడం, పాదాలలో వాపు లేదా ఛాతీలో బిగుతుగా ఉన్నట్లు అనిపించడం గమనించండి. ఇవి మీ గుండెకు సంరక్షణ అవసరమని తెలిపే సంకేతాలు కావచ్చు.',
    healthHubHeartHealthTip1: 'పని చేస్తున్నప్పుడు బరువుగా అనిపించడం, వికారం లేదా చెమటలు పడితే వైద్యునికి తెలియజేయండి.',
    healthHubHeartHealthTip2: 'తేలికపాటి యాక్టివిటీ మరియు పొగాకుకు దూరంగా ఉండటం వంటి సాధారణ అలవాట్లు మీ గుండెను సంరక్షిస్తాయి.',
    healthHubReportTermsTitle: 'తెలుసుకోవలసిన నివేదిక పదాలు',
    healthHubReportTermsText: 'వైద్య నివేదికలు తరచుగా చక్కెర, కొలెస్ట్రాల్, మూత్రపిండాల పనితీరు మరియు కాలేయ పరీక్షలను ప్రస్తావిస్తాయి. ఈ సంఖ్యలు మీ శరీరం సమతుల్యంగా ఉందో లేదా మందులు, ఆహారం లేదా సంరక్షణలో మార్పు అవసరమా అని మీ వైద్యుడికి తెలియజేస్తాయి.',
    healthHubReportTermsTip1: 'HbA1c అనేది కేవలం ఒక రోజు కాకుండా, కొన్ని నెలల మీ సగటు రక్త చక్కెరను చూపుతుంది.',
    healthHubReportTermsTip2: 'ఒక సంఖ్య మీ వయస్సు, లింగం లేదా ఆరోగ్య చరిత్రకు సాధారణమేనా అని అడిగి తెలుసుకోండి.',
    faqTitle: 'ప్రశ్నోత్తరాల కేంద్రం',
    faqIntro: 'వృద్ధులు, సంరక్షకులు మరియు మెడ్‌క్లారిటీని సులభంగా ఉపయోగించాలనుకునే ప్రతి ఒక్కరి కోసం ప్రశ్నలు మరియు సమాధానాలు.',
    faqQ1: 'సహాయం పొందడానికి నేను ఏమి అప్‌లోడ్ చేయాలి?',
    faqA1: 'ల్యాబ్ నివేదికలు, ప్రిస్క్రిప్షన్లు, వైద్యుని నోట్స్ లేదా పరీక్ష ఫలితాలను అప్‌లోడ్ చేయండి. ఈ ఉపకరణం వాటిని సరళమైన పదాలుగా మారుస్తుంది, తద్వారా సంఖ్యల అర్థం ఏమిటో మీరు తెలుసుకోవచ్చు.',
    faqQ2: 'నా నివేదిక ఫలితాలను నేను ఎలా చదవాలి?',
    faqA2: 'విశ్లేషకుడు ముఖ్యమైన విలువలను హైలైట్ చేస్తుంది, అవి సాధారణమేనా అని వివరిస్తుంది మరియు మీ వైద్యుడిని తదుపరి ఏమి అడగాలో మీకు చెబుతుంది.',
    faqQ3: 'నేను ఈ సైట్‌ను హిందీలో ఉపయోగించవచ్చా?',
    faqA3: 'అవును. ఎగువన ఉన్న భాషల ఎంపిక నుండి హిందీని ఎంచుకోండి మరియు మొత్తం సైట్ తక్షణమే అప్‌డేట్ అవుతుంది.',
    faqQ4: 'నాకు సమీపంలో అత్యవసర సంరక్షణ అవసరమైతే ఏమి చేయాలి?',
    faqA4: 'దగ్గరలోని ఆసుపత్రులు సాధనాన్ని తెరిచి, లొకేషన్ యాక్సెస్ అనుమతించండి, అది సమీపంలోని ఆసుపత్రులు, అత్యవసర కేంద్రాలు మరియు మార్గాలను చూపుతుంది.',
    hospitalSearchLabel: 'దగ్గరలోని ఆసుపత్రులను వెతకండి',
    hospitalSearchPlaceholder: 'ఆసుపత్రులను పేరు లేదా ప్రాంతం ద్వారా వెతకండి…',
    noHospitalResults: 'మీ శోధనకు సరిపోలే ఆసుపత్రులు ఏవీ కనుగొనబడలేదు. అన్ని ఫలితాలను చూడటానికి ఫిల్టర్‌ను క్లియర్ చేయండి.',
    faqQ5: 'చదివిన తర్వాత కూడా నాకు ప్రశ్నలు ఉంటే ఏమి చేయాలి?',
    faqA5: 'మీరు వాయిస్ అസിస్టెంట్ ఉపయోగించవచ్చు, సారాంశాన్ని సేవ్ చేయవచ్చు లేదా అదనపు సహాయం కోసం కుటుంబ సభ్యునికి లేదా వైద్యుడికి చూపించవచ్చు.',
    prefSavedError: 'సేవ్ చేయడానికి ముందు కనీసం ఒక ఫీల్డ్ అయినా భర్తీ చేయండి.',
    prefSavedSuccess: '✓ మీ ప్రాధాన్యతలు సేవ్ చేయబడ్డాయి!',
    prefStatusSaved: 'పూర్తయింది! మీ రోగి ప్రొఫైల్ కార్డ్ క్రింద నవీకరించబడింది.',
    prefCleared: 'ప్రాధాన్యతలు తొలగించబడ్డాయి.',
    prefStatusCleared: 'అన్ని ప్రాಧాన్యతలు తొలగించబడ్డాయి. మళ్లీ భర్తీ చేసి సేవ్ చేయండి.',
    prefNameRequired: 'పేరు కోసం కనీసం 2 అక్షరాలను నమోదు చేయండి.',
    prefHospitalTooLong: 'దయచేసి ఆసుపత్రి పేరును 80 అక్షరాల లోపు పరిమితం చేయండి.',
    // Telugu Translations
    platformFeatures: 'ప్లాట్‌ఫారమ్ ఫీచర్లు',
    everythingNeeded: 'మీ ఆరోగ్యాన్ని అర్థం చేసుకోవడానికి మీకు కావలసినవన్నీ',
    elderlyDescription: 'అర్థం కాని ల్యాబ్ రిపోర్టుల నుండి హాస్పిటల్ రూట్ల వరకు, ప్రతి సాధనం వృద్ధులకు మరియు సంరక్షకులకు సరళంగా, స్పష్టంగా మరియు సహాయకరంగా ఉండేలా రూపొందించబడింది.',
    readyToTakeControl: 'మీ ఆరోగ్య సంరక్షణపై నియంత్రణ సాధించడానికి సిద్ధంగా ఉన్నారా?',
    startUnderstanding: 'మీ నివేదికలను అర్థం చేసుకోవడం మరియు విశ్వాసంతో ఆరోగ్య సేవలను ఉపయోగించడం ప్రారంభించండి. మెడికల్ డిగ్రీ అవసరం లేదు.',
    contactUs: 'మమ్మల్ని సంప్రదించండి',
    copyrightNotice: '© 2026 మెడ్‌క్లారిటీ · సుసాన్ మటిల్డా · 1 MCA B · రిజిస్ట్రేషన్ నంబర్: 2647254',
    voiceInputInstruction: 'వాయిస్ ఇన్‌పుట్ మరియు టెక్స్ట్-టు-స్పీచ్ ఫీచర్‌ని ఉపయోగించండి, తద్వారా మీ ఆరోగ్య సమాచారాన్ని చదవడం సరళంగా మరియు సులభంగా మారుతుంది.',
    readAloud: 'గట్టిగా చదవండి',
    dictation: 'వాయిస్ టైపింగ్',
    shareResults: 'ఫలితాలను పంచుకోండి',
    speakInsteadText: 'టైప్ చేయడానికి బదులుగా మాట్లాడండి',
    tapMicrophone: 'మైక్రోఫోన్ బటన్‌ను నొక్కి మాట్లాడండి. మీ మాటలు క్రింది బాక్స్‌లో కనిపిస్తాయి.',
    reportTextPlaceholder: 'రిపోర్ట్ టెక్స్ట్ (ఇక్కడ పేస్ట్ చేయండి లేదా టైప్ చేయండి)',
    readReportBtn: 'రిపోర్టును గట్టిగా చదవండి',
    stopReadingBtn: 'చదవడం ఆపండి',
    shareSummaryBtn: 'సారాంశాన్ని పంచుకోండి',
    oneTap: 'ఒకే ఒక ట్యాప్',
    nearbyFacilities: 'సమీప సౌకర్యాలు',
    liveMap: 'లైవ్ మ్యాప్',
    yourName: 'మీ పేరు',
    preferredLanguage: 'ఇష్టపడే భాష',
    selectLanguageOpt: 'మీ భాషను ఎంచుకోండి',
    preferredHospital: 'ఇష్టపడే ఆసుపత్రి',
    savePreferencesBtn: 'నా ప్రాధాన్యతలను సేవ్ చేయి',
    clearBtn: 'క్లియర్ చేయి',
    patientProfileCardHeader: 'మీ పేషెంట్ ప్రొఫైల్ కార్డ్',
    privacyNotice: 'మీ ప్రాధాన్యతలు ఈ బ్రౌజర్ విండోలో మాత్రమే సేవ్ చేయబడతాయి మరియు ఎక్కడికీ పంపబడవు.',
    personalProfileBadge: 'వ్యక్తిగత ప్రొఫైల్',
    languageChoiceBadge: 'భాష ఎంపిక',
    hospitalMatchBadge: 'ఆసుపత్రి సరిపోలిక',
    emailAddressLabel: 'ఈమెయిల్ చిరునామా',
    passwordLabel: 'పాస్‌వర్డ్',
    fullNameLabel: 'పూర్తి పేరు',
    confirmPasswordLabel: 'పాస్‌వర్డ్‌ను ధృవీకరించండి',
    passwordRequirementHint: 'కనీసం 8 లేదా అంతకంటే ఎక్కువ అక్షరాలను ఉపయోగించండి, అందులో కనీసం ఒక పెద్ద అక్షరం, ఒక సంఖ్య మరియు ఒక చిహ్నం (ఉదాహరణకు @, !, #) ఉండాలి.'
  },
  hi: {
    greeting: 'नमस्ते',
    logoutButton: 'लॉग आउट',
    signInButton: 'साइन इन',
    secureAccess: 'सुरक्षित पहुँच',
    welcomeTitle: 'MedClarity में आपका स्वागत है',
    authSubtitle: 'जारी रखने के लिए साइन इन करें या कुछ ही सेकंड में एक नया खाता बनाएं।',
    signInTab: 'साइन इन',
    signUpTab: 'खाता बनाएं',
    signUpButton: 'खाता बनाएं',
    heroTagline: 'एआई-समर्थित रोगी साक्षरता',
    heroHeading1: 'अपनी सेहत को समझें।',
    heroHeading2: 'आत्मविश्वास के साथ आगे बढ़ें।',
    heroText: 'MedClarity जटिल चिकित्सा रिपोर्ट को सरल और रोज़मर्रा की भाषा में बदल देता है। यह बुज़ुर्गों, परिवारों, और किसी भी व्यक्ति को जो स्वास्थ्य जानकारी से अभिभूत महसूस करता है, अपने देखभाल को समझने में मदद करता है।',
    startUnderstanding: 'अपनी रिपोर्ट समझना शुरू करें',
    seeHowItHelps: 'देखें यह कैसे मदद करता है',
    seeStepsButton: 'चरण देखें',
    home: 'होम',
    tools: 'उपकरण',
    healthNav: 'स्वास्थ्य',
    faqNav: 'FAQ',
    more: 'और',
    analyzeReport: 'रिपोर्ट विश्लेषण',
    voiceAssistant: 'वॉइस सहायक',
    nearbyHospitals: 'नज़दीकी अस्पताल',
    preferences: 'सेटिंग्स',
    howItWorks: 'यह कैसे काम करता है',
    reviews: 'समीक्षाएँ',
    contact: 'संपर्क',
    themeDark: 'डार्क',
    themeLight: 'लाइट',
    languageSelect: 'भाषा',
    reportSectionTitle: 'अपनी चिकित्सा रिपोर्ट समझें',
    reportSectionDescription: 'नीचे अपनी चिकित्सा फ़ाइल अपलोड करें। हम इसे पढ़ेंगे और यह सरल शब्दों में बताएंगे कि इसका क्या मतलब है।',
    reportStatusText: 'तुरंत अपनी चिकित्सा रिपोर्ट अपलोड करें और मुख्य निष्कर्षों को स्पष्ट रूप से क्रमबद्ध देखें।',
    statsTerms: 'शब्दों की व्याख्या',
    statsClarityRate: 'स्पष्टता दर',
    statsSupport: 'समर्थन',
    demoWalkthroughLabel: 'हर रोगी के लिए सरल मार्गदर्शिका',
    demoWalkthroughTitle: 'चिकित्सा जानकारी और अगले चरणों को समझने का एक शांत तरीका',
    demoWalkthroughText: 'जब लोग लैब परिणाम, डिस्चार्ज पेपर, या अस्पताल निर्देश देखते हैं तो वे अक्सर चिंतित महसूस करते हैं। MedClarity उन्हें सरल, मैत्रीपूर्ण व्याख्याओं में बदल देता है ताकि आप बेहतर प्रश्न पूछ सकें और अधिक तैयार महसूस कर सकें।',
    demoVideoLabel: 'डेमो वॉकथ्रू',
    demoVideoHeading: 'MedClarity वास्तविक जीवन में कैसे मदद करता है',
    demoVideoText: 'एक निर्देशित उदाहरण देखें जिसमें बताया गया है कि रिपोर्ट कैसे सरल की जाती है, अस्पताल विकल्प कैसे समझाए जाते हैं, और वॉइस सहायता कैसे परिवारों और बुज़ुर्गों के लिए अनुभव को आसान बनाती है।',
    decodeNowButton: 'अब डिकोड करें',
    hospitalNavigatorTitle: 'अस्पताल नेविगेटर',
    hospitalNavigatorDescription: 'अपने निकटतम अस्पतालों को खोजें, दिशा-निर्देश पाएं, और देखें कि कौन आपातकालीन देखभाल प्रदान करता है।',
    navigateNowButton: 'अब नेविगेट करें',
    voiceReaderTitle: 'वॉइस रीडर',
    voiceReaderDescription: 'अपनी स्वास्थ्य रिपोर्ट को ज़ोर से पढ़ने के लिए बोलें — यदि पढ़ना कठिन है तो यह एकदम सही है।',
    listenNowButton: 'अब सुनें',
    myPreferencesTitle: 'मेरी प्राथमिकताएँ',
    myPreferencesDescription: 'अपना नाम, भाषा, और पसंदीदा अस्पताल सहेजें और अपनी व्यक्तिगत प्रोफ़ाइल कार्ड देखें।',
    setPreferencesButton: 'प्राथमिकताएँ सेट करें',
    howLabel: 'यह कैसे काम करता है',
    howHeading: 'अस्पष्टता से स्पष्टता तक एक सरल मार्ग',
    howDescription: 'प्रत्येक चरण शांत, दृश्य और अनुसरण करने में आसान बनाने के लिए डिज़ाइन किया गया है ताकि कोई भी पीछे न महसूस करे।',
    step1Title: 'रिपोर्ट अपलोड करें',
    step1Text: 'फोटो, PDF, या दस्तावेज़ — हम शुरू करना सरल बनाते हैं।',
    step2Title: 'हम इसे डिकोड करते हैं',
    step2Text: 'चिकित्सा शर्तों को सरल, रोज़मर्रा की भाषा में फिर से लिखा जाता है।',
    step3Title: 'मार्गदर्शन एक्सप्लोर करें',
    step3Text: 'जानें कि कौन से प्रश्न पूछने हैं और अगला कदम क्या होना चाहिए।',
    step4Title: 'आत्मविश्वास से निर्णय लें',
    step4Text: 'अपनी नियुक्ति में तैयार और सूचित होकर जाएँ।',
    reviewsLabel: 'रोगी कहानियाँ',
    reviewsHeading: 'हमारे उपयोगकर्ता क्या कहते हैं',
    reviewsDescription: 'परिवार, देखभालकर्ता, और वरिष्ठ MedClarity का उपयोग करते हैं क्योंकि यह उन्हें कम अकेला और अधिक सूचित महसूस करने में मदद करता है।',
    review1Quote: '"MedClarity ने मेरी रक्त जांच को 2 मिनट में समझाया। मुझे अंततः अपनी कोलेस्ट्रॉल समझ आ गई और मैंने ठीक क्या बदलना है पता चल गया।"',
    review1Author: 'रवि कुमार',
    review1Role: 'बेंगलुरु · रोगी',
    review2Quote: '"जब मैं सर्जरी के लिए नए शहर में यात्रा कर रहा था, अस्पताल नेविगेटर जीवनदायक था। मुझे पता चल गया कि कहाँ जाना है और कौन से दस्तावेज ले जाने हैं।"',
    review2Author: 'प्रिया जोशी',
    review2Role: 'पुणे · केयरगिवर',
    review3Quote: '"चिकित्सा शब्दावली ने मुझे हमेशा डरा दिया। MedClarity ने मेरी डिस्चार्ज सारांश को एक मैत्रीपूर्ण पत्र जैसा बना दिया। मेरी बेटी ने इसे सेट किया और मैं हर हफ्ते इसका उपयोग करता हूं।"',
    review3Author: 'सुरेश मेहता',
    review3Role: 'चेन्नई · वरिष्ठ रोगी',
    dropZoneTitle: 'अपनी रिपोर्ट यहाँ ड्रॉप करें',
    dropZoneSubtitle: 'PDF, Word (DOCX), इमेज (PNG / JPG), और टेक्स्ट फ़ाइल (TXT) सपोर्ट करता है',
    chooseFileButton: 'अपने डिवाइस से फ़ाइल चुनें',
    voiceSectionTitle: 'मेरी रिपोर्ट को ज़ोर से पढ़ें',
    voiceSectionDescription: 'अपनी रिपोर्ट टेक्स्ट नीचे चिपकाएँ और रिपोर्ट को ज़ोर से पढ़ने के लिए दबाएँ। आप माइक्रोफ़ोन पर भी टैप कर सकते हैं और हम इसे लिख देंगे।',
    hospitalsSectionTitle: 'अपने नज़दीकी अस्पताल खोजें',
    hospitalsSectionDescription: 'नीचे के बटन को दबाएँ और स्थान एक्सेस की अनुमति दें। हम आपको निकटतम अस्पतालों के दिशानिर्देश और संपर्क नंबर दिखाएंगे।',
    findHospitalsButton: 'मेरे आस-पास अस्पताल खोजें',
    preferencesSectionTitle: 'मेरी प्राथमिकताएँ',
    preferencesSectionDescription: 'नीचे अपने विवरण भरें और सेव पर दबाएँ। आपकी व्यक्तिगत प्रोफ़ाइल कार्ड नीचे दिखाई देगी, जिसे Canvas API के साथ बनाया गया है।',
    savePreferencesButton: 'मेरी प्राथमिकताएँ सहेजें',
    clearButton: 'साफ़ करें',
    readyHospitalTitle: 'आपके नज़दीकी अस्पतालों को खोजने के लिए तैयार',
    readyHospitalText: 'ऊपर दिए बटन पर टैप करें और पूछे जाने पर स्थान एक्सेस की अनुमति दें। आपका स्थान गुप्त रहता है और कभी संग्रहीत नहीं किया जाता।',
    healthHub: 'हेल्थ साक्षरता हब',
    faqCenter: 'FAQ केंद्र',
    healthHubHeadline: 'हेल्थ साक्षरता हब',
    healthHubIntro: 'विश्वसनीय स्वास्थ्य मूल बातें, सामान्य लक्षण और स्पष्ट मार्गदर्शन यहां सरल भाषा में देखें ताकि आप अधिक आत्मविश्वास महसूस कर सकें।',
    healthSearchInfo: 'जल्दी से वह स्वास्थ्य विषय खोजें जिसकी आपको जरूरत है, चाहे वह लक्षण हों, परीक्षण हों, या सरल मार्गदर्शन।',
    healthSearchLabel: 'स्वास्थ्य विषय खोजें',
    healthSearchPlaceholder: 'स्वास्थ्य विषय खोजें…',
    noHealthResults: 'कोई मिलान करता विषय नहीं मिला। कोई दूसरा शब्द आज़माएँ।',
    healthHubDiabetesTitle: 'डायबिटीज़ सरल भाषा में',
    healthHubDiabetesText: 'डायबिटीज तब होती है जब शरीर चीनी का सही उपयोग नहीं कर पाता है। सामान्य लक्षणों में बहुत प्यास लगना, बार-बार पेशाब आना, घाव धीरे-धीरे भरना, और थकान महसूस होना शामिल है। इसे नियंत्रित करने के लिए संतुलित भोजन, निर्धारित दवाएँ, और नियमित ब्लड शुगर जांच जरूरी है।',
    healthHubDiabetesTip1: 'अपने ब्लड शुगर के लक्ष्यों को जानें और डॉक्टर की योजना को फॉलो करें।',
    healthHubDiabetesTip2: 'हर दिन थोड़ी सी सैर जैसे छोटे बदलाव भी बड़ा फर्क ला सकते हैं।',
    healthHubBloodPressureTitle: 'ब्लड प्रेशर की बुनियादी बातें',
    healthHubBloodPressureText: 'ब्लड प्रेशर यह बताता है कि आपकी धमनी में खून कितनी जोर से दबाव डाल रहा है। रिपोर्ट में दो संख्याएँ आती हैं: सिस्टोलिक (ऊपरी) और डायस्टोलिक (निचला)। उच्च ब्लड प्रेशर के कोई लक्षण नहीं भी हो सकते हैं, लेकिन यह स्ट्रोक, हार्ट अटैक, और किडनी की समस्या का खतरा बढ़ाता है।',
    healthHubBloodPressureTip1: 'नियमित जांच कराएँ और संख्याओं को अपने डॉक्टर के साथ साझा करें।',
    healthHubBloodPressureTip2: 'स्वस्थ भोजन, नमक कम करें, और हल्की व्यायाम करें ताकि दबाव नियंत्रित रहे।',
    healthHubHeartHealthTitle: 'दिल की सेहत के संकेत',
    healthHubHeartHealthText: 'दिल की सेहत सिर्फ सीने में दर्द नहीं है। चलने पर जल्दी थक जाना, सांस फूलना, पैरों में सूजन, या सीने में कसाव महसूस होना ध्यान देने योग्य संकेत हैं। ये बताता है कि आपके दिल को अतिरिक्त मदद की आवश्यकता हो सकती है।',
    healthHubHeartHealthTip1: 'यदि सक्रिय होने पर भारीपन, मितली, या पसीना महसूस हो तो डॉक्टर को बताएं।',
    healthHubHeartHealthTip2: 'हल्का व्यायाम करें और तंबाकू से दूर रहें, यह आपके दिल की रक्षा करता है।',
    healthHubReportTermsTitle: 'रिपोर्ट में मिलने वाले शब्द',
    healthHubReportTermsText: 'चिकित्सा रिपोर्ट अक्सर शुगर, कोलेस्ट्रॉल, किडनी फ़ंक्शन, और लिवर टेस्ट का जिक्र करती हैं। ये संख्याएँ डॉक्टर को बताती हैं कि आपका शरीर संतुलित है या दवा, आहार, या देखभाल में बदलाव की ज़रूरत है।',
    healthHubReportTermsTip1: 'HbA1c आपके महीने भर के औसत ब्लड शुगर को दर्शाता है, केवल एक दिन का नहीं।',
    healthHubReportTermsTip2: 'पूछें कि क्या कोई संख्या आपकी उम्र, लिंग, या स्वास्थ्य इतिहास के अनुसार सामान्य है।',
    faqTitle: 'अक्सर पूछे जाने वाले प्रश्न',
    faqIntro: 'बुज़ुर्गों, देखभालकर्ताओं और हर उपयोगकर्ता के लिए यह आसान उपयोग, गोपनीयता और भाषा सहायता प्रश्नों को ध्यान में रखकर बनाए गए हैं।',
    faqQ1: 'मदद पाने के लिए मुझे क्या अपलोड करना चाहिए?',
    faqA1: 'अपनी रिपोर्ट, प्रिस्क्रिप्शन, डॉक्टर के नोट या टेस्ट परिणाम अपलोड करें। यह टूल उन्हें सरल शब्दों में बदलता है ताकि आप समझ सकें।',
    faqQ2: 'मैं अपनी रिपोर्ट परिणाम कैसे पढ़ूं?',
    faqA2: 'विश्लेषक महत्वपूर्ण मानों को हाइलाइट करता है, बताता है कि क्या वे सामान्य हैं, और आपको डॉक्टर से क्या पूछना चाहिए यह सुझाता है।',
    faqQ3: 'क्या मैं इस साइट का उपयोग हिंदी में कर सकता हूँ?',
    faqA3: 'हाँ। ऊपर की भाषा चयन सूची से हिंदी चुनें और साइट तुरंत अपडेट हो जाएगी।',
    faqQ4: 'अगर मुझे तुरंत देखभाल की जरूरत हो तो क्या करूँ?',
    faqA4: 'Nearby Hospitals टूल खोलें, स्थान एक्सेस की अनुमति दें, और यह आपको नज़दीकी अस्पताल, आपातकालीन केंद्र और दिशा-निर्देश दिखाएगा।',
    faqQ5: 'पढ़ने के बाद भी मेरे पास सवाल हों तो क्या करूँ?',
    faqA5: 'आप वॉइस असिस्टेंट का उपयोग कर सकते हैं, सारांश सेव कर सकते हैं, या इसे किसी परिवार के सदस्य या डॉक्टर को दिखा सकते हैं।',
    hospitalSearchLabel: 'निकटवर्ती अस्पताल खोजें',
    hospitalSearchPlaceholder: 'नाम या क्षेत्र से अस्पताल खोजें…',
    noHospitalResults: 'कोई अस्पताल आपके खोज से मेल नहीं खाता। फ़िल्टर साफ़ करें और सभी परिणाम देखें।',
    prefSavedError: 'कृपया सहेजने से पहले कम से कम एक फ़ील्ड भरें।',
    prefSavedSuccess: '✓ आपकी प्राथमिकताएँ सहेज ली गई हैं!',
    prefStatusSaved: 'हैं! आपका Patient Profile Card नीचे अपडेट हो चुका है।',
    prefCleared: 'प्राथमिकताएँ साफ़ कर दी गई हैं।',
    prefStatusCleared: 'सारी प्राथमिकताएँ साफ़ कर दी गई हैं। फिर से भरें और सहेजें।',
    prefNameRequired: 'कृपया नाम के लिए कम से कम 2 वर्ण दर्ज करें।',
    prefHospitalTooLong: 'कृपया अस्पताल का नाम 80 अक्षरों से कम रखें।',
    // Platform Call-to-Actions & Headers
    platformFeatures: 'प्लेटफ़ॉर्म की विशेषताएं',
    everythingNeeded: 'आपके स्वास्थ्य को समझने के लिए सब कुछ जो आपको चाहिए',
    elderlyDescription: 'भ्रमित करने वाली लैब रिपोर्ट से लेकर अस्पताल के रास्तों तक, हर टूल को वृद्ध वयस्कों और देखभाल करने वालों के लिए सरल, स्पष्ट और सहायक बनाने के लिए डिज़ाइन किया गया है।',
    readyToTakeControl: 'क्या आप अपने स्वास्थ्य की देखभाल की जिम्मेदारी लेने के लिए तैयार हैं?',
    startUnderstanding: 'अपनी रिपोर्टों को समझना और आत्मविश्वास के साथ स्वास्थ्य सेवाओं का उपयोग करना शुरू करें। किसी मेडिकल डिग्री की आवश्यकता नहीं है।',
    contactUs: 'हमसे संपर्क करें',
    copyrightNotice: '© 2026 मेडक्लैरिटी (MedClarity) · सुसान मटिल्डा · 1 MCA B · पंजीकरण संख्या: 2647254',
    
    // Voice & Utilities Tabs
    voiceInputInstruction: 'आवाज़ इनपुट और टेक्स्ट-टू-स्पीच का उपयोग करें ताकि आपकी स्वास्थ्य जानकारी पढ़ना सरल और आरामदायक हो सके।',
    readAloud: 'ज़ोर से पढ़ें',
    dictation: 'बोलकर लिखना',
    shareResults: 'परिणाम साझा करें',
    speakInsteadText: 'टाइप करने के बजाय बोलें',
    tapMicrophone: 'माइक्रोफ़ोन बटन दबाएं और बोलें। आपके शब्द नीचे दिए गए बॉक्स में दिखाई देंगे।',
    reportTextPlaceholder: 'रिपोर्ट टेक्स्ट (यहां पेस्ट करें या टाइप करें)',
    readReportBtn: 'रिपोर्ट ज़ोर से पढ़ें',
    stopReadingBtn: 'पढ़ना बंद करें',
    shareSummaryBtn: 'सारांश साझा करें',
    
    // Facilities Tab
    oneTap: 'एक टैप',
    nearbyFacilities: 'आस-पास की सुविधाएं',
    liveMap: 'लाइव नक्शा',
    
    // Profile Management
    yourName: 'आपका नाम',
    preferredLanguage: 'पसंदीदा भाषा',
    selectLanguageOpt: 'अपनी भाषा चुनें',
    preferredHospital: 'पसंदीदा अस्पताल',
    savePreferencesBtn: 'मेरी प्राथमिकताएं सहेजें',
    clearBtn: 'साफ़ करें',
    patientProfileCardHeader: 'आपका मरीज प्रोफ़ाइल कार्ड',
    privacyNotice: 'आपकी प्राथमिकताएं केवल इस ब्राउज़र विंडो में सहेजी जाती हैं और कभी कहीं नहीं भेजी जाती हैं।',
    
    // Features Badges
    personalProfileBadge: 'व्यक्तिगत प्रोफ़ाइल',
    languageChoiceBadge: 'भाषा का चयन',
    hospitalMatchBadge: 'अस्पताल मिलान',
    
    // Authentication & Validation
    emailAddressLabel: 'ईमेल पता',
    passwordLabel: 'पासवर्ड',
    fullNameLabel: 'पूरा नाम',
    confirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
    passwordRequirementHint: 'कम से कम 8 या अधिक अक्षरों का उपयोग करें जिसमें कम से कम एक बड़ा अक्षर (Capital), एक नंबर और एक प्रतीक (जैसे @, !, #) हो।'
  }
};

function translateUI() {
  document.querySelectorAll('[data-i18n], [data-i18n-option]').forEach(el => {
    const key = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-option');
    const text = translations[_siteLanguage]?.[key] ?? translations.en[key];
    if (!text) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
      return;
    }
    if (el.tagName === 'OPTION') {
      el.textContent = text;
      return;
    }
    if (el.querySelector('i')) {
      const icons = Array.from(el.querySelectorAll('i')).map(icon => icon.cloneNode(true));
      el.innerHTML = '';
      icons.forEach(icon => el.appendChild(icon));
      el.appendChild(document.createTextNode(' ' + text));
      return;
    }
    el.textContent = text;
  });
  const themeLabel = document.getElementById('themeToggleText');
  if (themeLabel) {
    themeLabel.textContent = _themeMode === 'light' ? translations[_siteLanguage].themeDark : translations[_siteLanguage].themeLight;
  }
  document.documentElement.lang = _siteLanguage;
  const picker = document.getElementById('languagePicker');
  if (picker) picker.value = _siteLanguage;
  const prefLang = document.getElementById('prefLang');
  if (prefLang) {
    const langMap = { en: 'English', hi: 'Hindi' };
    prefLang.value = langMap[_siteLanguage] || 'English';
  }
}

function setSiteLanguage(lang) {
  if (!translations[lang]) return;
  _siteLanguage = lang;
  try { sessionStorage.setItem('mc_language', lang); } catch (_) {}
  translateUI();
}

function toggleTheme() {
  _themeMode = _themeMode === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark-mode', _themeMode === 'dark');
  const themeText = document.getElementById('themeToggleText');
  if (themeText) themeText.textContent = _themeMode === 'light' ? translations[_siteLanguage].themeDark : translations[_siteLanguage].themeLight;
  try { sessionStorage.setItem('mc_theme', _themeMode); } catch (_) {}
}

/* ============================================================
   1.  TOAST SYSTEM
============================================================ */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type + ' show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function validateFormField(el, validator, errorMessage) {
  const errorEl = document.querySelector(`#${el.id}Error`);
  const isValid = validator(el.value);
  if (!isValid) {
    el.classList.add('input-invalid');
    if (errorEl) errorEl.textContent = errorMessage;
  } else {
    el.classList.remove('input-invalid');
    if (errorEl) errorEl.textContent = '';
  }
  return isValid;
}

function setupDynamicValidation() {
  const email = document.getElementById('authEmail');
  const password = document.getElementById('authPassword');
  if (email) {
    email.addEventListener('input', () => validateFormField(email, v => /\S+@\S+\.\S+/.test(v), translations[_siteLanguage].authEmailError || 'Please enter a valid email.'));
  }
  if (password) {
    password.addEventListener('input', () => validateFormField(password, v => v.trim().length >= 6, translations[_siteLanguage].authPasswordError || 'Password must be at least 6 characters.'));
  }
  const prefName = document.getElementById('prefName');
  if (prefName) {
    prefName.addEventListener('input', () => validateFormField(prefName, v => v.trim().length >= 2, translations[_siteLanguage].prefNameError || 'Please enter your name.'));
  }
}

function setInputInvalidField(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add('input-invalid');
  el.classList.remove('input-valid');
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) errorEl.textContent = message;
  showPrefStatus(message, false);
  el.focus();
}

function clearInputErrors() {
  ['prefName','prefHospital'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('input-invalid');
    const err = document.getElementById(id + 'Error');
    if (err) err.textContent = '';
  });
}

function setupHealthHubSearch() {
  const input = document.getElementById('healthSearchInput');
  if (!input) return;
  input.addEventListener('input', () => filterHealthHubCards(input.value));
}

function filterHealthHubCards(query) {
  const normalized = query.trim().toLowerCase();
  const cards = document.querySelectorAll('#view-health article.card');
  let visibleCount = 0;
  cards.forEach(card => {
    const text = (card.dataset.searchTerms || card.textContent || '').toLowerCase();
    const matches = !normalized || text.includes(normalized);
    card.classList.toggle('hidden', !matches);
    if (matches) visibleCount++;
  });
  const empty = document.getElementById('healthSearchEmptyState');
  if (empty) empty.classList.toggle('hidden', visibleCount > 0);
}

function setupHospitalSearch() {
  const input = document.getElementById('hospitalSearchInput');
  if (!input) return;
  input.addEventListener('input', () => filterHospitalResults(input.value));
}

function renderHospitalResults(hospitals) {
  const countEl = document.getElementById('hospitalCount');
  const statusEl = document.getElementById('locationStatus');
  const list = document.getElementById('hospitalList');
  const empty = document.getElementById('hospitalSearchEmptyState');
  if (!countEl || !statusEl || !list || !empty) return;
  list.innerHTML = '';
  if (!hospitals.length) {
    empty.classList.remove('hidden');
    statusEl.textContent = translations[_siteLanguage]?.noHospitalResults || 'No hospitals match your search. Clear the filter to see all results.';
    countEl.textContent = '0';
    return;
  }
  empty.classList.add('hidden');
  countEl.textContent = hospitals.length;
  statusEl.textContent = hospitals.length === _hospitalResults.length
    ? 'Nearest first · within 8 km'
    : `Showing ${hospitals.length} of ${_hospitalResults.length} results`;
  hospitals.forEach((h, i) => list.appendChild(createHospitalCard(h, i)));
}

function filterHospitalResults(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return renderHospitalResults(_hospitalResults);
  }
  const filtered = _hospitalResults.filter(h =>
    [h.name, h.address, h.emergency ? 'emergency' : '']
      .join(' ').toLowerCase().includes(normalized)
  );
  renderHospitalResults(filtered);
}

/* ============================================================
   2.  PAGE ROUTING
============================================================ */
function switchPage(pageId) {
  if (isProtectedView(pageId) && !_session) {
    openAuthModal();
    showToast('Please sign in to continue.', 'info');
    return;
  }

  const views = ['view-home', 'view-upload', 'view-speech', 'view-geolocation', 'view-preferences', 'view-health', 'view-faq'];
  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== pageId);
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    const active = link.dataset.page === pageId;
    link.classList.toggle('active', active);
    active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
  });
  document.querySelectorAll('.feature-tab').forEach(tab => {
    const active = tab.dataset.page === pageId;
    tab.classList.toggle('active', active);
    active ? tab.setAttribute('aria-current', 'page') : tab.removeAttribute('aria-current');
  });
  // Close dropdown if open
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToHomeSection(sectionId) {
  switchPage('view-home');
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 150);
}

/* ============================================================
   3.  NAV DROPDOWN (Features)
============================================================ */
function toggleNavDropdown(el) {
  el.classList.toggle('open');
}
// Close on outside click
document.addEventListener('click', e => {
  document.querySelectorAll('.nav-dropdown').forEach(d => {
    if (!d.contains(e.target)) d.classList.remove('open');
  });
});

/* ============================================================
   4.  AUTH MODULE  (server-backed authentication)
============================================================ */
function openAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.add('open');
  document.getElementById('authEmail').focus();
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

function closeAuthModalOnOutsideClick(e) {
  if (e.target === document.getElementById('authModal')) closeAuthModal();
}

function toggleAuthTab(mode) {
  currentAuthMode = mode;
  const tIn  = document.getElementById('tabSignIn');
  const tUp  = document.getElementById('tabSignUp');
  const nf   = document.getElementById('authNameField');
  const ni   = document.getElementById('authName');
  const sb   = document.getElementById('authSubmitBtn');
  const cf   = document.getElementById('authConfirmField');
  const ci   = document.getElementById('authConfirmPassword');
  const pw   = document.getElementById('authPassword');
  const pr   = document.getElementById('passwordRules');

  clearAuthValidation();
  pw.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';

  const activeClass  = 'w-1/2 rounded-xl py-2.5 brand font-bold text-sm text-blue-700 bg-white shadow-sm transition';
  const inactiveClass = 'w-1/2 rounded-xl py-2.5 brand font-bold text-sm text-slate-500 hover:text-slate-700 transition';

  if (mode === 'signin') {
    tIn.className = activeClass; tUp.className = inactiveClass;
    nf.classList.add('hidden'); ni.removeAttribute('required');
    cf.classList.add('hidden'); ci.removeAttribute('required');
    pr.classList.add('hidden');
    sb.textContent = translations[_siteLanguage].signInButton || 'Sign In';
  } else {
    tUp.className = activeClass; tIn.className = inactiveClass;
    nf.classList.remove('hidden'); ni.setAttribute('required', 'required');
    cf.classList.remove('hidden'); ci.setAttribute('required', 'required');
    pr.classList.remove('hidden');
    sb.textContent = translations[_siteLanguage].signUpButton || translations[_siteLanguage].signUpTab || 'Create Account';
  }
}

function setAuthFieldState(fieldId, message) {
  const el = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (!el) return !message;

  if (message) {
    el.classList.add('input-invalid');
    el.classList.remove('input-valid');
    el.setAttribute('aria-invalid', 'true');
    if (errorEl) errorEl.textContent = message;
    return false;
  } else {
    el.classList.remove('input-invalid');
    el.classList.add('input-valid');
    el.setAttribute('aria-invalid', 'false');
    if (errorEl) errorEl.textContent = '';
    return true;
  }
}

function validateAuthField(fieldId) {
  const value = document.getElementById(fieldId).value.trim();
  if (fieldId === 'authName') {
    if (currentAuthMode === 'signin') return true;
    if (value.length < 2) return setAuthFieldState(fieldId, 'Enter your full name (at least 2 characters).');
    if (!/^[\p{L}][\p{L}\s.'-]+$/u.test(value)) return setAuthFieldState(fieldId, 'Name can only contain letters, spaces, and . \' -');
  }
  if (fieldId === 'authEmail') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value)) return setAuthFieldState(fieldId, 'Enter a valid email address (e.g. you@gmail.com).');
  }
  if (fieldId === 'authPassword') {
    if (!value) return setAuthFieldState(fieldId, 'Please enter a password.');
    if (currentAuthMode === 'signup' && (
      value.length < 8 || !/[a-z]/.test(value) || !/[A-Z]/.test(value) ||
      !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)
    )) return setAuthFieldState(fieldId, 'Use 8+ characters with uppercase, lowercase, a number and a symbol (e.g. @).');
  }
  if (fieldId === 'authConfirmPassword') {
    if (currentAuthMode === 'signin') return true;
    if (!value) return setAuthFieldState(fieldId, 'Please confirm your password.');
    if (value !== document.getElementById('authPassword').value) return setAuthFieldState(fieldId, 'Passwords do not match. Please re-enter.');
  }
  return setAuthFieldState(fieldId, '');
}

function validateAuthForm() {
  const fields = currentAuthMode === 'signup'
    ? ['authName', 'authEmail', 'authPassword', 'authConfirmPassword']
    : ['authEmail', 'authPassword'];
  const results = fields.map(validateAuthField);
  const firstInvalid = fields.find((_, i) => !results[i]);
  if (firstInvalid) document.getElementById(firstInvalid).focus();
  return results.every(Boolean);
}

function clearAuthValidation() {
  ['authName', 'authEmail', 'authPassword', 'authConfirmPassword'].forEach(id => {
    const f = document.getElementById(id); if (!f) return;
    const e = document.getElementById(id + 'Error');
    f.classList.remove('input-invalid', 'input-valid');
    f.removeAttribute('aria-invalid');
    if (e) e.textContent = '';
  });
}

async function fetchJson(url, options = {}) {
  const currentOrigin = window.location.origin || '';
  const isBackendOrigin = currentOrigin.includes('localhost:3000') || currentOrigin.includes('127.0.0.1:3000');
  const apiBase = window.location.protocol === 'file:' || !isBackendOrigin
    ? 'http://localhost:3000'
    : currentOrigin;
  const targetUrl = /^https?:\/\//.test(url) ? url : `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;

  let response;
  try {
    response = await fetch(targetUrl, {
      credentials: 'include',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (error) {
    throw new Error('The server is unavailable. Please start the app with npm start and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

function isProtectedView(pageId) {
  return protectedViews.includes(pageId);
}

async function restoreServerSession() {
  try {
    const data = await fetchJson('/me');
    _session = data.user || null;
  } catch (_) {
    _session = null;
  }
  updateAuthUI();
  if (_session) {
    switchPage(window.location.pathname.includes('/dashboard') ? 'view-upload' : 'view-home');
  } else {
    switchPage('view-home');
  }
}

/* --- Auth submit handler --- */
async function handleAuthSubmit(e) {
  e.preventDefault();
  if (!validateAuthForm()) return;

  const nameField = document.getElementById('authName');
  const name = nameField ? nameField.value.trim() : '';
  const email = document.getElementById('authEmail').value.trim().toLowerCase();
  const pass = document.getElementById('authPassword').value;
  const endpoint = currentAuthMode === 'signup' ? '/signup' : '/login';
  const payload = currentAuthMode === 'signup'
    ? { name, email, password: pass }
    : { email, password: pass };

  try {
    const data = await fetchJson(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    _session = data.user || null;
    document.getElementById('authForm').reset();
    clearAuthValidation();
    closeAuthModal();
    updateAuthUI();

    if (currentAuthMode === 'signup') {
      showToast('✓ Account created! Welcome, ' + name + '.', 'success');
    } else {
      showToast('✓ Welcome back, ' + (_session ? _session.name : email) + '!', 'success');
    }

    if (data.redirectTo) {
      window.location.href = data.redirectTo;
    }
  } catch (error) {
    const message = error.message || 'Authentication failed.';
    if (message.toLowerCase().includes('already exists')) {
      setAuthFieldState('authEmail', message);
      document.getElementById('authEmail').focus();
    } else if (message.toLowerCase().includes('incorrect')) {
      setAuthFieldState('authPassword', message);
      document.getElementById('authPassword').focus();
    } else {
      showToast(message, 'error');
    }
  }
}

async function handleLogout() {
  try {
    const data = await fetchJson('/logout');
    _session = null;
    updateAuthUI();
    showToast('You have been signed out.', 'info');
    if (data.redirectTo) window.location.href = data.redirectTo;
  } catch (error) {
    showToast(error.message || 'Logout failed.', 'error');
  }
}

function updateAuthUI() {
  const profileDiv  = document.getElementById('authProfile');
  const authBtn     = document.getElementById('btnNavAuth');
  const navUserName = document.getElementById('navUserName');

  if (_session) {
    navUserName.textContent = _session.name;
    profileDiv.classList.remove('hidden');
    authBtn.classList.add('hidden');
    // Pre-fill preferences name
    const prefName = document.getElementById('prefName');
    if (prefName && !prefName.value) prefName.value = _session.name;
  } else {
    profileDiv.classList.add('hidden');
    authBtn.classList.remove('hidden');
  }
}

/* ============================================================
   5.  UI ENHANCEMENT INTERACTIONS
============================================================ */
function enhanceUIInteractions() {
  const heroPanel = document.querySelector('.hero-panel');
  const cards = document.querySelectorAll('.card');
  const focusables = document.querySelectorAll('input, textarea, select');
  const progressBar = document.getElementById('scrollProgress');

  cards.forEach(card => {
    card.classList.add('reveal');
    card.addEventListener('mouseenter', () => card.classList.add('is-active'));
    card.addEventListener('mouseleave', () => card.classList.remove('is-active'));
    card.addEventListener('click', () => {
      card.classList.add('is-clicked');
      setTimeout(() => card.classList.remove('is-clicked'), 180);
    });
  });

  if (heroPanel) {
    heroPanel.classList.add('reveal');
    heroPanel.addEventListener('mousemove', e => {
      const rect = heroPanel.getBoundingClientRect();
      const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
      heroPanel.classList.add('is-active');
      heroPanel.style.transform = `perspective(900px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(-2px)`;
    });
    heroPanel.addEventListener('mouseleave', () => {
      heroPanel.classList.remove('is-active');
      heroPanel.style.transform = '';
    });
  }

  focusables.forEach(input => {
    input.addEventListener('focusin', () => input.classList.add('is-focused'));
    input.addEventListener('focusout', () => input.classList.remove('is-focused'));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const modal = document.getElementById('authModal');
      if (modal && modal.classList.contains('open')) closeAuthModal();
    }

    if ((event.ctrlKey || event.metaKey) && event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      openAuthModal();
    }
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const updateScrollUI = () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    document.body.classList.toggle('scrolled', window.scrollY > 24);
  };

  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('resize', updateScrollUI);
  updateScrollUI();
}

async function openFilePickerNative() {
  if (!('showOpenFilePicker' in window)) {
    createFallbackFileInput();
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Medical Reports',
        accept: {
          'image/*':        ['.png', '.jpg', '.jpeg'],
          'text/plain':     ['.txt'],
          'application/pdf': ['.pdf'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
      }],
      multiple: false
    });
    processPlatformFile(await handle.getFile());
  } catch (err) {
    if (err.name !== 'AbortError') showToast('Could not open file: ' + err.message, 'error');
  }
}

function createFallbackFileInput() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.pdf,.png,.jpg,.jpeg,.txt,.docx';
  inp.onchange = e => { if (e.target.files.length > 0) processPlatformFile(e.target.files[0]); };
  inp.click();
}

async function processPlatformFile(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = ['pdf','docx','txt','png','jpg','jpeg'];
  if (!allowed.includes(ext)) {
    showAnalysisError('This file type cannot be analyzed. Please choose a PDF, Word (DOCX), plain text, or image file.');
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    showAnalysisError('This file is larger than 15 MB. Please choose a smaller report.');
    return;
  }

  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatFileSize(file.size);
  document.getElementById('fileType').textContent = file.type || 'unknown type';
  document.getElementById('fileDetails').classList.remove('hidden');
  document.getElementById('analysisDashboard').classList.add('hidden');
  document.getElementById('analysisError').classList.add('hidden');
  document.getElementById('analysisLoading').classList.remove('hidden');

  try {
    let analysis;
    if (file.type.startsWith('image/') || ['png','jpg','jpeg'].includes(ext)) {
      analysis = await analyzeMedicalImage(file);
    } else {
      const text = await extractReportText(file, ext);
      if (!text || text.trim().length < 20) throw new Error('Very little readable text was found. If this is a scanned image, upload a JPG or PNG instead.');
      analysis = analyzeReportText(text);
      // Share summary to Voice page
      const ta = document.getElementById('speechText');
      if (ta) ta.value = analysis.summary;
    }
    renderAnalysisDashboard(analysis);
    showToast('✓ Report read successfully! See your results below.', 'success');
  } catch (err) {
    showAnalysisError(err.message || 'The report could not be read. Please try another file.');
  } finally {
    document.getElementById('analysisLoading').classList.add('hidden');
  }
}

async function extractReportText(file, ext) {
  if (ext === 'txt') return file.text();
  if (ext === 'pdf') {
    if (!window.pdfjsLib) throw new Error('PDF reader is loading. Please wait a moment and try again.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      pages.push(content.items.map(i => i.str).join(' '));
    }
    return pages.join('\n');
  }
  if (ext === 'docx') {
    if (!window.mammoth) throw new Error('Word reader is loading. Please wait a moment and try again.');
    const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  throw new Error('Older .doc files are not supported. Please save the report as DOCX, PDF, or TXT and try again.');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, s = ['Bytes','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
}

/* ============================================================
   6.  REPORT ANALYSIS ENGINE
============================================================ */
function analyzeReportText(rawText) {
  const text = rawText.replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  const termGroups = {
    'Blood health':   ['hemoglobin','platelet','white blood cell','wbc','red blood cell','rbc','cbc'],
    'Blood sugar':    ['glucose','blood sugar','hba1c','a1c'],
    'Heart health':   ['cholesterol','triglyceride','hdl','ldl','blood pressure','heart rate'],
    'Kidney health':  ['creatinine','urea','egfr','kidney'],
    'Liver health':   ['bilirubin','albumin','alt','ast','liver'],
    'Thyroid':        ['thyroid','tsh','t3','t4'],
    'Inflammation':   ['crp','esr','inflammation']
  };

  const matchedGroups = [];
  let termCount = 0;
  Object.entries(termGroups).forEach(([group, terms]) => {
    const matched = terms.filter(t => new RegExp('\\b' + t.replace(/\s+/g,'\\s+') + '\\b','i').test(lower));
    if (matched.length) matchedGroups.push({ group, terms: matched });
    termCount += matched.length;
  });

  const readings = text.match(/\b\d+(?:\.\d+)?\s*(?:mg\/dL|g\/dL|mmol\/L|mEq\/L|U\/L|IU\/L|mmHg|bpm|%|cells?\/\w+|\/µ?L|cm|mm)\b/gi) || [];
  const flagPattern = /\b(?:abnormal|elevated|high|low|decreased|positive|negative|critical|urgent|follow[- ]?up|out of range)\b/gi;
  const flags = text.match(flagPattern) || [];
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const important = sentences.filter(s => /impression|conclusion|overall|normal|abnormal|recommend|follow|indicat|diagnos|result/i.test(s));
  const chosen = (important.length ? important : sentences).slice(0, 3).map(s => s.trim());
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const summary = chosen.join(' ').slice(0, 700) || 'The report has readable medical information, but no clear conclusion was found automatically. Please read it with your doctor.';

  const findings = matchedGroups.slice(0, 4).map(item => ({
    icon: 'fa-circle-check', color: 'text-blue-600',
    title: item.group,
    detail: 'This report mentions: ' + item.terms.slice(0, 3).join(', ') + '.'
  }));

  if (flags.length) findings.unshift({
    icon: 'fa-triangle-exclamation', color: 'text-amber-500',
    title: 'Words that need attention',
    detail: 'The report uses these words: ' + Array.from(new Set(flags.map(f => f.toLowerCase()))).slice(0, 6).join(', ') + '. Please ask your doctor what they mean for you.'
  });

  if (!findings.length) findings.push({
    icon: 'fa-circle-info', color: 'text-slate-400',
    title: 'General report',
    detail: 'No common lab test category was identified. This could be a prescription or a general letter.'
  });

  const keyPoints = [];
  if (matchedGroups.length) {
    keyPoints.push('This report mentions the following health areas: ' + matchedGroups.map(m => m.group).join(', ') + '.');
  }
  if (flags.length) {
    keyPoints.push('Several words suggest caution or follow-up. Share these results with your doctor.');
  }
  if (/normal|within range|stable|unchanged/i.test(text)) {
    keyPoints.push('Some results are described as normal or within range, which is a positive sign.');
  }
  if (!keyPoints.length) {
    keyPoints.push('The report contains medical details but did not clearly label a conclusion. Review it with a healthcare provider.');
  }

  const nextSteps = [];
  if (flags.length) {
    nextSteps.push('Ask your doctor about any abnormal or urgent terms found in the report.');
  }
  nextSteps.push('Bring this summary and the exact report to your next appointment.');
  nextSteps.push('Request a plain-language explanation for any numbers or phrases you do not understand.');

  return {
    kind: 'text', summary, keyPoints, nextSteps, findings, termCount,
    readingCount: readings.length, flagCount: flags.length, wordCount,
    chart: [Math.min(termCount, 20), Math.min(readings.length, 20), Math.min(flags.length, 20), Math.min(Math.ceil(wordCount / 50), 20)]
  };
}

function analyzeMedicalImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas');
      const scale = Math.min(1, 400 / Math.max(img.naturalWidth, img.naturalHeight));
      c.width  = Math.max(1, Math.round(img.naturalWidth  * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0, sq = 0;
      for (let i = 0; i < px.length; i += 16) {
        const b = px[i] * .299 + px[i+1] * .587 + px[i+2] * .114;
        sum += b; sq += b * b;
      }
      const n = px.length / 16;
      const avg = sum / n;
      const contrast = Math.sqrt(Math.max(0, sq / n - avg * avg));
      const resScore = Math.min(100, Math.round((img.naturalWidth * img.naturalHeight / 2000000) * 100));
      const briScore = Math.max(0, Math.round(100 - Math.abs(145 - avg) * .7));
      const conScore = Math.min(100, Math.round(contrast * 2.2));
      URL.revokeObjectURL(url);
      const good = briScore >= 60 && conScore >= 40;
      resolve({
        kind: 'image', termCount: 0, readingCount: 0, flagCount: 0, wordCount: 0,
        summary: `This image is ${img.naturalWidth} × ${img.naturalHeight} pixels. The brightness and contrast are ${good ? 'good for reading' : 'possibly too low for reading — try uploading a clearer photo'}. To read text from the report, please upload a PDF or text file instead.`,
        findings: [
          { icon: 'fa-expand',            color: 'text-blue-500', title: 'Image size',    detail: `${img.naturalWidth} × ${img.naturalHeight} px — Quality score: ${resScore}%` },
          { icon: 'fa-sun',               color: 'text-amber-500', title: 'Brightness',  detail: `${briScore}% — ${briScore >= 60 ? 'Good' : 'May be too dark or too bright'}` },
          { icon: 'fa-circle-half-stroke', color: 'text-indigo-500', title: 'Contrast', detail: `${conScore}% — ${conScore >= 40 ? 'Clear enough to read' : 'May be hard to read'}` }
        ],
        chart: [resScore / 5, briScore / 5, conScore / 5, Math.min(20, file.size / 250000)]
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The image could not be opened. Please try a different PNG or JPG.')); };
    img.src = url;
  });
}

/* ============================================================
   7.  CANVAS API – ANALYSIS BAR CHART
============================================================ */
function renderAnalysisDashboard(analysis) {
  document.getElementById('metricTerms').textContent   = analysis.termCount;
  document.getElementById('metricReadings').textContent = analysis.readingCount;
  document.getElementById('metricFlags').textContent   = analysis.flagCount;
  document.getElementById('metricWords').textContent   = analysis.wordCount;
  document.getElementById('analysisSummary').textContent = analysis.summary;

  const takeaways = document.getElementById('analysisTakeaways');
  const advice = document.getElementById('analysisAdvice');
  const findingsContainer = document.getElementById('analysisFindings');

  takeaways.innerHTML = '';
  if (analysis.keyPoints && analysis.keyPoints.length) {
    takeaways.innerHTML = `
      <div class="rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <div class="flex items-center gap-3 mb-3">
          <i class="fa-solid fa-lightbulb text-blue-600 text-xl"></i>
          <h4 class="brand text-sm font-bold text-blue-900">Simple takeaways</h4>
        </div>
        <div class="space-y-3">
          ${analysis.keyPoints.map(point => `<p class="text-sm leading-6 text-slate-600">• ${point}</p>`).join('')}
        </div>
      </div>`;
  }

  advice.innerHTML = '';
  if (analysis.nextSteps && analysis.nextSteps.length) {
    advice.innerHTML = `
      <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div class="flex items-center gap-3 mb-3">
          <i class="fa-solid fa-hands-holding-circle text-slate-700 text-xl"></i>
          <h4 class="brand text-sm font-bold text-slate-900">What to do next</h4>
        </div>
        <div class="space-y-3">
          ${analysis.nextSteps.map(step => `<p class="text-sm leading-6 text-slate-600">• ${step}</p>`).join('')}
        </div>
      </div>`;
  }

  findingsContainer.innerHTML = '';
  analysis.findings.forEach(f => {
    const row = document.createElement('div');
    row.className = 'flex gap-3 rounded-lg bg-slate-50 px-3 py-3';
    row.innerHTML = `<i class="fa-solid ${f.icon} ${f.color} mt-1 text-lg"></i>
      <div>
        <p class="brand text-sm font-bold text-slate-800">${f.title}</p>
        <p class="mt-0.5 text-sm leading-5 text-slate-600">${f.detail}</p>
      </div>`;
    findingsContainer.appendChild(row);
  });

  document.getElementById('analysisDashboard').classList.remove('hidden');
  requestAnimationFrame(() => drawAnalysisChart(analysis.chart, analysis.kind));
}

function drawAnalysisChart(values, kind) {
  const canvas = document.getElementById('analysisCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const dw = canvas.clientWidth || 520;
  const dh = Math.round(dw * 0.56);
  canvas.width  = dw * dpr;
  canvas.height = dh * dpr;
  ctx.scale(dpr, dpr);

  const labels = kind === 'image'
    ? ['Resolution', 'Brightness', 'Contrast', 'File size']
    : ['Health terms', 'Measurements', 'Review flags', 'Text depth'];
  const colors = ['#2563eb','#4f46e5','#f59e0b','#0d9488'];
  const p = { top: 32, right: 20, bottom: 58, left: 40 };
  const W = dw - p.left - p.right;
  const H = dh - p.top  - p.bottom;

  ctx.clearRect(0, 0, dw, dh);

  // Grid lines
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = p.top + H * i / 4;
    ctx.beginPath(); ctx.moveTo(p.left, y); ctx.lineTo(dw - p.right, y); ctx.stroke();
    // Y-axis label
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px DM Sans, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(20 - 5 * i)), p.left - 6, y + 4);
  }

  const slot = W / values.length;
  values.forEach((val, i) => {
    const norm = Math.max(0, Math.min(20, val));
    const bh = norm / 20 * H;
    const bw = Math.min(64, slot * 0.55);
    const x  = p.left + slot * i + (slot - bw) / 2;
    const y  = p.top + H - bh;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, y + bh);
    grad.addColorStop(0, colors[i]);
    grad.addColorStop(1, colors[i] + '99');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, Math.max(4, bh), 8);
    ctx.fill();

    // Value label above bar
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 12px Sora, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(Math.round(val * 10) / 10), x + bw / 2, Math.max(20, y - 8));

    // X-axis label (wrap long labels)
    ctx.fillStyle = '#475569'; ctx.font = '11px DM Sans, sans-serif';
    const words = labels[i].split(' ');
    if (words.length === 1) {
      ctx.fillText(words[0], x + bw / 2, dh - 22);
    } else {
      ctx.fillText(words[0], x + bw / 2, dh - 34);
      ctx.fillText(words.slice(1).join(' '), x + bw / 2, dh - 20);
    }
  });

  // Chart title
  ctx.fillStyle = '#64748b'; ctx.font = '11px DM Sans, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Report Signal Overview (scale 0–20)', p.left, 18);
}

function showAnalysisError(msg) {
  document.getElementById('analysisLoading').classList.add('hidden');
  document.getElementById('analysisDashboard').classList.add('hidden');
  const box = document.getElementById('analysisError');
  box.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i>${msg}`;
  box.classList.remove('hidden');
  showToast(msg, 'error');
}

/* ============================================================
   8.  CANVAS API – PATIENT PROFILE CARD (replaces localStorage prefs display)
============================================================ */
function drawProfileCard() {
  const canvas = document.getElementById('profileCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 520, H = 240;
  canvas.width  = W * (window.devicePixelRatio || 1);
  canvas.height = H * (window.devicePixelRatio || 1);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  // Card background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1d4ed8');
  bg.addColorStop(1, '#0891b2');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Decorative circle
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.beginPath(); ctx.arc(W - 60, 50, 90, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(50, H - 20, 70, 0, Math.PI * 2); ctx.fill();

  // Avatar circle
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.beginPath(); ctx.arc(68, 80, 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Sora, sans-serif';
  ctx.textAlign = 'center';
  const initials = (_prefs.name || 'Me').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  ctx.fillText(initials, 68, 90);

  // Name
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Sora, sans-serif';
  ctx.fillText(_prefs.name || 'Patient', 126, 68);

  // Sub-labels
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.font = '14px DM Sans, sans-serif';
  ctx.fillText('Language: ' + (_prefs.lang || 'Not set'), 126, 96);
  ctx.fillText('Hospital: ' + (_prefs.hospital || 'Not set'), 126, 118);

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, 148); ctx.lineTo(W - 24, 148); ctx.stroke();

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.font = '12px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MedClarity · Patient Literacy Platform · ' + new Date().getFullYear(), W / 2, 172);

  // Badge
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath(); ctx.roundRect(W - 130, H - 42, 106, 28, 14); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Sora, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓ Preferences Saved', W - 77, H - 23);
}

/* ============================================================
   9.  PREFERENCES MODULE (in-memory, no localStorage)
============================================================ */
function savePreferences() {
  const nameField = document.getElementById('prefName');
  const langField = document.getElementById('prefLang');
  const hospitalField = document.getElementById('prefHospital');
  const name = nameField?.value.trim() || '';
  const lang = langField?.value || '';
  const hospital = hospitalField?.value.trim() || '';

  clearInputErrors();
  if (!name && !lang && !hospital) {
    showToast(translations[_siteLanguage]?.prefSavedError || 'Please fill in at least one field before saving.', 'error');
    showPrefStatus(translations[_siteLanguage]?.prefSavedError || 'Please enter your name, language, or hospital first.', false);
    return;
  }
  if (name && name.length < 2) {
    setInputInvalidField('prefName', translations[_siteLanguage]?.prefNameRequired || 'Please enter at least 2 characters for name.');
    return;
  }
  if (hospital && hospital.length > 80) {
    setInputInvalidField('prefHospital', translations[_siteLanguage]?.prefHospitalTooLong || 'Please keep the hospital name under 80 characters.');
    return;
  }

  _prefs = { name: name || _prefs.name, lang: lang || _prefs.lang, hospital: hospital || _prefs.hospital };
  if (lang === 'Hindi') {
    setSiteLanguage('hi');
  } else if (lang === 'English') {
    setSiteLanguage('en');
  } 
  else if (lang === 'Telugu') {
    setSiteLanguage('te');
  } else if (lang === 'Kannada') {
    setSiteLanguage('kn');
  } else if (lang === 'Tamil') {
    setSiteLanguage('ta');
  } else if (lang === 'Malayalam') {
    setSiteLanguage('ml');
  } else if (lang) {
  // Safe fallback for other selections (e.g., Bengali, Marathi if not yet added)
    showToast('Selected language is partially supported or saved for profile usage.', 'info');
  }

  if (_session && name) {
    _session.name = name;
    updateAuthUI();
  }

  showToast(translations[_siteLanguage]?.prefSavedSuccess || '✓ Your preferences have been saved!', 'success');
  showPrefStatus(translations[_siteLanguage]?.prefStatusSaved || 'Done! Your Patient Profile Card has been updated below.', true);
  drawProfileCard();
}

function clearPreferences() {
  _prefs = { name: '', lang: '', hospital: '' };
  document.getElementById('prefName').value    = '';
  document.getElementById('prefLang').value    = '';
  document.getElementById('prefHospital').value = '';
  clearInputErrors();
  showToast(translations[_siteLanguage]?.prefCleared || 'Preferences cleared.', 'info');
  showPrefStatus(translations[_siteLanguage]?.prefStatusCleared || 'All preferences have been cleared. Fill in and save again.', false);
  drawProfileCard();
}

function showPrefStatus(msg, isSuccess) {
  const el = document.getElementById('prefStatus');
  el.classList.remove('hidden');
  el.textContent = msg;
  el.className = isSuccess
    ? 'mt-5 text-base rounded-xl p-4 border bg-green-50 text-green-700 border-green-200'
    : 'mt-5 text-base rounded-xl p-4 border bg-amber-50 text-amber-700 border-amber-200';
}

/* ============================================================
   10. WEB SPEECH API – SYNTHESIS + DICTATION
============================================================ */
function setupVoiceSynthetics() {
  if (!('speechSynthesis' in window)) return;
  const update = () => {
    platformVoices = window.speechSynthesis.getVoices();
    const sel = document.getElementById('voiceSelect'); if (!sel) return;
    sel.innerHTML = '';
    platformVoices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${v.name} (${v.lang})${v.default ? ' — System Default' : ''}`;
      sel.appendChild(opt);
    });
  };
  update();
  if (window.speechSynthesis.onvoiceschanged !== undefined)
    window.speechSynthesis.onvoiceschanged = update;
}

function readReportAloud() {
  const text = document.getElementById('speechText').value.trim();
  if (!text) { showToast('Please type or paste some text first.', 'error'); return; }
  if (!('speechSynthesis' in window)) { showToast('Your browser does not support text-to-speech.', 'error'); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const idx = document.getElementById('voiceSelect').value;
  if (platformVoices[idx]) utt.voice = platformVoices[idx];
  utt.rate = 0.92; utt.pitch = 1;
  utt.onstart = () => {
    document.getElementById('speechStatus').classList.remove('hidden');
    document.getElementById('speechStatusText').textContent = 'Reading aloud…';
    document.getElementById('btnReadAloud').classList.add('opacity-50');
  };
  utt.onend = () => {
    document.getElementById('speechStatus').classList.add('hidden');
    document.getElementById('btnReadAloud').classList.remove('opacity-50');
    showToast('✓ Done reading aloud.', 'success');
  };
  window.speechSynthesis.speak(utt);
}

function stopReading() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    document.getElementById('speechStatus').classList.add('hidden');
    document.getElementById('btnReadAloud').classList.remove('opacity-50');
    showToast('Reading stopped.', 'info');
  }
}

function setupVoiceRecognitionEngine() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  dynamicSpeechRecognition = new SR();
  dynamicSpeechRecognition.continuous = true;
  dynamicSpeechRecognition.interimResults = false;
  dynamicSpeechRecognition.lang = 'en-US';
  dynamicSpeechRecognition.onresult = e => {
    const t = e.results[e.results.length - 1][0].transcript;
    const ta = document.getElementById('speechText');
    ta.value = (ta.value.trim() + ' ' + t).trim();
    showToast('Speech added to text box.', 'success');
  };
  dynamicSpeechRecognition.onerror = () => stopDictationRuntime();
  dynamicSpeechRecognition.onend  = () => stopDictationRuntime();
}

function toggleDictation() {
  if (!dynamicSpeechRecognition) { showToast('Microphone not available in this browser.', 'error'); return; }
  if (!isDictating) {
    dynamicSpeechRecognition.start();
    isDictating = true;
    document.getElementById('micIcon').className = 'fa-solid fa-microphone-lines text-red-400 animate-ping';
    showToast('Microphone on — start speaking!', 'info');
  } else {
    dynamicSpeechRecognition.stop();
    stopDictationRuntime();
  }
}

function stopDictationRuntime() {
  isDictating = false;
  const mi = document.getElementById('micIcon');
  if (mi) mi.className = 'fa-solid fa-microphone text-white';
}

/* ============================================================
   11. WEB SHARE API
============================================================ */
function shareReport() {
  const text = document.getElementById('speechText').value.trim();
  if (!text) { showToast('There is no text to share yet.', 'error'); return; }
  if (navigator.share) {
    navigator.share({ title: 'My MedClarity Report Summary', text, url: window.location.href })
      .then(() => showToast('✓ Shared successfully!', 'success'))
      .catch(err => { if (err.name !== 'AbortError') showToast('Could not share: ' + err.message, 'error'); });
  } else {
    navigator.clipboard.writeText(text)
      .then(() => showToast('📋 Text copied to clipboard!', 'success'))
      .catch(() => showToast('Clipboard not available. Please copy the text manually.', 'error'));
  }
}

/* ============================================================
   12. GEOLOCATION API
============================================================ */
async function updatePermissionStatusIndicator() {
  if (!navigator.permissions) return;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    modifyPermissionBadge(status.state);
    status.onchange = () => modifyPermissionBadge(status.state);
  } catch(_) {}
}

function modifyPermissionBadge(state) {
  const badge = document.getElementById('permissionBadge');
  if (!badge) return;
  if (state === 'granted') {
    badge.className = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-green-100 text-green-700';
    badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Location: Allowed';
  } else if (state === 'denied') {
    badge.className = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-700';
    badge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Location: Blocked';
  } else {
    badge.className = 'hidden';
  }
}

function getMyLocation() {
  if (!navigator.geolocation) { showToast('Location is not available in this browser.', 'error'); return; }
  ['hospitalEmptyState','locationResult','locationError'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.getElementById('hospitalLoading').classList.remove('hidden');
  showToast('📍 Finding hospitals near you…', 'info');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      document.getElementById('mapsLink').href = `https://www.google.com/maps?q=${lat},${lng}`;
      document.getElementById('hospitalSearchLink').href = `https://www.google.com/maps/search/hospitals+near+me/@${lat},${lng},14z`;
      document.getElementById('hospitalMap').src =
        `https://www.google.com/maps?q=hospitals+near+${lat},${lng}&output=embed`;
      document.getElementById('hospitalList').innerHTML =
        '<div class="rounded-2xl border border-blue-100 bg-white p-8 text-center"><i class="fa-solid fa-circle-notch fa-spin text-blue-600 text-xl"></i><p class="mt-2 text-sm text-slate-500">Loading nearby hospitals…</p></div>';
      findNearbyHospitals(lat, lng);
      showToast('✓ Location found! Loading hospitals…', 'success');
      updatePermissionStatusIndicator();
    },
    err => {
      const msgs = {
        [err.PERMISSION_DENIED]: 'Location access was blocked. Please allow it in your browser settings and try again.',
        [err.POSITION_UNAVAILABLE]: 'Your current position could not be found.',
        [err.TIMEOUT]: 'Finding your location took too long. Please try again.'
      };
      const msg = msgs[err.code] || 'Your location could not be retrieved.';
      document.getElementById('hospitalLoading').classList.add('hidden');
      document.getElementById('hospitalEmptyState').classList.remove('hidden');
      document.getElementById('locationError').classList.remove('hidden');
      document.getElementById('locationErrorText').textContent = msg;
      showToast(msg, 'error');
      updatePermissionStatusIndicator();
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

async function findNearbyHospitals(lat, lng) {
  const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:8000,${lat},${lng});way["amenity"="hospital"](around:8000,${lat},${lng});relation["amenity"="hospital"](around:8000,${lat},${lng}););out center tags;`;
  const endpoints = ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let data = null;
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep + '?data=' + encodeURIComponent(query));
      if (!r.ok) continue;
      data = await r.json();
      break;
    } catch (_) {}
  }

  document.getElementById('hospitalLoading').classList.add('hidden');
  document.getElementById('locationResult').classList.remove('hidden');

  if (!data) { renderHospitalFallback(lat, lng, 'The live hospital directory is temporarily unavailable. You can still explore using the Google Map.'); return; }

  const hospitals = data.elements.map(el => {
    const hLat = el.lat ?? el.center?.lat;
    const hLng = el.lon ?? el.center?.lon;
    if (hLat == null || hLng == null) return null;
    return {
      name: el.tags?.name || el.tags?.['name:en'] || 'Hospital',
      emergency: el.tags?.emergency === 'yes',
      phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
      address: formatHospitalAddress(el.tags || {}),
      lat: hLat, lng: hLng,
      distance: distanceInKm(lat, lng, hLat, hLng)
    };
  }).filter(Boolean).sort((a,b) => a.distance - b.distance).slice(0, 8);

  if (!hospitals.length) { renderHospitalFallback(lat, lng, 'No hospitals were found within 8 km. Use the Google Map to search a wider area.'); return; }

  _hospitalResults = hospitals;
  renderHospitalResults(hospitals);
}

function createHospitalCard(h, i) {
  const card = document.createElement('article');
  card.className = 'hospital-card rounded-2xl border border-slate-200 bg-white p-5';
  card.innerHTML = `
    <div class="flex items-start gap-4">
      <div class="w-11 h-11 shrink-0 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center brand text-sm font-extrabold">${String(i+1).padStart(2,'0')}</div>
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <h3 class="brand text-base font-bold text-slate-900">${h.name}</h3>
          <span class="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
            ${h.distance < 1 ? Math.round(h.distance * 1000) + ' m' : h.distance.toFixed(1) + ' km'}
          </span>
        </div>
        <p class="mt-1 text-sm leading-5 text-slate-500">${h.address}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}" target="_blank" rel="noopener"
             class="brand rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 transition">
            <i class="fa-solid fa-diamond-turn-right mr-1"></i>Get Directions
          </a>
          ${h.emergency ? '<span class="rounded-lg bg-red-50 px-2.5 py-2 text-xs font-bold text-red-600"><i class="fa-solid fa-truck-medical mr-1"></i>Emergency Care</span>' : ''}
          ${h.phone ? `<a href="tel:${h.phone.replace(/[^+\d]/g,'')}" class="rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"><i class="fa-solid fa-phone mr-1"></i>Call</a>` : ''}
        </div>
      </div>
    </div>`;
  return card;
}

function formatHospitalAddress(tags) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const locality = tags['addr:suburb'] || tags['addr:city'] || tags['addr:town'] || tags['addr:village'];
  return [street, locality, tags['addr:postcode']].filter(Boolean).join(', ') || 'Address available in Google Maps';
}

function distanceInKm(lat1, lng1, lat2, lng2) {
  const r2d = v => v * Math.PI / 180;
  const dLat = r2d(lat2 - lat1), dLng = r2d(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(r2d(lat1)) * Math.cos(r2d(lat2)) * Math.sin(dLng/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function renderHospitalFallback(lat, lng, msg) {
  document.getElementById('hospitalCount').textContent = '0';
  document.getElementById('locationStatus').textContent = 'Google Maps is available';
  const list = document.getElementById('hospitalList');
  list.innerHTML = `
    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-base leading-6 text-amber-900">
      <p>${msg}</p>
      <a href="https://www.google.com/maps/search/hospitals+near+me/@${lat},${lng},13z"
         target="_blank" rel="noopener"
         class="brand mt-4 inline-block rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white">
        Open Hospitals in Google Maps
      </a>
    </div>`;
}

/* ============================================================
   13. DRAG AND DROP SETUP
============================================================ */
function setupDragAndDrop() {
  const dz = document.getElementById('dropZone');
  if (!dz) return;
  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragenter', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', ()=> dz.classList.remove('drag-over'));
  dz.addEventListener('drop',      e => {
    e.preventDefault(); dz.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) processPlatformFile(e.dataTransfer.files[0]);
  });
}



/* ============================================================
   14. BOOTSTRAP
============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  try {
    const lang = sessionStorage.getItem('mc_language');
    if (lang && translations[lang]) _siteLanguage = lang;
  } catch(_) {}
  try {
    const theme = sessionStorage.getItem('mc_theme');
    if (theme === 'dark' || theme === 'light') _themeMode = theme;
  } catch(_) {}

  document.body.classList.toggle('dark-mode', _themeMode === 'dark');
  translateUI();
  restoreServerSession();

  setupVoiceSynthetics();
  setupVoiceRecognitionEngine();
  updatePermissionStatusIndicator();
  setupDragAndDrop();
  setupDynamicValidation();
  setupHealthHubSearch();
  setupHospitalSearch();
  enhanceUIInteractions();

  // Draw initial empty profile canvas
  drawProfileCard();

  // Auth field live validation
  ['authName','authEmail','authPassword','authConfirmPassword'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('blur',  () => validateAuthField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('input-invalid')) validateAuthField(id);
      if (id === 'authPassword' && currentAuthMode === 'signup') {
        const c = document.getElementById('authConfirmPassword');
        if (c && c.value) validateAuthField('authConfirmPassword');
      }
    });
  });
});