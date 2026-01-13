
        let countdownInterval;
        let targetDateTime;
        let isTabActive = true;
        let lastNotificationTime = 0;
        const NOTIFICATION_COOLDOWN = 5000; // 5 seconds between notifications

        // Notification settings
        const notificationSettings = {
            tabChange: true,
            windowMinimize: true,
            sound: true
        };

        // Theme toggle functionality
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');

        // Check for saved theme or prefer-color-scheme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }

        themeToggle.addEventListener('click', () => {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        });

        // Tab visibility detection
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Window focus/blur detection
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);

        // Page minimization detection
        window.addEventListener('resize', handleResize);
        window.addEventListener('beforeunload', handleBeforeUnload);

        function handleVisibilityChange() {
            if (document.hidden) {
                // Tab became inactive
                isTabActive = false;
                document.getElementById('tabStatus').classList.remove('hidden');

                // Show notification if enabled
                if (notificationSettings.tabChange && canShowNotification()) {
                    showNotification('Tab Switched', 'Timer is running in the background', 'info');
                }
            } else {
                // Tab became active
                isTabActive = true;
                document.getElementById('tabStatus').classList.add('hidden');

                if (canShowNotification()) {
                    showNotification('Welcome Back!', 'Timer is now active', 'success');
                }
            }
        }

        function handleWindowBlur() {
            // Window lost focus (could be minimizing or switching to another app)
            if (notificationSettings.windowMinimize && canShowNotification()) {
                setTimeout(() => {
                    if (!document.hasFocus()) {
                        showNotification('Window Minimized', 'Timer is still running', 'warning');
                    }
                }, 100);
            }
        }

        function handleWindowFocus() {
            // Window gained focus
            if (canShowNotification()) {
                showNotification('Window Active', 'Timer is focused', 'success');
            }
        }

        function handleResize() {
            // Check if window is minimized (size is 0)
            if (window.outerWidth === 0 && window.outerHeight === 0) {
                if (notificationSettings.windowMinimize && canShowNotification()) {
                    showNotification('Window Minimized', 'Timer is running minimized', 'warning');
                }
            }
        }

        function handleBeforeUnload(e) {
            if (countdownInterval) {
                e.preventDefault();
                e.returnValue = 'Your countdown timer is still running. Are you sure you want to leave?';
                return e.returnValue;
            }
        }

        function canShowNotification() {
            const now = Date.now();
            if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
                return false;
            }
            lastNotificationTime = now;
            return true;
        }

        function showNotification(title, message, type = 'info') {
            // Update settings from checkboxes
            updateNotificationSettings();

            if (!notificationSettings.tabChange && type === 'info') return;
            if (!notificationSettings.windowMinimize && type === 'warning') return;

            const container = document.getElementById('notificationContainer');
            const notificationId = 'notification-' + Date.now();

            // Determine colors based on type
            let bgColor, textColor, icon;
            switch (type) {
                case 'warning':
                    bgColor = 'bg-amber-100 dark:bg-amber-900/30';
                    textColor = 'text-amber-800 dark:text-amber-300';
                    icon = 'fas fa-exclamation-triangle';
                    break;
                case 'success':
                    bgColor = 'bg-green-100 dark:bg-green-900/30';
                    textColor = 'text-green-800 dark:text-green-300';
                    icon = 'fas fa-check-circle';
                    break;
                case 'error':
                    bgColor = 'bg-red-100 dark:bg-red-900/30';
                    textColor = 'text-red-800 dark:text-red-300';
                    icon = 'fas fa-times-circle';
                    break;
                default:
                    bgColor = 'bg-blue-100 dark:bg-blue-900/30';
                    textColor = 'text-blue-800 dark:text-blue-300';
                    icon = 'fas fa-info-circle';
            }

            const notification = document.createElement('div');
            notification.id = notificationId;
            notification.className = `notification ${bgColor} ${textColor} rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700`;
            notification.innerHTML = `
                <div class="flex items-start">
                    <i class="${icon} text-xl mt-1 mr-3"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold">${title}</h4>
                        <p class="text-sm mt-1">${message}</p>
                        <p class="text-xs mt-2 opacity-70">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button onclick="removeNotification('${notificationId}')" class="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            container.appendChild(notification);

            // Play sound if enabled
            if (notificationSettings.sound) {
                playNotificationSound(type);
            }

            // Auto-remove notification after 5 seconds
            setTimeout(() => {
                removeNotification(notificationId);
            }, 5000);
        }

        function removeNotification(id) {
            const notification = document.getElementById(id);
            if (notification) {
                notification.classList.add('hiding');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }

        function playNotificationSound(type) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequencies for different notification types
            let frequency;
            switch (type) {
                case 'warning':
                    frequency = 349.23; // F4
                    break;
                case 'success':
                    frequency = 523.25; // C5
                    break;
                case 'error':
                    frequency = 293.66; // D4
                    break;
                default:
                    frequency = 440.00; // A4
            }

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        function updateNotificationSettings() {
            notificationSettings.tabChange = document.getElementById('tabChangeNotification').checked;
            notificationSettings.windowMinimize = document.getElementById('windowMinimizeNotification').checked;
            notificationSettings.sound = document.getElementById('soundNotification').checked;
        }

        // Initialize
        function init() {
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('targetDate').setAttribute('min', today);

            // Set default time to next hour
            const nextHour = new Date();
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
            document.getElementById('targetTime').value = nextHour.toTimeString().substring(0, 5);

            // Load notification settings
            updateNotificationSettings();

            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        // Play completion sound
        function playCompletionSound() {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Simple completion tone
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
        }

        // Start countdown
        function startCountdown() {
            const dateInput = document.getElementById('targetDate').value;
            const timeInput = document.getElementById('targetTime').value;
            const eventName = document.getElementById('eventName').value;

            if (!dateInput || !timeInput) {
                showNotification('Missing Information', 'Please select both date and time', 'warning');
                return;
            }

            targetDateTime = new Date(dateInput + 'T' + timeInput);

            if (targetDateTime <= new Date()) {
                showNotification('Invalid Date', 'Please select a future date and time', 'warning');
                return;
            }

            // Show event name if provided
            const eventTitleDiv = document.getElementById('eventTitle');
            if (eventName.trim()) {
                eventTitleDiv.querySelector('h2').textContent = eventName;
                eventTitleDiv.classList.remove('hidden');
            } else {
                eventTitleDiv.classList.add('hidden');
            }

            document.getElementById('countdownDisplay').classList.remove('hidden');
            document.getElementById('completedMessage').classList.add('hidden');

            if (countdownInterval) {
                clearInterval(countdownInterval);
            }

            updateCountdown();
            countdownInterval = setInterval(updateCountdown, 1000);

            // Show start notification
            showNotification('Countdown Started', 'Timer is now running', 'success');

            // Send browser notification if allowed
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Countdown Started', {
                    body: 'Your timer is now running',
                    icon: '/favicon.ico'
                });
            }
        }

        // Update countdown display
        function updateCountdown() {
            const now = new Date().getTime();
            const distance = targetDateTime - now;

            if (distance < 0) {
                clearInterval(countdownInterval);
                document.getElementById('countdownDisplay').classList.add('hidden');
                document.getElementById('completedMessage').classList.remove('hidden');
                playCompletionSound();

                // Show completion notification
                showNotification('Countdown Complete!', 'Timer has reached zero', 'success');

                // Send browser notification if allowed
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Countdown Complete!', {
                        body: 'Your timer has reached zero',
                        icon: '/favicon.ico'
                    });
                }
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        }

        // Reset countdown
        function resetCountdown() {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            document.getElementById('countdownDisplay').classList.add('hidden');
            document.getElementById('completedMessage').classList.add('hidden');
            document.getElementById('eventTitle').classList.add('hidden');
            document.getElementById('targetDate').value = '';
            document.getElementById('targetTime').value = '';
            document.getElementById('eventName').value = '';

            // Reset time to next hour
            const nextHour = new Date();
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
            document.getElementById('targetTime').value = nextHour.toTimeString().substring(0, 5);

            // Show reset notification
            showNotification('Timer Reset', 'Countdown has been reset', 'info');
        }

        // Initialize on load
        window.addEventListener('load', init);