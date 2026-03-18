const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch'); // ← теперь fetch работает
const path = require('path');

const app = express();
const PORT = 3000;

// ========== КОНФИГУРАЦИЯ ==========
const CONFIG = {
    YANDEX_CLIENT_ID: '9c14cb6339a34407b5cc409fcaff6732',
    // ВАШ ТОЧНЫЙ ID УСТРОЙСТВА (без суффикса)
    YOUR_DEVICE_ID: '32f6a791-bba6-4d56-8dbf-a7be00fab417'
};

// ========== БАЗА ДАННЫХ ТОКЕНОВ ==========
const tokensDB = { access_token: null };

// Загрузка токена
try {
    if (fs.existsSync('yandex_token.json')) {
        const saved = JSON.parse(fs.readFileSync('yandex_token.json', 'utf8'));
        tokensDB.access_token = saved.access_token;
        console.log('✅ Загружен сохранённый токен из yandex_token.json');
    }
    else if (fs.existsSync('working_token.txt')) {
        const token = fs.readFileSync('working_token.txt', 'utf8').trim();
        if (token) {
            tokensDB.access_token = token;
            fs.writeFileSync('yandex_token.json', JSON.stringify({ access_token: token }, null, 2));
            console.log('✅ Токен загружен из working_token.txt и сохранён');
        }
    }
} catch (e) {
    console.log('⚠️ Не удалось загрузить токен:', e.message);
}

function saveToken(token) {
    tokensDB.access_token = token;
    fs.writeFileSync('yandex_token.json', JSON.stringify({ access_token: token }, null, 2));
    console.log('💾 Токен сохранён в yandex_token.json');
}

app.use(express.json());
app.use(express.static('.'));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// ========== СОХРАНЕНИЕ ТОКЕНА ==========
app.post('/save-token', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'Токен не предоставлен' });
    const cleanToken = token.replace('Bearer ', '').replace('OAuth ', '').trim();
    saveToken(cleanToken);
    res.json({ success: true, message: 'Токен сохранён' });
});

// ========== ПОЛУЧЕНИЕ ВСЕХ УСТРОЙСТВ ==========
app.get('/api/yandex/devices', async (req, res) => {
    if (!tokensDB.access_token) {
        return res.json({ success: false, error: 'Токен не установлен', requires_auth: true });
    }
    try {
        const response = await fetch('https://api.iot.yandex.net/v1.0/user/info', {
            headers: { 'Authorization': `Bearer ${tokensDB.access_token}` }
        });
        if (!response.ok) {
            return res.json({ success: false, error: `HTTP ${response.status}` });
        }
        const data = await response.json();
        res.json({
            success: true,
            devices: data.devices || [],
            total: data.devices?.length || 0,
            user: data.login || data.user_id
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ========== УПРАВЛЕНИЕ УСТРОЙСТВОМ ==========
app.post('/api/yandex/devices/:deviceId/control', async (req, res) => {
    const { deviceId } = req.params;
    const { action } = req.body;
    if (!['on', 'off'].includes(action)) {
        return res.json({ success: false, error: 'Неверное действие' });
    }
    if (!tokensDB.access_token) {
        return res.json({ success: false, error: 'Токен не установлен', requires_auth: true });
    }
    try {
        const state = action === 'on';
        const requestBody = {
            devices: [{
                id: deviceId,
                actions: [{
                    type: 'devices.capabilities.on_off',
                    state: { instance: 'on', value: state }
                }]
            }]
        };
        const response = await fetch('https://api.iot.yandex.net/v1.0/devices/actions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokensDB.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        const result = await response.json();
        if (response.ok) {
            res.json({ success: true, action, device_id: deviceId, result });
        } else {
            res.json({ success: false, error: result.message || `Ошибка ${response.status}`, details: result });
        }
    } catch (error) {
        res.json({ success: false, error: 'Ошибка сети', details: error.message });
    }
});

// ========== ГЛАВНАЯ СТРАНИЦА ==========
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Управление Яндекс устройствами</title>
            <style>
                body{font-family:Arial;padding:20px;background:#f5f5f5;}
                .card{background:white;padding:20px;border-radius:10px;margin:15px 0;box-shadow:0 2px 5px rgba(0,0,0,0.1);}
                button{padding:12px 24px;margin:5px;border:none;border-radius:6px;cursor:pointer;font-size:15px;}
                .btn-success{background:#4CAF50;color:white;}
                .btn-danger{background:#f44336;color:white;}
                .btn-primary{background:#2196F3;color:white;}
                .device-item{padding:15px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;}
                .device-id{font-family:monospace;background:#f0f0f0;padding:4px 8px;border-radius:4px;font-size:13px;}
                pre{background:#f8f9fa;padding:10px;border-radius:5px;overflow-x:auto;}
                .status{color:green;font-weight:bold;}
                .error{color:red;}
            </style>
        </head>
        <body>
            <h1>🏠 Яндекс Умный дом — управление устройствами</h1>
            <div class="card">
                <h3>🔑 Токен: ${tokensDB.access_token ? '✅ Установлен' : '❌ Не установлен'}</h3>
                ${!tokensDB.access_token ? '<p><a href="https://oauth.yandex.ru/authorize?response_type=token&client_id=9c14cb6339a34407b5cc409fcaff6732&force_confirm=true" target="_blank">👉 Получить новый токен</a> и сохранить через POST /save-token</p>' : ''}
            </div>

            <div class="card">
                <h3>📱 Ваши устройства</h3>
                <div id="devices-list">Загрузка устройств...</div>
                <button class="btn-primary" onclick="loadDevices()">🔄 Обновить список</button>
            </div>

            <div class="card">
                <h3>💡 Управление выбранным устройством</h3>
                <p>Выберите устройство из списка выше, скопируйте его ID и вставьте сюда:</p>
                <input type="text" id="deviceIdInput" placeholder="Вставьте ID устройства" value="${CONFIG.YOUR_DEVICE_ID}" style="width:100%;padding:12px;margin-bottom:15px;font-family:monospace;border:2px solid #ddd;border-radius:6px;">
                <button class="btn-success" onclick="controlDevice('on')">✅ Включить</button>
                <button class="btn-danger" onclick="controlDevice('off')">❌ Выключить</button>
                <div id="control-result" style="margin-top:15px;"></div>
            </div>

            <script>
                async function loadDevices() {
                    const listDiv = document.getElementById('devices-list');
                    listDiv.innerHTML = 'Загрузка...';
                    try {
                        const res = await fetch('/api/yandex/devices');
                        const data = await res.json();
                        if (!data.success) {
                            listDiv.innerHTML = '<span class="error">❌ ' + (data.error || 'Неизвестная ошибка') + '</span>';
                            return;
                        }
                        if (!data.devices || data.devices.length === 0) {
                            listDiv.innerHTML = '<span>❌ В вашем аккаунте нет устройств.</span>';
                            return;
                        }
                        let html = '<p>Найдено устройств: ' + data.devices.length + '</p>';
                        data.devices.forEach((dev, i) => {
                            const isOnline = dev.online ? '🟢 онлайн' : '🔴 офлайн';
                            const name = dev.name || 'Без имени';
                            const id = dev.id;
                            html += \`
                                <div class="device-item">
                                    <div>
                                        <strong>\${name}</strong><br>
                                        <span class="device-id">\${id}</span><br>
                                        <small>\${isOnline} | \${dev.type || 'тип не указан'}</small>
                                    </div>
                                    <div>
                                        <button onclick="setDeviceId('\${id}')">📋 Выбрать</button>
                                    </div>
                                </div>
                            \`;
                        });
                        listDiv.innerHTML = html;
                    } catch (e) {
                        listDiv.innerHTML = '<span class="error">❌ Ошибка загрузки: ' + e.message + '</span>';
                    }
                }

                function setDeviceId(id) {
                    document.getElementById('deviceIdInput').value = id;
                }

                async function controlDevice(action) {
                    const deviceId = document.getElementById('deviceIdInput').value.trim();
                    if (!deviceId) {
                        alert('Введите ID устройства');
                        return;
                    }
                    const resultDiv = document.getElementById('control-result');
                    resultDiv.innerHTML = 'Отправка команды...';
                    try {
                        const res = await fetch('/api/yandex/devices/' + encodeURIComponent(deviceId) + '/control', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({action})
                        });
                        const data = await res.json();
                        if (data.success) {
                            resultDiv.innerHTML = '<span style="color:green;">✅ Команда выполнена: ' + action + '</span><pre>' + JSON.stringify(data.result || data, null, 2) + '</pre>';
                        } else {
                            resultDiv.innerHTML = '<span style="color:red;">❌ Ошибка: ' + (data.error || 'Неизвестная ошибка') + '</span><pre>' + JSON.stringify(data.details || data, null, 2) + '</pre>';
                        }
                    } catch (e) {
                        resultDiv.innerHTML = '<span style="color:red;">❌ Ошибка сети: ' + e.message + '</span>';
                    }
                }

                window.onload = loadDevices;
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`
===========================================
🚀 SERVER.JS ЗАПУЩЕН
===========================================
✅ Сервер: http://localhost:${PORT}
✅ Ваш Device ID (по умолчанию): ${CONFIG.YOUR_DEVICE_ID}
✅ Токен: ${tokensDB.access_token ? '✅ Установлен' : '❌ Требуется'}
🌐 Откройте браузер для диагностики и управления
===========================================
    `);
});