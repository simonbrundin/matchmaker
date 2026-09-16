<script setup lang="ts">
definePageMeta({
  layout: false
})

const printPoster = () => {
  window.print()
}
</script>

<template>
  <div class="poster-page">
    <div class="poster-toolbar">
      <NuxtLink to="/index-landing" class="back-link">← Tillbaka till sidan</NuxtLink>
      <button class="export-button" type="button" @click="printPoster">
        <span>↓</span>
        Exportera till PDF
      </button>
    </div>

    <main class="poster" aria-label="Matchmaker-affisch">
      <!-- Background Decorations -->
      <div class="bg-orb bg-orb-1"></div>
      <div class="bg-orb bg-orb-2"></div>
      <div class="bg-grid"></div>

      <section class="poster-hero">
        <div class="brand-badge">
          <div class="brand-icon">M</div>
          <span>Matchmaker</span>
        </div>
        
        <div class="hero-content">
          <p class="eyebrow">
            <span class="eyebrow-line"></span>
            Sportbokning för dig som har koll
            <span class="eyebrow-line"></span>
          </p>
          
          <h1>
            <span class="headline-main">Sluta jaga.</span>
            <span class="headline-accent">Börja spela.</span>
          </h1>
          
          <p class="hero-sub">
            Vi fixar medspelarna – du fixa formen.
          </p>
          
          <div class="hero-cta">
            <span class="cta-badge">✓ Helt gratis</span>
            <span class="cta-badge">✓ Inga medlemskap</span>
            <span class="cta-badge">✓ SMS-påminnelse</span>
          </div>
        </div>
      </section>

      <div class="poster-image-wrap">
        <img src="https://plus.unsplash.com/premium_photo-1768468158548-7ee090d1c889?w=1600&auto=format&fit=crop&q=85"
          alt="Två personer som spelar padel på en blå padelbana" />
        <div class="image-overlay"></div>
        <div class="image-label">
          <span class="image-label-icon">🎾</span>
          <span>Din tid. Ditt gäng. Rätt nivå.</span>
        </div>
      </div>

      <section class="steps-section">
        <div class="section-header">
          <span class="section-tag">Så enkelt</span>
          <h2>Bara tre steg</h2>
        </div>

        <div class="steps">
          <article class="step">
            <div class="step-connector"></div>
            <div class="step-number">1</div>
            <h3>Boka din tid</h3>
            <p>Välj sport, tid och arena. <strong>Du bestämmer – vi genomför.</strong></p>
          </article>

          <article class="step step-accent">
            <div class="step-connector"></div>
            <div class="step-number">2</div>
            <h3>Få ett SMS</h3>
            <p>Några dagar innan frågar vi om du vill spela. <strong>Svara JA – klart!</strong></p>
          </article>

          <article class="step">
            <div class="step-number">3</div>
            <h3>Spela!</h3>
            <p>Vi kontaktar dina kompisar först, sedan fyller vi på med <strong>rätt nivå</strong>.</p>
          </article>
        </div>
      </section>

      <section class="payment-box">
        <div class="payment-badge">
          <UIcon name="i-lucide-badge-check" class="payment-icon-svg" />
        </div>
        <div class="payment-text">
          <h2>Helt gratis att använda</h2>
          <p>Du betalar exakt samma pris som vid vanlig bokning – inga dolda avgifter.</p>
        </div>
      </section>

      <footer class="poster-footer">
        <div class="footer-cta">
          <p class="footer-headline">Redo att börja?</p>
          <a href="https://matchmaker.se" class="footer-url">matchmaker.se</a>
        </div>
        <div class="footer-qr">
          <div class="qr-placeholder">📱</div>
          <span>Skanna för att börja</span>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* === Base & Reset === */
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  background: #0f172a;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.poster-page {
  min-height: 100vh;
  padding: 24px;
  background: #0f172a;
}

/* === Toolbar === */
.poster-toolbar {
  width: min(842px, 100%);
  margin: 0 auto 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.back-link {
  color: #94a3b8;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: #e2e8f0;
}

.export-button {
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  color: #0f172a;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgb(251 191 36 / 35%);
  transition: transform 0.2s, box-shadow 0.2s;
}

.export-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgb(251 191 36 / 45%);
}

/* === Poster Container === */
.poster {
  width: 842px;
  height: 1498px;
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0;
  color: #f1f5f9;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  box-shadow: 0 25px 80px rgb(0 0 0 / 50%);
}

/* === Background Decorations === */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  pointer-events: none;
}

.bg-orb-1 {
  width: 400px;
  height: 400px;
  top: -150px;
  right: -100px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.bg-orb-2 {
  width: 350px;
  height: 350px;
  bottom: 200px;
  left: -120px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  opacity: 0.25;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgb(255 255 255 / 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* === Content Layers === */
.poster-hero,
.poster-image-wrap,
.steps-section,
.payment-box,
.poster-footer {
  position: relative;
  z-index: 1;
}

/* === Hero Section === */
.poster-hero {
  padding: 50px 56px 40px;
  text-align: center;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  margin-bottom: 36px;
  background: rgb(255 255 255 / 8%);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 999px;
  backdrop-filter: blur(10px);
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 8px;
  font-size: 18px;
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.eyebrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 0 0 24px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.eyebrow-line {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #3b82f6);
  border-radius: 2px;
}

.eyebrow-line:last-child {
  background: linear-gradient(90deg, #f97316, transparent);
}

h1 {
  margin: 0 0 20px;
  font-size: 76px;
  line-height: 0.95;
  letter-spacing: -0.04em;
}

.headline-main {
  display: block;
  color: #f1f5f9;
  font-weight: 800;
}

.headline-accent {
  display: block;
  background: linear-gradient(135deg, #fbbf24, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
}

.hero-sub {
  margin: 0 0 28px;
  color: #94a3b8;
  font-size: 22px;
  line-height: 1.4;
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.cta-badge {
  padding: 10px 18px;
  background: rgb(255 255 255 / 6%);
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

/* === Image Section === */
.poster-image-wrap {
  position: relative;
  height: 320px;
  margin: 0 40px;
  overflow: hidden;
  border-radius: 24px;
  border: 3px solid rgb(255 255 255 / 10%);
  box-shadow: 0 20px 50px rgb(0 0 0 / 40%);
}

.poster-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgb(15 23 42 / 80%) 100%);
}

.image-label {
  position: absolute;
  right: 24px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgb(15 23 42 / 85%);
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 999px;
  backdrop-filter: blur(10px);
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
}

.image-label-icon {
  font-size: 20px;
}

/* === Steps Section === */
.steps-section {
  padding: 48px 56px 32px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.section-tag {
  padding: 6px 14px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.steps-section h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.02em;
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.step {
  position: relative;
  padding: 24px;
  background: rgb(255 255 255 / 4%);
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 20px;
  transition: transform 0.2s, background 0.2s;
}

.step:hover {
  background: rgb(255 255 255 / 6%);
  transform: translateY(-4px);
}

.step-accent {
  background: linear-gradient(135deg, rgb(249 115 22 / 15%), rgb(234 88 12 / 10%));
  border-color: rgb(249 115 22 / 20%);
}

.step-connector {
  position: absolute;
  top: 44px;
  right: -24px;
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, rgb(59 130 246 / 50%), transparent);
}

.step-accent .step-connector {
  background: linear-gradient(90deg, rgb(249 115 22 / 50%), transparent);
}

.step:last-child .step-connector {
  display: none;
}

.step-number {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 14px;
  font-size: 22px;
  font-weight: 800;
  color: white;
  box-shadow: 0 4px 14px rgb(59 130 246 / 30%);
}

.step-accent .step-number {
  background: linear-gradient(135deg, #f97316, #ea580c);
  box-shadow: 0 4px 14px rgb(249 115 22 / 30%);
}

.step h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
}

.step p {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.5;
}

/* === Payment Box === */
.payment-box {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 0 40px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgb(251 191 36 / 12%), rgb(249 115 22 / 8%));
  border: 1px solid rgb(251 191 36 / 20%);
  border-radius: 20px;
}

.payment-badge {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 16px;
  box-shadow: 0 4px 14px rgb(251 191 36 / 30%);
}

.payment-icon-svg {
  width: 28px;
  height: 28px;
  color: #0f172a;
}

.payment-text h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 800;
  color: #fbbf24;
}

.payment-text p {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

/* === Footer === */
.poster-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 36px 56px;
  background: linear-gradient(180deg, transparent, rgb(0 0 0 / 30%));
}

.footer-cta {
  text-align: left;
}

.footer-headline {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #f1f5f9, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-url {
  font-size: 28px;
  font-weight: 800;
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-url:hover {
  color: #60a5fa;
}

.footer-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qr-placeholder {
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  background: white;
  border-radius: 12px;
  font-size: 40px;
}

.footer-qr span {
  font-size: 12px;
  color: #64748b;
}

/* === Responsive === */
@media (max-width: 700px) {
  .poster-page {
    padding: 12px;
  }

  .poster-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .poster {
    height: auto;
    min-height: 1498px;
  }

  .poster-hero {
    padding: 36px 24px 28px;
  }

  h1 {
    font-size: 52px;
  }

  .hero-sub {
    font-size: 18px;
  }

  .poster-image-wrap {
    height: 220px;
    margin: 0 20px;
  }

  .steps-section {
    padding: 36px 24px 24px;
  }

  .steps {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .step-connector {
    display: none;
  }

  .payment-box {
    margin: 0 20px;
    flex-direction: column;
    text-align: center;
  }

  .poster-footer {
    padding: 28px 24px;
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }

  .footer-cta {
    text-align: center;
  }

  .footer-headline {
    font-size: 24px;
  }

  .footer-url {
    font-size: 22px;
  }
}

/* === Print === */
@media print {
  :global(body) {
    background: white;
  }

  .poster-page {
    padding: 0;
  }

  .poster-toolbar {
    display: none;
  }

  .poster {
    width: 842px;
    height: 1498px;
    max-width: none;
    margin: 0;
    box-shadow: none;
  }
}

@page {
  size: 842px 1498px;
  margin: 0;
}
</style>
