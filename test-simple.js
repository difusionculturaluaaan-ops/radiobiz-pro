const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🚀 Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('  [CONSOLE]', msg.text()));

    console.log('📱 Navegando a Dashboard...');
    await page.goto('https://radiobiz-pro.vercel.app/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    }).catch(e => console.log('⚠️ Carga parcial:', e.message));

    console.log('⏳ Esperando a que carguen los clientes desde Firebase...');
    await new Promise(r => setTimeout(r, 8000));

    const title = await page.title();
    console.log('📄 Título:', title);

    // Buscar cualquier botón que abra V4
    const allButtons = await page.$$eval('button', btns =>
      btns.map(b => ({
        text: b.textContent.slice(0, 50),
        onclick: b.getAttribute('onclick')?.slice(0, 50),
        title: b.getAttribute('title')?.slice(0, 50)
      }))
    );

    console.log('\n📋 Botones encontrados:');
    allButtons.forEach((b, i) => {
      console.log(`  ${i}: text="${b.text}" onclick="${b.onclick}"`);
    });

    console.log('\n✅ Diagnóstico completado. El navegador permanecerá abierto.');
    console.log('🔍 Presiona Ctrl+C para cerrar.');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
})();
