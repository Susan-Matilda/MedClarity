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
// In-memory account store (prototype — resets on page refresh; not a real backend)
const _accounts = new Map();

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
    heroText: 'MedClarity turns confusing medical reports into clear, everyday language. It helps older adults, families, and anyone who feels overwhelmed understand their care with confidence.',
    startUnderstanding: 'Start Understanding My Report',
    seeHowItHelps: 'See How It Helps',
    seeStepsButton: 'See the Steps',
    home: 'Home',
    tools: 'Tools',
    healthNav: 'Health',
    faqNav: 'FAQ',
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
    reportSectionDescription: 'Upload your medical file below. We will read it and explain what it means in simple words — no medical knowledge needed.',
    reportStatusText: 'Instantly upload a medical report and see the key findings clearly organized for you.',
    statsTerms: 'Terms Decoded',
    statsClarityRate: 'Clarity Rate',
    statsSupport: 'Support',
    demoWalkthroughLabel: 'Simple guide for every patient',
    demoWalkthroughTitle: 'A calm, easy way to understand medical information and next steps',
    demoWalkthroughText: 'Many people feel nervous when they see lab results, discharge papers, or hospital instructions. MedClarity turns them into simple, friendly explanations so you can ask better questions and feel more prepared.',
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
    howDescription: 'Each step is designed to be calm, visual, and easy to follow so nobody feels left behind.',
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
    reviewsDescription: 'Families, caregivers, and seniors use MedClarity because it helps them feel less alone and more informed.',
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
    voiceSectionDescription: 'Paste your report text below and press Read Report Aloud. You can also tap the microphone to speak and we will write it down for you.',
    hospitalsSectionTitle: 'Find a Hospital Near You',
    hospitalsSectionDescription: 'Press the button below and allow location access. We will show you the nearest hospitals with directions and contact numbers.',
    findHospitalsButton: 'Find Hospitals Near Me',
    preferencesSectionTitle: 'My Preferences',
    preferencesSectionDescription: 'Fill in your details below and press Save. Your personal profile card will appear at the bottom, drawn using the Canvas API.',
    savePreferencesButton: 'Save My Preferences',
    clearButton: 'Clear',
    readyHospitalTitle: 'Ready to find hospitals near you',
    readyHospitalText: 'Tap the button above and allow location access when asked. Your location stays private and is never stored.',
    healthHub: 'Health Literacy Hub',
    faqCenter: 'FAQ Center',
    healthHubHeadline: 'Health Literacy Hub',
    healthHubIntro: 'Explore trusted health basics, common symptoms, and clear guidance so you feel more confident about your own care.',
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
    faqIntro: 'Questions and answers for older adults, caregivers, and anyone who wants to use MedClarity with ease.',
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
  }
};

function translateUI() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = translations[_siteLanguage]?.[key] ?? translations.en[key];
    if (!text) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
      return;
    }
    if (el.tagName === 'OPTION' && el.hasAttribute('data-i18n-option')) {
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
   4.  AUTH MODULE  (in-memory accounts + sessionStorage session)
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

/* --- Simple password hash (SHA-256 via SubtleCrypto) --- */
async function hashPassword(email, password) {
  const input = new TextEncoder().encode(email.toLowerCase() + '::medclarity::' + password);
  if (window.crypto && window.crypto.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', input);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  // Fallback FNV-1a
  let h = 2166136261;
  input.forEach(byte => { h ^= byte; h = Math.imul(h, 16777619); });
  return 'fallback-' + (h >>> 0).toString(16);
}

/* --- Auth submit handler --- */
async function handleAuthSubmit(e) {
  e.preventDefault();
  if (!validateAuthForm()) return;

  const name  = document.getElementById('authName').value.trim();
  const email = document.getElementById('authEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('authPassword').value;

  if (currentAuthMode === 'signup') {
    if (_accounts.has(email)) {
      setAuthFieldState('authEmail', 'An account with this email already exists. Please sign in instead.');
      document.getElementById('authEmail').focus();
      return;
    }
    const hash = await hashPassword(email, pass);
    _accounts.set(email, { name, email, hash, createdAt: new Date().toISOString() });
    _session = { name, email };
    showToast('✓ Account created! Welcome, ' + name + '.', 'success');
  } else {
    const account = _accounts.get(email);
    if (!account) {
      setAuthFieldState('authEmail', 'No account found with this email. Please create an account first.');
      document.getElementById('authEmail').focus();
      return;
    }
    const hash = await hashPassword(email, pass);
    if (account.hash !== hash) {
      setAuthFieldState('authPassword', 'Incorrect password. Please try again.');
      document.getElementById('authPassword').focus();
      return;
    }
    _session = { name: account.name, email: account.email };
    showToast('✓ Welcome back, ' + account.name + '!', 'success');
  }

  // Persist session in sessionStorage so it survives soft refreshes
  try { sessionStorage.setItem('mc_session', JSON.stringify(_session)); } catch(_) {}

  document.getElementById('authForm').reset();
  clearAuthValidation();
  closeAuthModal();
  updateAuthUI();
}

function handleLogout() {
  _session = null;
  try { sessionStorage.removeItem('mc_session'); } catch(_) {}
  showToast('You have been signed out.', 'info');
  updateAuthUI();
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
  } else if (lang) {
    showToast('Language saved; only English/Hindi are fully supported for site copy.', 'info');
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

/* ===========================
   MEDCLARITY DEMO VIDEO
=========================== */

const demoVideo = document.getElementById("demoVideo");

if (demoVideo) {

    const playlist = [
        "videos/scene1.mp4",
        "videos/scene2.mp4",
        "videos/scene3.mp4"
    ];

    let currentScene = 0;

    demoVideo.addEventListener("ended", () => {

        currentScene++;

        if (currentScene >= playlist.length) {
            currentScene = 0;
        }

        demoVideo.src = playlist[currentScene];
        demoVideo.load();
        demoVideo.play();

    });

}

/* ============================================================
   14. BOOTSTRAP
============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  // Restore session if available
  try {
    const s = sessionStorage.getItem('mc_session');
    if (s) _session = JSON.parse(s);
  } catch(_) {}
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
  updateAuthUI();

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