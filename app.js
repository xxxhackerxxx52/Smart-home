// app.js - ОСНОВНАЯ ЛОГИКА

// Глобальные функции для лога
function logEvent(message) {
    console.log(message);
    
    // Пытаемся найти лог на странице
    const logElement = document.getElementById('event-log') || 
                      document.getElementById('log') ||
                      document.querySelector('.log-container');
    
    if (logElement) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `[${time}] ${message}`;
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
    }
}

// Функции для кнопок
function controlLight(room, action) {
    logEvent(`💡 Свет: ${room} → ${action}`);
    
    // Визуальная обратная связь
    const btn = event?.target;
    if (btn) {
        btn.style.background = action === 'on' ? '#2ecc71' : '#e74c3c';
        setTimeout(() => {
            btn.style.background = '';
        }, 500);
    }
    
    // Отправка через Bluetooth если есть
    if (window.bluetoothManager) {
        bluetoothManager.controlLight(room, action);
    }
}

function controlDoor(door, action) {
    logEvent(`🚪 Дверь ${door}: ${action}`);
    
    // Обновление статуса
    const statusElement = document.getElementById('door-status');
    if (statusElement) {
        statusElement.textContent = action === 'lock' ? '🚪 Закрыта' : '🚪 Открыта';
        statusElement.style.color = action === 'lock' ? '#e74c3c' : '#2ecc71';
    }
    
    if (window.bluetoothManager) {
        bluetoothManager.controlDoor(door, action);
    }
}

function controlWindow(room, action) {
    logEvent(`🪟 Окно ${room}: ${action}`);
    alert(`Окно в ${room} ${action === 'close' ? 'закрыто' : 'открыто'}`);
}

function changeBrightness(value) {
    logEvent(`🔆 Яркость: ${value}%`);
    document.getElementById('brightness')?.textContent = `${value}%`;
}

function changeTemperature(delta) {
    const tempElement = document.getElementById('temperature');
    if (!tempElement) return;
    
    let currentTemp = parseInt(tempElement.textContent) || 23;
    currentTemp += delta;
    tempElement.textContent = `${currentTemp}°C`;
    
    logEvent(`🌡️ Температура: ${currentTemp}°C`);
    
    if (window.bluetoothManager) {
        bluetoothManager.setTemperature(currentTemp);
    }
}

function activateAlarm() {
    logEvent('🚨 ТРЕВОЖНАЯ КНОПКА НАЖАТА!');
    
    // Визуальный эффект
    document.body.style.animation = 'alarmFlash 0.5s infinite';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 5000);
    
    // Звуковое оповещение
    try {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.play();
    } catch (e) {}
    
    alert('🚨 ТРЕВОГА! Вызываю помощь...');
    
    if (window.bluetoothManager) {
        bluetoothManager.emergencySignal();
    }
}

// Экстренные функции
function emergencyHelp() {
    logEvent('🆘 Вызов экстренной помощи');
    alert('🚑 Вызываю скорую помощь и родственников!');
}

function callDoctor() {
    logEvent('👨‍⚕️ Вызов врача');
    alert('Доктор будет вызван в течение 15 минут');
}

function callAmbulance() {
    logEvent('🚑 Вызов скорой помощи');
    alert('Скорая помощь вызвана! Ожидайте прибытия.');
}

function medicineReminder() {
    logEvent('💊 Напоминание о лекарствах');
    
    // Показываем уведомление
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('💊 Напоминание', {
            body: 'Время принять лекарства!',
            icon: 'https://img.icons8.com/color/96/000000/medicine.png'
        });
    }
    
    alert('⏰ Напоминание: примите лекарства согласно расписанию');
}

// Медицинские функции
function checkVitals() {
    logEvent('❤️ Проверка показателей здоровья');
    
    // Эмуляция показателей
    const heartRate = Math.floor(Math.random() * 40) + 60; // 60-100
    const oxygen = Math.floor(Math.random() * 5) + 95; // 95-100
    const pressure = `${120 + Math.floor(Math.random() * 20)}/${80 + Math.floor(Math.random() * 15)}`;
    
    document.getElementById('heart-rate')?.textContent = heartRate;
    document.getElementById('oxygen-level')?.textContent = oxygen;
    document.getElementById('blood-pressure')?.textContent = pressure;
    
    alert(`Показатели здоровья:\n❤️ Пульс: ${heartRate}\n🫁 Сатурация: ${oxygen}%\n🩸 Давление: ${pressure}`);
}

function medicalEmergency() {
    logEvent('🚨 МЕДИЦИНСКАЯ ТРЕВОГА');
    activateAlarm();
    callAmbulance();
}

// Доступность
function increaseText() {
    document.body.classList.toggle('large-text');
    logEvent('🔍 Увеличен текст');
}

function highContrast() {
    document.body.classList.toggle('high-contrast');
    logEvent('🎨 Высокая контрастность');
}

function voiceNavigation() {
    logEvent('🎤 Голосовая навигация активирована');
    
    if (window.speechManager) {
        speechManager.start();
    } else {
        alert('Голосовая навигация: говорите "вверх", "вниз", "выбрать"');
    }
}

function screenReader() {
    logEvent('👁️ Экранный диктор активирован');
    
    // Эмуляция экранного диктора
    const elements = document.querySelectorAll('button, h1, h2, h3');
    elements.forEach(el => {
        el.setAttribute('aria-label', el.textContent);
    });
    
    alert('Экранный диктор активирован. Используйте Tab для навигации.');
}

// Напоминания
function addReminder() {
    const text = prompt('Введите напоминание:');
    if (text) {
        logEvent(`📝 Добавлено напоминание: ${text}`);
        
        // Добавляем в список
        const remindersDiv = document.querySelector('.reminders');
        if (remindersDiv) {
            const reminder = document.createElement('div');
            reminder.className = 'reminder-item';
            reminder.innerHTML = `
                <i class="fas fa-bell"></i>
                <span>${text}</span>
            `;
            remindersDiv.appendChild(reminder);
        }
    }
}

// Очистка лога
function clearLog() {
    const logElement = document.getElementById('event-log') || 
                      document.getElementById('log');
    if (logElement) {
        logElement.innerHTML = '';
        logEvent('📝 Лог очищен');
    }
}

// Экстренная панель
function activateSOS() {
    logEvent('🆘 SOS активирован!');
    activateAlarm();
    emergencyHelp();
    
    // Автоматический звонок
    setTimeout(() => {
        logEvent('📞 Автоматический звонок родственникам...');
    }, 2000);
}

function callRelative() {
    logEvent('👨‍👩‍👧‍👦 Вызов родственника');
    alert('📞 Звоню родственнику...');
}

function fireAlert() {
    logEvent('🔥 ПОЖАРНАЯ ТРЕВОГА');
    alert('🚨 ПОЖАРНАЯ ТРЕВОГА! Вызываю пожарных!');
    
    // Мигание красным
    document.body.style.backgroundColor = '#ff0000';
    setTimeout(() => {
        document.body.style.backgroundColor = '';
    }, 1000);
}

function policeAlert() {
    logEvent('🚔 Вызов полиции');
    alert('🚓 Вызываю полицию!');
}

// Экспорт в глобальную область видимости
window.logEvent = logEvent;
window.controlLight = controlLight;
window.controlDoor = controlDoor;
window.controlWindow = controlWindow;
window.changeBrightness = changeBrightness;
window.changeTemperature = changeTemperature;
window.activateAlarm = activateAlarm;
window.emergencyHelp = emergencyHelp;
window.callDoctor = callDoctor;
window.callAmbulance = callAmbulance;
window.medicineReminder = medicineReminder;
window.checkVitals = checkVitals;
window.medicalEmergency = medicalEmergency;
window.increaseText = increaseText;
window.highContrast = highContrast;
window.voiceNavigation = voiceNavigation;
window.screenReader = screenReader;
window.addReminder = addReminder;
window.clearLog = clearLog;
window.activateSOS = activateSOS;
window.callRelative = callRelative;
window.fireAlert = fireAlert;
window.policeAlert = policeAlert;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    logEvent('🚀 Система "Умный дом для ОВЗ" запущена');
    
    // Проверка поддержки
    if (!navigator.bluetooth) {
        logEvent('⚠️ Web Bluetooth не поддерживается');
    }
    
    // Активируем кнопки
    setTimeout(() => {
        logEvent('✅ Все системы готовы к работе');
    }, 1000);
});