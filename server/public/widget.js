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

    var token = config.token || '';

    var position = config.position || 'bottom-right';

    var primaryColor = config.primaryColor || '#25D366';

    var welcomeText =
        config.welcomeText ||
        'Hello! Welcome. How can I help you today? 👋';


    // ------------------------------------------------------------
    // VALIDATE CONFIG
    // ------------------------------------------------------------

    if (!apiUrl) {
        console.error(
            '[Blastup Widget] apiUrl is missing from window.BlastupConfig'
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

    .blastup-widget,
    .blastup-widget * {
      box-sizing: border-box;
    }

    .blastup-widget {
      font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
    }


    /* ==========================================================
       CHAT BUTTON
       ========================================================== */

    .blastup-widget-button {

      position: fixed;

      z-index: 2147483646;

      width: 60px;
      height: 60px;

      border: none;

      border-radius: 50%;

      background: ${primaryColor};

      color: #ffffff;

      cursor: pointer;

      display: flex;

      align-items: center;

      justify-content: center;

      box-shadow:
        0 8px 28px rgba(0, 0, 0, 0.22);

      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

      padding: 0;

      outline: none;
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

      background: ${primaryColor};

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

        width:
          calc(100vw - 20px);

        height:
          calc(100vh - 90px);

        border-radius: 16px;
      }
    }

  `;

    document.head.appendChild(style);


    // ------------------------------------------------------------
    // ROOT
    // ------------------------------------------------------------

    var root = document.createElement('div');

    root.className = 'blastup-widget';


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


    button.innerHTML = `

    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >

      <path
        d="
          M20 2H4
          a2 2 0 0 0-2 2
          v15.2
          a.8.8 0 0 0 1.3.62
          L6.7 17H20
          a2 2 0 0 0 2-2V4
          a2 2 0 0 0-2-2Z

          M17 12H7
          a1 1 0 1 1 0-2h10
          a1 1 0 1 1 0 2Z

          M17 8H7
          a1 1 0 1 1 0-2h10
          a1 1 0 1 1 0 2Z
        "
      />

    </svg>

  `;


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


    panel.innerHTML = `

    <div class="blastup-widget-header">

      <div class="blastup-widget-brand">

        <div class="blastup-widget-avatar">
          🤖
        </div>

        <div>

          <div class="blastup-widget-title">
            Chat Support
          </div>

          <div class="blastup-widget-status">
            Usually replies instantly
          </div>

        </div>

      </div>


      <button
        class="blastup-widget-close"
        type="button"
        aria-label="Close chat"
      >
        ×
      </button>

    </div>


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


    // ------------------------------------------------------------
    // STATE
    // ------------------------------------------------------------

    var isOpen = false;

    var sending = false;

    var sessionId =
        getSessionId();


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

    function setOpen(open) {

        isOpen = open;


        panel.classList.toggle(
            'open',
            open
        );


        button.setAttribute(
            'aria-label',
            open
                ? 'Close chat'
                : 'Open chat'
        );


        if (open) {

            if (!messages.children.length) {

                addMessage(
                    welcomeText,
                    'bot'
                );
            }


            setTimeout(
                function () {
                    input.focus();
                },
                50
            );
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


        var endpoint =
            apiUrl +
            '/api/chatbot/message';


        var headers = {

            'Content-Type':
                'application/json'

        };


        // API authentication

        if (
            token &&
            token !==
            'YOUR_API_KEY_HERE'
        ) {

            headers.Authorization =
                'Bearer ' + token;

            headers['X-API-Key'] =
                token;
        }


        var response =
            await fetch(
                endpoint,
                {
                    method: 'POST',

                    headers: headers,

                    credentials: 'omit',

                    body:
                        JSON.stringify({

                            message:
                                message,

                            text:
                                message,

                            sessionId:
                                sessionId,

                            source:
                                'website-widget',

                            url:
                                window.location.href,

                            pageUrl:
                                window.location.href,

                            origin:
                                window.location.origin

                        })
                }
            );


        var data = {};


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