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
      <div class="poster-topline">
        <div class="brand-mark">M</div>
        <span class="brand-name">Matchmaker</span>
      </div>

      <section class="poster-hero">
        <p class="eyebrow">Återkommande spel utan krångel</p>
        <h1><strong class="headline-kicker">Sluta jaga spelare.</strong><br /><em>Du väljer speltid –<br />Vi jagar åt
            dig.</em></h1>
        <p class="hero-copy">
          Få hjälp att boka din favorittid utan att jaga runt efter medspelare.
        </p>
      </section>

      <div class="poster-image-wrap">
        <img src="https://plus.unsplash.com/premium_photo-1768468158548-7ee090d1c889?w=1600&auto=format&fit=crop&q=85"
          alt="Två personer som spelar padel på en blå padelbana" />
        <div class="image-label">Din tid. Ditt gäng. Rätt nivå.</div>
      </div>

      <section class="steps-section">
        <h2>Så fungerar det</h2>

        <div class="steps">
          <article class="step">
            <div class="step-number">
              <UIcon name="i-lucide-calendar-plus" class="step-icon" />
            </div>
            <div>
              <h3>Registrera dig</h3>
              <p>Välj <strong>sport, tid och plats</strong> som passar dig.</p>
            </div>
          </article>

          <article class="step">
            <div class="step-number">
              <UIcon name="i-lucide-message-square-check" class="step-icon" />
            </div>
            <div>
              <h3>Svara på SMS:et</h3>
              <p>Några dagar före tiden får du en fråga. Du kan <strong>alltid säga nej</strong>.</p>
            </div>
          </article>

          <article class="step">
            <div class="step-number">
              <UIcon name="i-lucide-users-round" class="step-icon" />
            </div>
            <div>
              <h3>Vi hittar spelarna</h3>
              <p>Vi kontaktar <strong>dina kompisar först</strong> och fyller på med spelare på rätt nivå.</p>
            </div>
          </article>
        </div>
      </section>

      <section class="payment-box">
        <div class="payment-icon">
          <UIcon name="i-lucide-badge-check" class="payment-icon-svg" />
        </div>
        <div>
          <h2>Helt gratis</h2>
          <p>Du betalar samma pris som för en vanlig bokning.</p>
        </div>
      </section>

      <footer class="poster-footer">
        <p>Slipp jaga medspelare. Börja spela.</p>
        <div class="signup-line">Registrera din tid idag</div>
        <div class="footer-brand">matchmaker.se</div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  background: #e5e7eb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.poster-page {
  min-height: 100vh;
  padding: 24px;
}

.poster-toolbar {
  width: min(842px, 100%);
  margin: 0 auto 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.back-link {
  color: #374151;
  font-size: 14px;
  text-decoration: none;
}

.export-button {
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  color: white;
  background: #059669;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 20px rgb(5 150 105 / 22%);
}

.export-button:hover {
  background: #047857;
}

.poster {
  width: 842px;
  height: 1498px;
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 58px 64px 0;
  color: #10251d;
  background: linear-gradient(145deg, #f7faf8 0%, #ffffff 58%, #ecfdf5 100%);
  border-top: 10px solid #059669;
  box-shadow: 0 20px 60px rgb(15 23 42 / 16%);
}

.poster::before {
  content: "";
  position: absolute;
  width: 430px;
  height: 430px;
  top: -180px;
  right: -130px;
  border-radius: 50%;
  background: #d1fae5;
}

.poster-topline,
.poster-hero,
.poster-image-wrap,
.steps-section,
.payment-box,
.poster-footer {
  position: relative;
  z-index: 1;
}

.poster-topline {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #064e3b;
  font-size: 20px;
  font-weight: 800;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: white;
  background: linear-gradient(135deg, #10b981, #047857);
  font-size: 23px;
}

.poster-hero {
  padding: 72px 0 42px;
}

.eyebrow {
  margin: 0 0 18px;
  color: #059669;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

h1 {
  max-width: 680px;
  margin: 0;
  color: #10251d;
  font-size: 68px;
  line-height: 1.03;
  letter-spacing: -.055em;
}

h1 em {
  color: #52635b;
  font-style: normal;
}

.headline-kicker {
  display: inline-block;
  color: #10251d;
  font-size: 1.12em;
  font-weight: 900;
  letter-spacing: -.065em;
  text-transform: uppercase;
}

.hero-copy {
  max-width: 560px;
  margin: 26px 0 0;
  color: #52635b;
  font-size: 23px;
  line-height: 1.4;
}

.poster-image-wrap {
  height: 350px;
  overflow: hidden;
  border: 8px solid white;
  border-radius: 30px;
  box-shadow: 0 18px 34px rgb(15 23 42 / 16%);
}

.poster-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-label {
  position: absolute;
  right: 24px;
  bottom: 22px;
  padding: 10px 16px;
  border-radius: 999px;
  color: white;
  background: rgb(6 78 59 / 82%);
  font-size: 15px;
  font-weight: 700;
}

.steps-section {
  padding: 42px 0 28px;
}

.steps-section>h2 {
  margin: 0 0 20px;
  font-size: 27px;
  letter-spacing: -.02em;
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.step {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-number {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #047857;
  background: #d1fae5;
  font-size: 18px;
  font-weight: 800;
}

.step-icon {
  width: 20px;
  height: 20px;
}

.step h3 {
  margin: 0 0 7px;
  font-size: 17px;
}

.step p {
  margin: 0;
  color: #64746c;
  font-size: 15px;
  line-height: 1.45;
}

.payment-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border: 1px solid #a7f3d0;
  border-radius: 18px;
  background: #ecfdf5;
}

.payment-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  color: white;
  background: #059669;
  font-weight: 800;
}

.payment-icon-svg {
  width: 18px;
  height: 18px;
}

.payment-box h2 {
  margin: 0 0 4px;
  font-size: 16px;
}

.payment-box p {
  margin: 0;
  color: #527064;
  font-size: 14px;
}

.poster-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: auto;
  padding: 28px 0 34px;
  border-top: 1px solid #d9e8df;
}

.poster-footer p,
.signup-line,
.footer-brand {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.poster-footer p {
  color: #52635b;
}

.signup-line {
  color: #059669;
}

.footer-brand {
  color: #064e3b;
}

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
    padding: 40px 28px 0;
  }

  h1 {
    font-size: 48px;
  }

  .hero-copy {
    font-size: 19px;
  }

  .poster-image-wrap {
    height: 250px;
  }

  .steps {
    grid-template-columns: 1fr;
  }

  .poster-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

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
