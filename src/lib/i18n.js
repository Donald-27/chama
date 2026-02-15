const translations = {
    en: {
        daily_reminder_title: 'Daily reminder',
        daily_reminder_body: 'Check your Chama updates',
        contact_us: 'Contact Us',
        contact_send_mail: 'Message prepared — please send via your email client',
        settings_title: 'Settings',
        notifications_label: 'Notifications',
        notifications_desc: 'Manage notifications',
        notifications_enabled: 'Notifications enabled',
        notifications_disabled: 'Notifications disabled',
        language_label: 'Language',
        language_selected_en: 'English selected',
        language_selected_sw: 'Swahili selected',
        sign_in_welcome: 'Welcome back',
        sign_in_sub: 'Sign in to continue to ChamaManager',
        sign_in_with: 'Sign in with',
        or_unlock_with_pin: 'Or unlock with PIN',
        enter_pin: 'Enter PIN',
        signed_in_with_pin: 'Signed in with PIN',
        save_pin: 'PIN saved',
        remove_pin: 'PIN removed',
        logout: 'Log Out'
    },
    sw: {
        daily_reminder_title: 'Kikumbusho cha kila siku',
        daily_reminder_body: 'Angalia masasisho yako ya Chama',
        contact_us: 'Wasiliana nasi',
        contact_send_mail: 'Ujumbe umeandaliwa — tafadhali tuma kupitia mteja wa barua pepe',
        settings_title: 'Mipangilio',
        notifications_label: 'Arifa',
        notifications_desc: 'Dhibiti arifa',
        notifications_enabled: 'Arifa zimewezeshwa',
        notifications_disabled: 'Arifa zimezimwa',
        language_label: 'Lugha',
        language_selected_en: 'Kiingereza imeteuliwa',
        language_selected_sw: 'Kiswahili kimeteuliwa',
        sign_in_welcome: 'Karibu tena',
        sign_in_sub: 'Ingia ili kuendelea na ChamaManager',
        sign_in_with: 'Ingia na',
        or_unlock_with_pin: 'Au fungua kwa PIN',
        enter_pin: 'Weka PIN',
        signed_in_with_pin: 'Umeingia kwa PIN',
        save_pin: 'PIN imehifadhiwa',
        remove_pin: 'PIN imefutwa',
        logout: 'Toka'
    }
};

export function getLang() {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem('chama_lang') || 'en';
}

export function t(key) {
    const lang = getLang();
    return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

export default { t, getLang };
