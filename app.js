/* global angular */
(function () {
  'use strict';

  var STORAGE_KEY = 'emitra.auth.token';
  var FALLBACK_UPDATES = [
    'AEPS cash withdrawal window extended to 8:00 PM.',
    'Aadhaar demographic correction requests now available daily.',
    'New POP pension enrollment guidance desk active this week.',
    'Digital receipt download enabled for all utility transactions.',
    'Secure login and AI chatbot support are now available.'
  ];

  // ---------------------------------------------------------------------------
  // Module
  // ---------------------------------------------------------------------------
  angular
    .module('emitraApp', [])

    // -------------------------------------------------------------------------
    // ApiService – thin $http wrapper that injects the JWT and base URL
    // -------------------------------------------------------------------------
    .service('ApiService', ['$http', '$window', function ($http, $window) {
      var baseUrl = ($window.EMITRA_API_BASE_URL || '').trim().replace(/\/$/, '');

      function isUnconfigured(url) {
        if (!url) { return true; }
        try {
          var parsed = new $window.URL(url);
          return parsed.hostname === 'your-render-service.onrender.com';
        } catch (e) {
          return true;
        }
      }

      function headers() {
        var token = $window.localStorage.getItem(STORAGE_KEY) || '';
        var h = { Accept: 'application/json' };
        if (token) { h.Authorization = 'Bearer ' + token; }
        return h;
      }

      return {
        isUnconfigured: function () { return isUnconfigured(baseUrl); },
        get: function (path) {
          return $http.get(baseUrl + path, { headers: headers() });
        },
        post: function (path, data) {
          return $http.post(baseUrl + path, data, { headers: headers() });
        }
      };
    }])

    // -------------------------------------------------------------------------
    // Main Controller
    // -------------------------------------------------------------------------
    .controller('AppCtrl', ['$scope', '$window', '$timeout', 'ApiService',
      function ($scope, $window, $timeout, ApiService) {
        var vm = this;

        // ---- State -----------------------------------------------------------
        vm.year        = new Date().getFullYear();
        vm.brandName   = 'RK';
        vm.darkMode    = $window.localStorage.getItem('emitra.dark') === '1';
        vm.authTab     = 'login';
        vm.authLoading = false;
        vm.user        = null;
        vm.toasts      = [];
        vm.updates     = [];
        vm.updatesLoading = false;
        vm.chatMessages   = [];
        vm.chatInput      = '';
        vm.chatLoading    = false;
        vm.chatTyping     = false;
        vm.activities     = [];
        vm.activityLoading = false;
        vm.pwaOffline  = false;

        vm.loginData  = { email: '', password: '' };
        vm.signupData = { name: '', email: '', password: '' };

        vm.heroStats = [
          { icon: '🛡️', value: 'JWT',    label: 'Secure Auth'    },
          { icon: '🤖', value: 'Gemini', label: 'AI Chatbot'     },
          { icon: '⚡', value: 'REST',   label: '.NET 10 API'    },
          { icon: '📱', value: 'PWA',    label: 'Installable'    }
        ];

        vm.services = [
          { icon: '💳', label: 'Money Withdrawal (AEPS)' },
          { icon: '🪪', label: 'Aadhaar Update & Authentication' },
          { icon: '⚡', label: 'Electricity, Water & Mobile Recharge' },
          { icon: '🧾', label: 'PAN, Insurance & Certificate Support' },
          { icon: '🏦', label: 'POP Pension Assistance' },
          { icon: '📄', label: 'Government Form Assistance' }
        ];

        vm.techStack = [
          { icon: '🅰️', name: 'AngularJS 1.8', desc: 'UI framework via CDN' },
          { icon: '🔷', name: '.NET 10',       desc: 'Backend API' },
          { icon: '🔒', name: 'JWT Auth',       desc: 'Secure token auth' },
          { icon: '🗄️', name: 'SQLite',         desc: 'Lightweight DB' },
          { icon: '🤖', name: 'Google Gemini',  desc: 'AI chatbot' },
          { icon: '🐋', name: 'Docker',         desc: 'Render deployment' }
        ];

        // ---- Toast system ---------------------------------------------------
        var toastId = 0;
        function toast(message, type) {
          var icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
          var item = { id: ++toastId, message: message, type: type || 'info', icon: icons[type] || 'ℹ️' };
          vm.toasts.push(item);
          $timeout(function () { vm.dismissToast(item); }, 4500);
        }

        vm.dismissToast = function (item) {
          var idx = vm.toasts.indexOf(item);
          if (idx > -1) { vm.toasts.splice(idx, 1); }
        };

        // ---- Dark mode ------------------------------------------------------
        vm.toggleDark = function () {
          vm.darkMode = !vm.darkMode;
          $window.localStorage.setItem('emitra.dark', vm.darkMode ? '1' : '0');
        };

        // ---- Token helpers --------------------------------------------------
        function getToken()          { return $window.localStorage.getItem(STORAGE_KEY) || ''; }
        function setToken(token)     { if (token) { $window.localStorage.setItem(STORAGE_KEY, token); } else { $window.localStorage.removeItem(STORAGE_KEY); } }

        // ---- Updates --------------------------------------------------------
        vm.updatesLoading = true;
        if (ApiService.isUnconfigured()) {
          vm.updates = FALLBACK_UPDATES;
          vm.updatesLoading = false;
        } else {
          ApiService.get('/api/updates').then(function (res) {
            vm.updates = Array.isArray(res.data) && res.data.length ? res.data : FALLBACK_UPDATES;
          }, function () {
            vm.updates = FALLBACK_UPDATES;
          }).finally(function () {
            vm.updatesLoading = false;
          });
        }

        // ---- Auth -----------------------------------------------------------
        function handleAuthResponse(data) {
          setToken(data.token);
          return refreshProfile();
        }

        function refreshProfile() {
          var token = getToken();
          if (!token) {
            vm.user = null;
            return;
          }
          if (ApiService.isUnconfigured()) {
            setToken('');
            vm.user = null;
            return;
          }
          return ApiService.get('/api/auth/me').then(function (res) {
            vm.user = res.data;
            loadActivity();
            loadChatHistory();
          }, function () {
            setToken('');
            vm.user = null;
            toast('Session expired. Please login again.', 'warning');
          });
        }

        vm.login = function () {
          vm.authLoading = true;
          ApiService.post('/api/auth/login', vm.loginData).then(function (res) {
            toast('Welcome back, ' + res.data.name + '!', 'success');
            vm.loginData = { email: '', password: '' };
            return handleAuthResponse(res.data);
          }, function (err) {
            var msg = (err.data && err.data.message) ? err.data.message : 'Login failed.';
            toast(msg, 'error');
          }).finally(function () {
            vm.authLoading = false;
          });
        };

        vm.signup = function () {
          vm.authLoading = true;
          ApiService.post('/api/auth/signup', vm.signupData).then(function (res) {
            toast('Account created! Welcome, ' + res.data.name + '!', 'success');
            vm.signupData = { name: '', email: '', password: '' };
            return handleAuthResponse(res.data);
          }, function (err) {
            var msg = (err.data && err.data.message) ? err.data.message : 'Signup failed.';
            toast(msg, 'error');
          }).finally(function () {
            vm.authLoading = false;
          });
        };

        vm.logout = function () {
          setToken('');
          vm.user = null;
          vm.chatMessages = [];
          vm.activities = [];
          toast('Logged out successfully.', 'info');
        };

        // ---- Chat -----------------------------------------------------------
        function scrollChatToBottom() {
          $timeout(function () {
            var box = $window.document.getElementById('chatBox');
            if (box) { box.scrollTop = box.scrollHeight; }
          }, 50);
        }

        function loadChatHistory() {
          if (!getToken() || ApiService.isUnconfigured()) { return; }
          ApiService.get('/api/chat/history').then(function (res) {
            var items = Array.isArray(res.data) ? res.data.slice().reverse() : [];
            vm.chatMessages = [];
            items.forEach(function (item) {
              vm.chatMessages.push({ role: 'user', text: item.message, time: new Date(item.createdAtUtc) });
              vm.chatMessages.push({ role: 'bot',  text: item.reply,   time: new Date(item.createdAtUtc) });
            });
            scrollChatToBottom();
          }, function () {
            // silent — non-critical
          });
        }

        vm.sendChat = function () {
          var msg = (vm.chatInput || '').trim();
          if (!msg || vm.chatLoading) { return; }

          vm.chatMessages.push({ role: 'user', text: msg, time: new Date() });
          vm.chatInput = '';
          vm.chatTyping = true;
          vm.chatLoading = true;
          scrollChatToBottom();

          ApiService.post('/api/chat', { message: msg }).then(function (res) {
            vm.chatTyping = false;
            vm.chatMessages.push({ role: 'bot', text: res.data.reply, time: new Date() });
            scrollChatToBottom();
            loadActivity();
          }, function (err) {
            vm.chatTyping = false;
            var errMsg = (err.data && err.data.message) ? err.data.message : 'Chat failed. Please try again.';
            vm.chatMessages.push({ role: 'bot', text: errMsg, time: new Date() });
            toast(errMsg, 'error');
            scrollChatToBottom();
          }).finally(function () {
            vm.chatLoading = false;
          });
        };

        // ---- Activity -------------------------------------------------------
        function loadActivity() {
          if (!getToken() || ApiService.isUnconfigured()) { return; }
          vm.activityLoading = true;
          ApiService.get('/api/activity').then(function (res) {
            vm.activities = Array.isArray(res.data) ? res.data : [];
          }, function () {
            toast('Could not load activity.', 'warning');
          }).finally(function () {
            vm.activityLoading = false;
          });
        }

        vm.refreshActivity = function () { loadActivity(); };

        // ---- Service Worker (PWA) -------------------------------------------
        if ('serviceWorker' in $window.navigator) {
          $window.addEventListener('load', function () {
            $window.navigator.serviceWorker.register('/service-worker.js').catch(function () {
              $scope.$apply(function () { vm.pwaOffline = true; });
            });
          });
        }

        // ---- Init -----------------------------------------------------------
        refreshProfile();
      }
    ]);

}());
