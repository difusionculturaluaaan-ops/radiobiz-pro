const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🚀 Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: false, // Ver la ventana del navegador
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Capturar logs de consola
    const consoleLogs = [];
    page.on('console', msg => {
      const log = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      console.log('  ' + log);
      consoleLogs.push(log);
    });

    console.log('📱 Navegando a Dashboard...');
    await page.goto('https://radiobiz-pro.vercel.app/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('🔐 Haciendo login...');
    await page.type('#loginEmail', 'test@radiobiz.com');
    await page.type('#loginPass', 'Test123!');
    await page.click('#loginBtn');

    // Esperar a que cargue el dashboard
    await new Promise(r => setTimeout(r, 3000));
    console.log('✅ Login exitoso');

    console.log('🎯 Buscando primer cliente...');
    const clientButton = await page.$('button[onclick*="openPlayer4"]');
    if (!clientButton) {
      throw new Error('No se encontró botón V4');
    }

    console.log('🎛️ Abriendo Player V4...');
    const popupPromise = new Promise(resolve =>
      browser.once('disconnected', resolve)
    );
    clientButton.click();

    // Esperar a que se abra una nueva pestaña
    await new Promise(r => setTimeout(r, 3000));

    const pages = await browser.pages();
    const v4Page = pages.find(p => p.url().includes('player-pro-v4'));
    if (!v4Page) {
      throw new Error('V4 no se abrió');
    }

    await v4Page.bringToFront();
    await new Promise(r => setTimeout(r, 2000)); // Esperar a que cargue

    console.log('🖱️ Haciendo click en botón "Cliente"...');
    consoleLogs.length = 0; // Limpiar logs previos

    const clienteBtn = await v4Page.$('button[onclick="openClientLink()"]');
    if (!clienteBtn) {
      throw new Error('No se encontró botón Cliente en V4');
    }

    clienteBtn.click();

    // Esperar a que aparezca el alert o se abra V5
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n📊 ═══════════════════════════════════════');
    console.log('📊 RESULTADOS:');
    console.log('═══════════════════════════════════════');

    if (consoleLogs.some(log => log.includes('saveProgramming'))) {
      console.log('✅ saveProgramming() se ejecutó');
      const errorLogs = consoleLogs.filter(log => log.includes('Error') || log.includes('❌'));
      if (errorLogs.length > 0) {
        console.log('❌ ERRORES EN FIREBASE:');
        errorLogs.forEach(log => console.log('   ' + log));
      } else {
        console.log('✅ Sin errores detectados');
      }
    } else {
      console.log('❌ saveProgramming() NO se ejecutó');
    }

    // Verificar si V5 se abrió
    const allPages = await browser.pages();
    if (allPages.length > 2) {
      console.log('✅ V5 se abrió correctamente');
    } else {
      console.log('❌ V5 NO se abrió');
    }

    console.log('═══════════════════════════════════════\n');

    // Mantener abierto para inspección manual
    console.log('🔍 Navegadores abiertos para inspección. Presiona Ctrl+C para cerrar.');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
})();
