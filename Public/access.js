const axios = require('axios');

async function getToken() {
  const CLIENT_ID = '24de15b9ce274da3a87ad297a52cfbad';
  const CLIENT_SECRET = '0e5b14380cab474b9427e6e2372b6e34';
  const AUTH_CODE = 'pslw73wuplqd5scw';

  try {
    console.log('🔄 Получаем токен...');
    
    const response = await axios.post('https://oauth.yandex.ru/token', 
      `grant_type=authorization_code&code=${AUTH_CODE}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`, 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Токен получен!');
    console.log('\n=== ВАШИ ДАННЫЕ ===');
    console.log('Access Token:', response.data.access_token);
    console.log('Refresh Token:', response.data.refresh_token);
    console.log('Срок действия:', Math.floor(response.data.expires_in / 86400), 'дней');
    console.log('Тип токена:', response.data.token_type);
    console.log('====================\n');
    
    // Сохраняем для следующего шага
    return response.data.access_token;
    
  } catch (error) {
    console.error('❌ Ошибка получения токена:');
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('Данные:', error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

getToken();