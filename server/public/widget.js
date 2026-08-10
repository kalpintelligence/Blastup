(function () {
    'use strict';

    /*
     * ============================================================
     * BLASTUP CHATBOT WEBSITE WIDGET
     * ============================================================
     *
     * Usage:
     *
     * <script>
     *   window.BlastupConfig = {
     *     token: 'YOUR_API_KEY',
     *     apiUrl: 'https://your-api-domain.com',
     *     position: 'bottom-right',
     *     primaryColor: '#25D366',
     *     welcomeText: 'Hello! How can I help you today?'
     *   };
     * </script>
     *
     * <script src="https://your-api-domain.com/widget.js" async></script>
     *
     * ============================================================
     */

    // ------------------------------------------------------------
    // CONFIG
    // ------------------------------------------------------------

    var config = window.BlastupConfig || {};

    var apiUrl = String(config.apiUrl || '').replace(/\/+$/, '');

    var chatbotId = config.chatbotId || null;

    var position = config.position || 'bottom-right';

    var primaryColor = config.primaryColor || '#25D366';

    var secondaryColor = config.secondaryColor || '#128C7E';

    var gradient = config.gradient !== undefined ? config.gradient : true;

    var gradientAngle = config.gradientAngle !== undefined ? config.gradientAngle : 135;

    var botName = config.botName || 'Blastup Bot';

    var botIcon = config.botIcon || 'bot';

    var headerText = config.headerText || 'Chat with us';

    var subHeaderText = config.subHeaderText || 'We typically reply within minutes';

    var buttonLabel = config.buttonLabel || 'Chat';

    var welcomeText =
        config.welcomeText ||
        'Hello! Welcome. How can I help you today? 👋';

    var collectLeads = config.collectLeads !== undefined ? !!config.collectLeads : false;

    var leadFields = config.leadFields || ['name', 'email'];

    var theme = config.theme || 'glassmorphic';

    var headerBg = gradient
      ? `linear-gradient(${gradientAngle}deg, ${primaryColor}, ${secondaryColor})`
      : primaryColor;

    var buttonBg = gradient
      ? headerBg
      : (theme === 'glassmorphic' ? 'rgba(255, 255, 255, 0.92)' : primaryColor);

    var buttonTextColor = (gradient || theme !== 'glassmorphic') ? '#ffffff' : primaryColor;


    // ------------------------------------------------------------
    // VALIDATE CONFIG
    // ------------------------------------------------------------

    if (!apiUrl) {
        console.error(
            '[Blastup Widget] ❌ apiUrl is missing from window.BlastupConfig'
        );
        return;
    }

    if (!chatbotId) {
        console.error(
            '[Blastup Widget] ❌ chatbotId is missing from window.BlastupConfig'
        );
        return;
    }



    // ------------------------------------------------------------
    // PREVENT DUPLICATE WIDGET
    // ------------------------------------------------------------

    if (window.__BLASTUP_WIDGET_LOADED__) {
        return;
    }

    window.__BLASTUP_WIDGET_LOADED__ = true;


    // ------------------------------------------------------------
    // CSS
    // ------------------------------------------------------------

    var style = document.createElement('style');

    style.id = 'blastup-widget-style';

    style.textContent = `

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .blastup-widget,
    .blastup-widget * {
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    }


    /* ==========================================================
       CHAT BUTTON
       ========================================================== */

    .blastup-widget-button {

      position: fixed;

      z-index: 2147483646;

      width: auto;
      height: 42px;

      border: none;

      border-radius: 9999px;

      background: ${headerBg};

      color: #ffffff;

      cursor: pointer;

      display: flex;

      align-items: center;

      justify-content: center;

      gap: 8px;

      box-shadow:
        0 8px 25px rgba(0, 0, 0, 0.22);

      transition:
        transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
        box-shadow 0.2s ease;

      padding: 10px 18px;

      outline: none;

      font-size: 13px;
      font-weight: 700;
    }


    .blastup-widget-button:hover {

      transform: scale(1.06);

      box-shadow:
        0 10px 34px rgba(0, 0, 0, 0.28);
    }


    .blastup-widget-button:active {

      transform: scale(0.96);
    }


    .blastup-widget-button svg {

      width: 30px;
      height: 30px;

      fill: currentColor;

      pointer-events: none;
    }


    /* ==========================================================
       CHAT PANEL
       ========================================================== */

    .blastup-widget-panel {

      position: fixed;

      z-index: 2147483647;

      width: min(380px, calc(100vw - 28px));

      height: min(560px, calc(100vh - 100px));

      background: #ffffff;

      border-radius: 18px;

      overflow: hidden;

      box-shadow:
        0 18px 60px rgba(0, 0, 0, 0.22);

      border:
        1px solid rgba(0, 0, 0, 0.08);

      display: none;

      flex-direction: column;

      opacity: 0;
    }


    .blastup-widget-panel.open {

      display: flex;

      animation:
        blastupSlideIn 0.18s ease-out forwards;
    }


    @keyframes blastupSlideIn {

      from {

        opacity: 0;

        transform:
          translateY(10px)
          scale(0.98);
      }

      to {

        opacity: 1;

        transform:
          translateY(0)
          scale(1);
      }
    }


    /* ==========================================================
       HEADER
       ========================================================== */

    .blastup-widget-header {

      min-height: 68px;

      padding: 14px 16px;

      background: ${headerBg};

      color: #ffffff;

      display: flex;

      align-items: center;

      justify-content: space-between;
    }


    .blastup-widget-brand {

      display: flex;

      align-items: center;

      gap: 10px;

      min-width: 0;
    }


    .blastup-widget-avatar {

      width: 40px;

      height: 40px;

      flex:
        0 0 40px;

      border-radius: 50%;

      background:
        rgba(255, 255, 255, 0.18);

      display: flex;

      align-items: center;

      justify-content: center;

      font-size: 20px;
    }


    .blastup-widget-title {

      font-size: 15px;

      font-weight: 700;

      line-height: 1.2;
    }


    .blastup-widget-status {

      margin-top: 3px;

      font-size: 11px;

      opacity: 0.85;
    }


    .blastup-widget-close {

      width: 34px;

      height: 34px;

      border: none;

      background: transparent;

      color: #ffffff;

      cursor: pointer;

      border-radius: 8px;

      font-size: 24px;

      line-height: 1;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 0;
    }


    .blastup-widget-close:hover {

      background:
        rgba(255, 255, 255, 0.12);
    }


    /* ==========================================================
       MESSAGES
       ========================================================== */

    .blastup-widget-messages {

      flex: 1;

      overflow-y: auto;

      padding: 16px;

      background: #f7f7f8;

      display: flex;

      flex-direction: column;

      gap: 10px;

      scroll-behavior: smooth;
    }


    .blastup-widget-message {

      max-width: 84%;

      padding: 10px 13px;

      border-radius: 14px;

      font-size: 13px;

      line-height: 1.45;

      white-space: pre-wrap;

      overflow-wrap: anywhere;

      word-break: break-word;
    }


    .blastup-widget-message.bot {

      align-self: flex-start;

      background: #ffffff;

      color: #222222;

      border:
        1px solid #e7e7e7;

      border-bottom-left-radius: 5px;
    }


    .blastup-widget-message.user {

      align-self: flex-end;

      background: ${primaryColor};

      color: #ffffff;

      border-bottom-right-radius: 5px;
    }


    /* ==========================================================
       TYPING
       ========================================================== */

    .blastup-widget-typing {

      display: none;

      align-self: flex-start;

      color: #777777;

      background: #ffffff;

      border:
        1px solid #e7e7e7;

      padding: 9px 12px;

      margin:
        0 16px 10px;

      border-radius: 14px;

      font-size: 12px;
    }


    .blastup-widget-typing.show {

      display: block;
    }


    /* ==========================================================
       INPUT
       ========================================================== */

    .blastup-widget-input-area {

      display: flex;

      gap: 8px;

      padding: 10px;

      background: #ffffff;

      border-top:
        1px solid #e8e8e8;
    }


    .blastup-widget-input {

      flex: 1;

      min-width: 0;

      height: 42px;

      border:
        1px solid #dddddd;

      border-radius: 11px;

      padding:
        0 12px;

      outline: none;

      font-size: 13px;

      color: #222222;

      background: #ffffff;
    }


    .blastup-widget-input:focus {

      border-color: ${primaryColor};

      box-shadow:
        0 0 0 2px ${primaryColor}22;
    }


    .blastup-widget-input:disabled {

      background: #f5f5f5;

      cursor: not-allowed;
    }


    .blastup-widget-send {

      width: 42px;

      height: 42px;

      flex:
        0 0 42px;

      border: none;

      border-radius: 11px;

      background: ${primaryColor};

      color: #ffffff;

      cursor: pointer;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 0;
    }


    .blastup-widget-send:hover {

      opacity: 0.9;
    }


    .blastup-widget-send:disabled {

      opacity: 0.55;

      cursor: not-allowed;
    }


    .blastup-widget-send svg {

      width: 18px;

      height: 18px;

      fill: currentColor;

      pointer-events: none;
    }


    /* ==========================================================
       MOBILE
       ========================================================== */

    @media (max-width: 520px) {

      .blastup-widget-button {

        width: 56px;

        height: 56px;
      }


      .blastup-widget-panel {

      }
    }

    /* ==========================================================
       PREMIUM GLASSMORPHIC THEME SCOPED STYLES
       ========================================================== */

    .blastup-theme-glassmorphic .blastup-widget-button {
      background: ${buttonBg} !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8) !important;
      color: ${buttonTextColor} !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0,0,0,0.1) !important;
      height: 42px !important;
      width: auto !important;
      border-radius: 9999px !important;
      padding: 10px 18px !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease !important;
    }

    .blastup-theme-glassmorphic .blastup-widget-button:hover {
      transform: scale(1.08) translateY(-2px) !important;
      box-shadow: 0 14px 35px rgba(0,0,0,0.25), 0 6px 16px rgba(0,0,0,0.12) !important;
    }

    .blastup-theme-glassmorphic .blastup-widget-button:active {
      transform: scale(0.94) !important;
    }

    .blastup-theme-glassmorphic .blastup-widget-button::before {
      content: none;
    }

    @keyframes blastupPulse {
      0% { transform: scale(0.95); opacity: 0.5; }
      100% { transform: scale(1.15); opacity: 1; }
    }

    .blastup-theme-glassmorphic .blastup-widget-panel {
      background: rgba(255, 255, 255, 0.35) !important;
      backdrop-filter: blur(30px) saturate(210%);
      -webkit-backdrop-filter: blur(30px) saturate(210%);
      border: 1px solid rgba(255, 255, 255, 0.45) !important;
      border-radius: 24px;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.65), 
        inset 0 -1px 0 rgba(0, 0, 0, 0.05),
        0 30px 80px -10px rgba(118, 93, 203, 0.18) !important;
    }

    .blastup-theme-glassmorphic .blastup-widget-panel::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, rgba(14, 165, 233, 0.05) 30%, rgba(52, 211, 153, 0.04) 60%, rgba(244, 63, 94, 0.03) 100%);
      z-index: 0;
      pointer-events: none;
      animation: blastupGradientRotate 25s linear infinite;
    }

    @keyframes blastupGradientRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .blastup-theme-glassmorphic .blastup-widget-header {
      background: transparent !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.25) !important;
      padding: 22px 20px 16px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      min-height: auto;
      z-index: 1;
    }

    .blastup-theme-glassmorphic .blastup-widget-brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .blastup-theme-glassmorphic .blastup-widget-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.45);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.8) !important;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      animation: blastupFloat 4s ease-in-out infinite;
    }

    @keyframes blastupFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .blastup-theme-glassmorphic .blastup-widget-title {
      color: #1e293b !important;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: -0.010em;
    }

    .blastup-theme-glassmorphic .blastup-widget-status {
      color: #64748b !important;
      font-size: 10px;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 500;
    }

    .blastup-theme-glassmorphic .blastup-widget-status::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      box-shadow: 0 0 6px #10b981;
    }

    .blastup-theme-glassmorphic .blastup-widget-close {
      position: absolute;
      top: 14px;
      right: 14px;
      color: #94a3b8 !important;
      background: rgba(255, 255, 255, 0.3) !important;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .blastup-theme-glassmorphic .blastup-widget-close:hover {
      background: rgba(255, 255, 255, 0.6) !important;
      color: #1e293b !important;
    }

    .blastup-theme-glassmorphic .blastup-widget-messages {
      background: transparent !important;
      padding: 20px;
      z-index: 1;
    }

    .blastup-theme-glassmorphic .blastup-widget-message {
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.45);
      padding: 11px 14px;
    }

    .blastup-theme-glassmorphic .blastup-widget-message.bot {
      background: rgba(255, 255, 255, 0.65) !important;
      color: #1e293b !important;
      border-bottom-left-radius: 4px;
    }

    .blastup-theme-glassmorphic .blastup-widget-message.user {
      background: rgba(99, 102, 241, 0.18) !important;
      color: #312e81 !important;
      border: 1px solid rgba(99, 102, 241, 0.25) !important;
      border-bottom-right-radius: 4px;
    }

    .blastup-theme-glassmorphic .blastup-widget-typing {
      background: rgba(255, 255, 255, 0.55) !important;
      border: 1px solid rgba(255, 255, 255, 0.45) !important;
      border-radius: 14px;
      font-size: 12px;
      color: #64748b;
      margin: 0 20px 10px 20px;
      padding: 9px 12px;
      z-index: 1;
    }

    .blastup-theme-glassmorphic .blastup-widget-input-area {
      background: rgba(255, 255, 255, 0.2) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.25) !important;
      padding: 12px 14px;
      z-index: 1;
    }

    .blastup-theme-glassmorphic .blastup-widget-input {
      background: rgba(255, 255, 255, 0.5) !important;
      border: 1px solid rgba(255, 255, 255, 0.5) !important;
      border-radius: 14px;
      color: #1e293b;
      font-size: 13px;
      height: 40px;
      transition: all 0.2s;
      padding: 0 14px;
    }

    .blastup-theme-glassmorphic .blastup-widget-input:focus {
      background: rgba(255, 255, 255, 0.75) !important;
      border-color: rgba(99, 102, 241, 0.4) !important;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08) !important;
    }

    .blastup-theme-glassmorphic .blastup-widget-send {
      background: rgba(255, 255, 255, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.5) !important;
      color: #4f46e5 !important;
      border-radius: 12px;
      width: 40px;
      height: 40px;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.06);
      transition: all 0.2s;
    }

    .blastup-theme-glassmorphic .blastup-widget-send:hover {
      background: rgba(255, 255, 255, 0.95) !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
    }

    /* ==========================================================
       LEAD COLLECTION FORM STYLES
       ========================================================== */
    .blastup-widget-lead-form {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
      justify-content: center;
      overflow-y: auto;
      background: transparent;
      z-index: 2;
    }
    .blastup-widget-lead-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
      text-align: center;
    }
    .blastup-widget-lead-subtitle {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 10px 0;
      text-align: center;
      line-height: 1.4;
    }
    .blastup-widget-lead-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .blastup-widget-lead-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
    }
    .blastup-widget-lead-input {
      width: 100%;
      height: 38px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 10px;
      padding: 0 12px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
      background: rgba(255, 255, 255, 0.8);
      color: #1e293b;
    }
    .blastup-theme-glassmorphic .blastup-widget-lead-input {
      background: rgba(255, 255, 255, 0.5) !important;
      border: 1px solid rgba(255, 255, 255, 0.5) !important;
      color: #1e293b !important;
    }
    .blastup-widget-lead-input:focus {
      border-color: ${primaryColor} !important;
      box-shadow: 0 0 0 3px ${primaryColor}1a !important;
      background: rgba(255, 255, 255, 0.9) !important;
    }
    .blastup-widget-lead-submit {
      width: 100%;
      height: 40px;
      border: none;
      border-radius: 10px;
      background: ${headerBg} !important;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .blastup-widget-lead-submit:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
  `;

    document.head.appendChild(style);


    // ------------------------------------------------------------
    // ROOT
    // ------------------------------------------------------------

    // ------------------------------------------------------------
    // THEME & ROOT
    // ------------------------------------------------------------

    var theme = config.theme || 'glassmorphic';

    var root = document.createElement('div');

    root.className = 'blastup-widget' + (theme === 'glassmorphic' ? ' blastup-theme-glassmorphic' : '');


    // ------------------------------------------------------------
    // OPEN BUTTON
    // ------------------------------------------------------------

    var button = document.createElement('button');

    button.className =
        'blastup-widget-button';

    button.type = 'button';

    button.setAttribute(
        'aria-label',
        'Open chat'
    );


    function getBotIconHtml(size, color) {
        var isUrl = botIcon.startsWith('http://') || botIcon.startsWith('https://') || botIcon.startsWith('/') || botIcon.includes('.');
        if (isUrl) {
            return '<img src="' + botIcon + '" alt="Avatar" style="width: ' + size + 'px; height: ' + size + 'px; border-radius: 50%; object-fit: cover;" onerror="this.style.display=\'none\';" />';
        }
        
        var presetSvgs = {
            bot: '<svg viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: ' + size + 'px; height: ' + size + 'px; display: inline-block; vertical-align: middle;"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
            sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: ' + size + 'px; height: ' + size + 'px; display: inline-block; vertical-align: middle;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
            message: '<svg viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: ' + size + 'px; height: ' + size + 'px; display: inline-block; vertical-align: middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            user: '<svg viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: ' + size + 'px; height: ' + size + 'px; display: inline-block; vertical-align: middle;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            zap: '<svg viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: ' + size + 'px; height: ' + size + 'px; display: inline-block; vertical-align: middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            globe: '<svg viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: ' + size + 'px; height: ' + size + 'px; display: inline-block; vertical-align: middle;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>'
        };
        return presetSvgs[botIcon] || presetSvgs.bot;
    }

    button.innerHTML = getBotIconHtml(16, buttonTextColor) + ' <span>' + (buttonLabel || 'Chat') + '</span>';


    // ------------------------------------------------------------
    // PANEL
    // ------------------------------------------------------------

    var panel = document.createElement('div');

    panel.className =
        'blastup-widget-panel';

    panel.setAttribute(
        'role',
        'dialog'
    );

    panel.setAttribute(
        'aria-label',
        'Chatbot'
    );

    var avatarContent = getBotIconHtml(24, theme === 'glassmorphic' ? primaryColor : '#ffffff');


    panel.innerHTML = `

    <div class="blastup-widget-header">

      <div class="blastup-widget-brand">

        <div class="blastup-widget-avatar">
          ${avatarContent}
        </div>

        <div>

          <div class="blastup-widget-title">
            ${botName}
          </div>

          <div class="blastup-widget-status">
            ${subHeaderText}
          </div>

        </div>

      </div>


      <button
        class="blastup-widget-close"
        type="button"
        aria-label="Close chat"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; display: block;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

    </div>

    <!-- Lead Collection Form -->
    <form class="blastup-widget-lead-form" style="display: none;"></form>

    <div
      class="blastup-widget-messages"
    ></div>


    <div
      class="blastup-widget-typing"
    >
      Typing…
    </div>


    <form
      class="blastup-widget-input-area"
    >

      <input
        class="blastup-widget-input"
        type="text"
        autocomplete="off"
        placeholder="Type your message..."
        aria-label="Message"
      />


      <button
        class="blastup-widget-send"
        type="submit"
        aria-label="Send message"
      >

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >

          <path
            d="
              M2.01 21
              23 12
              2.01 3
              2 10
              15 12
              2 14
              2.01 21Z
            "
          />

        </svg>

      </button>

    </form>

  `;


    root.appendChild(button);

    root.appendChild(panel);

    document.body.appendChild(root);


    // ------------------------------------------------------------
    // ELEMENT REFERENCES
    // ------------------------------------------------------------

    var messages =
        panel.querySelector(
            '.blastup-widget-messages'
        );

    var input =
        panel.querySelector(
            '.blastup-widget-input'
        );

    var form =
        panel.querySelector(
            '.blastup-widget-input-area'
        );

    var sendButton =
        panel.querySelector(
            '.blastup-widget-send'
        );

    var closeButton =
        panel.querySelector(
            '.blastup-widget-close'
        );

    var typing =
        panel.querySelector(
            '.blastup-widget-typing'
        );

    var leadForm =
        panel.querySelector(
            '.blastup-widget-lead-form'
        );


    // ------------------------------------------------------------
    // STATE
    // ------------------------------------------------------------

    var isOpen = false;

    var sending = false;

    var sessionId =
        getSessionId();

    var leadCollectedKey = 'blastup_lead_collected_' + chatbotId;
    var leadDataKey = 'blastup_lead_data_' + chatbotId;
    var capturedData = null;

    try {
        var savedData = localStorage.getItem(leadDataKey);
        if (savedData) {
            capturedData = JSON.parse(savedData);
        }
    } catch (e) {}


    // ------------------------------------------------------------
    // SESSION
    // ------------------------------------------------------------

    function getSessionId() {

        try {

            var key =
                'blastup_chat_session';


            var existing =
                localStorage.getItem(key);


            if (existing) {

                return existing;
            }


            var id =
                'bs_' +
                Date.now() +
                '_' +
                Math.random()
                    .toString(36)
                    .slice(2, 10);


            localStorage.setItem(
                key,
                id
            );


            return id;

        } catch (error) {

            return (
                'bs_' +
                Date.now() +
                '_' +
                Math.random()
                    .toString(36)
                    .slice(2)
            );

        }
    }


    // ------------------------------------------------------------
    // ADD MESSAGE
    // ------------------------------------------------------------

    function addMessage(
        text,
        type
    ) {

        var item =
            document.createElement('div');


        item.className =
            'blastup-widget-message ' +
            type;


        // textContent is intentional.
        // Prevents HTML/XSS injection from chatbot responses.

        item.textContent =
            String(text || '');


        messages.appendChild(item);


        messages.scrollTop =
            messages.scrollHeight;
    }


    // ------------------------------------------------------------
    // OPEN / CLOSE
    // ------------------------------------------------------------

    function buildLeadForm() {
        if (!collectLeads) return;

        var html = '<div style="margin-bottom: 12px; text-align: center;">' +
                   '<div class="blastup-widget-lead-title">Introduce yourself</div>' +
                   '<div class="blastup-widget-lead-subtitle">We would love to know you before starting the chat.</div>' +
                   '</div>';

        leadFields.forEach(function (field) {
            var label = field.charAt(0).toUpperCase() + field.slice(1);
            var type = field === 'email' ? 'email' : (field === 'phone' ? 'tel' : 'text');
            var placeholder = 'Enter your ' + field;
            html += '<div class="blastup-widget-lead-field">' +
                    '<label class="blastup-widget-lead-label">' + label + '</label>' +
                    '<input class="blastup-widget-lead-input" type="' + type + '" name="' + field + '" placeholder="' + placeholder + '" required />' +
                    '</div>';
        });

        html += '<button type="submit" class="blastup-widget-lead-submit">Start Chat</button>';
        leadForm.innerHTML = html;
    }

    function setOpen(open) {
        isOpen = open;
        panel.classList.toggle('open', open);
        button.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');

        if (open) {
            var isLeadCollected = !collectLeads || !!localStorage.getItem(leadCollectedKey);

            if (!isLeadCollected) {
                leadForm.style.display = 'flex';
                messages.style.display = 'none';
                form.style.display = 'none';
                buildLeadForm();
            } else {
                leadForm.style.display = 'none';
                messages.style.display = 'block';
                form.style.display = 'flex';

                if (!messages.children.length) {
                    addMessage(welcomeText, 'bot');
                }
                setTimeout(function () { input.focus(); }, 50);
            }
        }
    }


    // ------------------------------------------------------------
    // TYPING
    // ------------------------------------------------------------

    function setTyping(value) {

        typing.classList.toggle(
            'show',
            value
        );


        messages.scrollTop =
            messages.scrollHeight;
    }


    // ------------------------------------------------------------
    // SENDING STATE
    // ------------------------------------------------------------

    function setSending(value) {

        sending = value;

        input.disabled = value;

        sendButton.disabled = value;
    }


    // ------------------------------------------------------------
    // API REQUEST
    // ------------------------------------------------------------

    async function sendMessage(message) {

        /*
         * Your Node.js backend should expose:
         *
         * POST /api/chatbot/message
         *
         * Example:
         *
         * https://api.yourdomain.com/api/chatbot/message
         */


        var endpoint = apiUrl + '/api/chatbot/message';




        var payload = JSON.stringify({
            message,
            text: message,
            sessionId,
            source: 'website-widget',
            url: window.location.href,
            pageUrl: window.location.href,
            origin: window.location.origin,
            chatbotId,
            capturedData: capturedData
        });

        var response;
        try {
            response = await fetch(
                endpoint,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'omit',
                    body: payload
                }
            );

        } catch (fetchError) {
            throw fetchError;
        }


        try {

            data =
                await response.json();

        } catch (error) {

            data = {};

        }


        if (!response.ok) {

            throw new Error(

                data.message ||
                data.error ||
                'Unable to send message'

            );
        }


        return data;
    }


    // ------------------------------------------------------------
    // EXTRACT RESPONSE
    // ------------------------------------------------------------

    function extractReply(data) {

        if (!data) {

            return '';
        }


        if (
            typeof data ===
            'string'
        ) {

            return data;
        }


        /*
         * Supports different backend formats:
         *
         * {
         *   response: "Hello"
         * }
         *
         * {
         *   reply: "Hello"
         * }
         *
         * {
         *   message: "Hello"
         * }
         *
         * {
         *   data: {
         *     response: "Hello"
         *   }
         * }
         */


        return (

            data.response ||

            data.reply ||

            data.message ||

            data.text ||

            (
                data.data &&
                data.data.response
            ) ||

            (
                data.data &&
                data.data.reply
            ) ||

            (
                data.data &&
                data.data.message
            ) ||

            ''

        );
    }


    // ------------------------------------------------------------
    // OPEN BUTTON
    // ------------------------------------------------------------

    button.addEventListener(
        'click',
        function () {

            setOpen(
                !isOpen
            );

        }
    );


    // ------------------------------------------------------------
    // LEAD FORM SUBMIT
    // ------------------------------------------------------------

    leadForm.addEventListener(
        'submit',
        function (event) {
            event.preventDefault();
            var data = {};
            leadFields.forEach(function (field) {
                var inputEl = leadForm.querySelector('[name="' + field + '"]');
                if (inputEl) {
                    data[field] = inputEl.value.trim();
                }
            });

            capturedData = data;
            try {
                localStorage.setItem(leadCollectedKey, 'true');
                localStorage.setItem(leadDataKey, JSON.stringify(data));
            } catch (e) {}

            leadForm.style.display = 'none';
            messages.style.display = 'block';
            form.style.display = 'flex';

            if (!messages.children.length) {
                addMessage(welcomeText, 'bot');
            }
            setTimeout(function () {
                input.focus();
            }, 50);
        }
    );


    // ------------------------------------------------------------
    // CLOSE BUTTON
    // ------------------------------------------------------------

    closeButton.addEventListener(
        'click',
        function () {

            setOpen(false);

        }
    );


    // ------------------------------------------------------------
    // SEND MESSAGE
    // ------------------------------------------------------------

    form.addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();


            if (sending) {

                return;
            }


            var message =
                String(
                    input.value || ''
                ).trim();


            if (!message) {

                return;
            }


            // Display user message

            addMessage(
                message,
                'user'
            );


            // Clear input

            input.value = '';


            setSending(true);

            setTyping(true);


            try {

                var data =
                    await sendMessage(
                        message
                    );


                var reply =
                    extractReply(data);


                if (!reply) {

                    reply =
                        'Sorry, I could not process that message right now.';
                }


                addMessage(
                    reply,
                    'bot'
                );


            } catch (error) {

                console.error(
                    '[Blastup Widget]',
                    error
                );


                addMessage(
                    'Sorry, something went wrong. Please try again in a moment.',
                    'bot'
                );


            } finally {

                setTyping(false);

                setSending(false);

                input.focus();
            }

        }
    );


    // ------------------------------------------------------------
    // ESCAPE TO CLOSE
    // ------------------------------------------------------------

    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Escape' &&
                isOpen
            ) {

                setOpen(false);
            }

        }
    );


    // ------------------------------------------------------------
    // POSITION
    // ------------------------------------------------------------

    var buttonPosition = {

        'bottom-right': {

            bottom: '20px',

            right: '20px'

        },

        'bottom-left': {

            bottom: '20px',

            left: '20px'

        },

        'top-right': {

            top: '20px',

            right: '20px'

        },

        'top-left': {

            top: '20px',

            left: '20px'

        }

    };


    var panelPosition = {

        'bottom-right': {

            bottom: '92px',

            right: '20px'

        },

        'bottom-left': {

            bottom: '92px',

            left: '20px'

        },

        'top-right': {

            top: '92px',

            right: '20px'

        },

        'top-left': {

            top: '92px',

            left: '20px'

        }

    };


    Object.assign(

        button.style,

        buttonPosition[position] ||
        buttonPosition[
        'bottom-right'
        ]

    );


    Object.assign(

        panel.style,

        panelPosition[position] ||
        panelPosition[
        'bottom-right'
        ]

    );


    // ------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------

    window.BlastupWidget = {

        open: function () {

            setOpen(true);

        },


        close: function () {

            setOpen(false);

        },


        toggle: function () {

            setOpen(!isOpen);

        },


        send: function (message) {

            if (!message) {

                return Promise.reject(
                    new Error(
                        'Message is required'
                    )
                );

            }


            if (!isOpen) {

                setOpen(true);
            }


            addMessage(
                message,
                'user'
            );


            setSending(true);

            setTyping(true);


            return sendMessage(
                message
            )
                .then(
                    function (data) {

                        var reply =
                            extractReply(data) ||
                            'No response received.';

                        addMessage(
                            reply,
                            'bot'
                        );

                        return reply;

                    }
                )
                .catch(
                    function (error) {

                        console.error(
                            '[Blastup Widget]',
                            error
                        );

                        addMessage(
                            'Sorry, something went wrong.',
                            'bot'
                        );

                        throw error;

                    }
                )
                .finally(
                    function () {

                        setTyping(false);

                        setSending(false);

                    }
                );

        }

    };


    // ------------------------------------------------------------
    // READY LOG
    // ------------------------------------------------------------

    console.log(
        '[Blastup Widget] Loaded successfully'
    );

})();