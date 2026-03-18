const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const projectDir = __dirname;

// ========== КОНФИГУРАЦИЯ ==========
const TOKEN_FILE = path.join(projectDir, 'working_token.txt');

let YANDEX_TOKEN = '';
try {
    if (fs.existsSync(TOKEN_FILE)) {
        YANDEX_TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
        console.log('✅ Токен загружен из working_token.txt');
    } else {
        console.error('❌ Файл working_token.txt не найден!');
    }
} catch (e) {
    console.error('❌ Ошибка чтения токена:', e.message);
}

// ---------- СПИСОК УСТРОЙСТВ ----------
const DEVICES = {
    // Устройство 1: Лампа 
    yandexLamp: {
        id: '32f6a791-bba6-4d56-8dbf-a7be00fab417',
        name: 'Яндекс лампа',
        type: 'lamp',
        capabilities: ['on', 'off', 'toggle']
    },
    // Устройство 2: Лампочка Глеб
    glebLamp: {
        id: '306ba9d7-5f63-434c-b12e-1bf9bdc7bbf7',
        name: 'Лампочка Глеб',
        type: 'lamp',
        capabilities: ['on', 'off', 'toggle']
    },
    // Устройство 3: Пылесос
    vacuum: {
        id: '6e093be5-e7c7-47d6-ad08-ce7f0221cb2e',
        name: 'Пылесос',
        type: 'vacuum',
        capabilities: ['on', 'off', 'dock'] // dock = вернуться на базу
    }
};

// Кэш состояний (для быстрого отображения)
let states = {
    [DEVICES.yandexLamp.id]: { isOn: false },
    [DEVICES.glebLamp.id]: { isOn: false },
    [DEVICES.vacuum.id]: { isOn: false, isDocked: false }
};

// ========== УНИВЕРСАЛЬНАЯ ФУНКЦИЯ УПРАВЛЕНИЯ ==========
async function controlDevice(deviceId, action) {
    if (!YANDEX_TOKEN) {
        return { success: false, error: 'Токен не установлен' };
    }

    try {
        console.log(`🎯 Управление устройством ${deviceId}: ${action}`);

        let actions = [];

        // Базовое действие вкл/выкл (on_off)
        if (action === 'on' || action === 'off' || action === 'toggle') {
            // Для toggle нужно сначала узнать текущее состояние (из кэша)
            let targetState;
            if (action === 'toggle') {
                const current = states[deviceId]?.isOn || false;
                targetState = !current;
            } else {
                targetState = action === 'on';
            }

            actions.push({
                type: 'devices.capabilities.on_off',
                state: { instance: 'on', value: targetState }
            });

            // Обновляем кэш
            if (!states[deviceId]) states[deviceId] = {};
            states[deviceId].isOn = targetState;
        }

        // Специальное действие: вернуться на базу (для пылесоса)
        if (action === 'dock') {
            actions.push({
                type: 'devices.capabilities.dock',
                state: { instance: 'dock', value: true }
            });
            states[deviceId].isDocked = true;
            // После отправки на базу пылесос выключается? Обычно да.
            states[deviceId].isOn = false;
        }

        if (actions.length === 0) {
            return { success: false, error: 'Неизвестное действие' };
        }

        const requestBody = {
            devices: [{
                id: deviceId,
                actions: actions
            }]
        };

        const response = await axios.post(
            'https://api.iot.yandex.net/v1.0/devices/actions',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${YANDEX_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            success: true,
            message: `Команда ${action} отправлена`,
            deviceId,
            action,
            state: states[deviceId] || {}
        };

    } catch (error) {
        console.error('❌ Ошибка Яндекс API:', error.response?.status, error.response?.data || error.message);
        return {
            success: false,
            error: `Яндекс API: ${error.response?.status || 'Ошибка сети'}`,
            details: error.response?.data || error.message
        };
    }
}

// ========== СТАТИКА ==========
app.use(express.static(path.join(projectDir, 'public')));
app.use(express.json());

// ========== ЭНДПОИНТЫ ДЛЯ КАЖДОГО УСТРОЙСТВА ==========

// --- Яндекс лампа (старая) ---
app.get('/api/lamp/on', async (req, res) => res.json(await controlDevice(DEVICES.yandexLamp.id, 'on')));
app.get('/api/lamp/off', async (req, res) => res.json(await controlDevice(DEVICES.yandexLamp.id, 'off')));
app.get('/api/lamp/toggle', async (req, res) => res.json(await controlDevice(DEVICES.yandexLamp.id, 'toggle')));
app.get('/api/lamp/status', (req, res) => res.json({ success: true, state: states[DEVICES.yandexLamp.id] || { isOn: false } }));

// --- Лампочка Глеб ---
app.get('/api/gleb/on', async (req, res) => res.json(await controlDevice(DEVICES.glebLamp.id, 'on')));
app.get('/api/gleb/off', async (req, res) => res.json(await controlDevice(DEVICES.glebLamp.id, 'off')));
app.get('/api/gleb/toggle', async (req, res) => res.json(await controlDevice(DEVICES.glebLamp.id, 'toggle')));
app.get('/api/gleb/status', (req, res) => res.json({ success: true, state: states[DEVICES.glebLamp.id] || { isOn: false } }));

// --- Пылесос ---
app.get('/api/vacuum/on', async (req, res) => res.json(await controlDevice(DEVICES.vacuum.id, 'on')));
app.get('/api/vacuum/off', async (req, res) => res.json(await controlDevice(DEVICES.vacuum.id, 'off')));
app.get('/api/vacuum/dock', async (req, res) => res.json(await controlDevice(DEVICES.vacuum.id, 'dock')));
app.get('/api/vacuum/status', (req, res) => res.json({
    success: true,
    state: states[DEVICES.vacuum.id] || { isOn: false, isDocked: false }
}));

// --- Общий эндпоинт для прямого управления по ID (если понадобится) ---
app.post('/api/device/:deviceId/:action', async (req, res) => {
    const { deviceId, action } = req.params;
    res.json(await controlDevice(deviceId, action));
});

// ========== ТЕСТОВЫЙ ЭНДПОИНТ ==========
app.get('/api/test', async (req, res) => {
    if (!YANDEX_TOKEN) return res.json({ success: false, error: 'Токен не найден' });
    try {
        const response = await axios.get('https://api.iot.yandex.net/v1.0/user/info', {
            headers: { Authorization: `Bearer ${YANDEX_TOKEN}` }
        });
        res.json({
            success: true,
            user: response.data.login,
            devices_count: response.data.devices?.length || 0,
            devices: response.data.devices?.map(d => ({ id: d.id, name: d.name }))
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ========== ГЛАВНАЯ СТРАНИЦА ==========
app.get('/', (req, res) => {
    // Пытаемся отдать index.html из папки public
    res.sendFile(path.join(projectDir, 'public', 'index.html'), err => {
        if (err) {
            // Если файла нет, показываем упрощённую страницу со списком устройств
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Умный дом для людей с ОВЗ</title>
                    <style>
                        body{font-family:Arial;padding:20px;background:#f5f5f5;}
                        .container{max-width:800px;margin:0 auto;background:white;padding:30px;border-radius:15px;box-shadow:0 5px 15px rgba(0,0,0,0.1);}
                        h1{color:#2c3e50;}
                        .device-card{background:#f8f9fa;border-left:5px solid #3498db;padding:15px;margin:15px 0;border-radius:8px;}
                        button{padding:10px 20px;margin:5px;border:none;border-radius:6px;cursor:pointer;font-size:14px;color:white;}
                        .btn-on{background:#2ecc71;}
                        .btn-off{background:#e74c3c;}
                        .btn-dock{background:#f39c12;}
                        code{background:#eee;padding:2px 6px;border-radius:4px;}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🏠 Умный дом для людей с ОВЗ</h1>
                        <p>✅ Сервер работает. Токен: ${YANDEX_TOKEN ? 'установлен' : '❌ ОТСУТСТВУЕТ'}</p>
                        
                        <div class="device-card">
                            <h3>💡 Яндекс лампа</h3>
                            <p><code>${DEVICES.yandexLamp.id}</code></p>
                            <button class="btn-on" onclick="fetch('/api/lamp/on').then(r=>r.json()).then(alert)">Включить</button>
                            <button class="btn-off" onclick="fetch('/api/lamp/off').then(r=>r.json()).then(alert)">Выключить</button>
                        </div>

                        <div class="device-card">
                            <h3>💡 Лампочка Глеб</h3>
                            <p><code>${DEVICES.glebLamp.id}</code></p>
                            <button class="btn-on" onclick="fetch('/api/gleb/on').then(r=>r.json()).then(alert)">Включить</button>
                            <button class="btn-off" onclick="fetch('/api/gleb/off').then(r=>r.json()).then(alert)">Выключить</button>
                        </div>

                        <div class="device-card">
                            <h3>🧹 Пылесос</h3>
                            <p><code>${DEVICES.vacuum.id}</code></p>
                            <button class="btn-on" onclick="fetch('/api/vacuum/on').then(r=>r.json()).then(alert)">Запустить</button>
                            <button class="btn-off" onclick="fetch('/api/vacuum/off').then(r=>r.json()).then(alert)">Остановить</button>
                            <button class="btn-dock" onclick="fetch('/api/vacuum/dock').then(r=>r.json()).then(alert)">Вернуть на базу</button>
                        </div>

                        <p style="margin-top:30px;">🔧 Полноценный интерфейс доступен при наличии <code>public/index.html</code></p>
                    </div>
                </body>
                </html>
            `);
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`
============================================
🚀 SMART HOME SERVER (МУЛЬТИУСТРОЙСТВА)
============================================
🌐 Сайт: http://localhost:${PORT}
🔑 Токен: ${YANDEX_TOKEN ? '✅ загружен' : '❌ ОТСУТСТВУЕТ'}
📋 Устройства в системе:
   • Лампа     (${DEVICES.yandexLamp.id})
   • Лампочка Глеб   (${DEVICES.glebLamp.id})
   • Пылесос         (${DEVICES.vacuum.id})
============================================
    `);
});