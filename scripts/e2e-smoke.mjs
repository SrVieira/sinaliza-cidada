import puppeteer from 'puppeteer-core'

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5173/'
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu']
})

const context = browser.defaultBrowserContext()
await context.overridePermissions(new URL(baseUrl).origin, ['geolocation'])
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await page.setGeolocation({ latitude: -22.9068, longitude: -43.1729, accuracy: 25 })

const errors = []
page.on('pageerror', (error) => errors.push(error.message))

async function clickButton(text) {
  const clicked = await page.evaluate((label) => {
    const candidates = [...document.querySelectorAll('button')]
    const target = candidates.find((button) => button.textContent?.trim().includes(label))
    if (!target) return false
    target.click()
    return true
  }, text)
  if (!clicked) throw new Error(`Botão não encontrado: ${text}`)
}

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await page.waitForSelector('.hero-card')

  await clickButton('Mapa')
  await page.waitForSelector('.map-canvas')
  await page.waitForFunction(
    () => [...document.querySelectorAll('.leaflet-tile')].some((tile) => tile instanceof HTMLImageElement && tile.naturalWidth === 256),
    { timeout: 15_000 }
  )
  await page.waitForFunction(() => !document.querySelector('.map-tile-status'), { timeout: 15_000 })
  await page.screenshot({ path: '/tmp/sinaliza-map.png' })

  await clickButton('Relatar')
  await page.waitForSelector('.category-grid')
  await clickButton('Iluminação precária')
  await clickButton('Enviar relato')
  await page.waitForSelector('.success-mark')

  await clickButton('Ajuda')
  await page.waitForSelector('.phone-list')
  const hasPolice = await page.evaluate(() => document.body.textContent?.includes('Polícia Militar'))
  if (!hasPolice) throw new Error('Central de emergência sem Polícia Militar')

  await clickButton('Início')
  await page.waitForSelector('.floating-sos')
  await page.click('.floating-sos')
  await page.waitForSelector('.sos-modal')
  await page.click('.modal-close')

  await clickButton('Perfil')
  await page.waitForSelector('.profile-card')

  if (errors.length) throw new Error(`Erros de página: ${errors.join(' | ')}`)
  console.log('Smoke test concluído: início, mapa, relato, emergência, SOS e perfil.')
} finally {
  await browser.close()
}
