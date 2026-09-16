<script setup lang="ts">
definePageMeta({
  layout: false
})

const features = [
  {
    icon: 'i-lucide-calendar-check',
    title: 'Återkommande tider',
    description: 'Säg till en gång vilken dag och tid som passar dig – sedan fixar vi resten varje vecka.'
  },
  {
    icon: 'i-lucide-users-round',
    title: 'Automatisk matchning',
    description: 'Vi kontaktar automatiskt dina kompisar först för att försöka få ihop en boll. Sedan fyller vi på med spelare på rätt nivå, baserat på ranking.'
  },
  {
    icon: 'i-lucide-bell-ring',
    title: 'SMS-påminnelser',
    description: 'Få en påminnelse innan din bokning – så du aldrig missar en match.'
  },
  {
    icon: 'i-lucide-shield-check',
    title: 'Bekymmersfritt',
    description: 'Avbokningar och ombokningar sköts automatiskt om någon får förhinder.'
  }
]

const steps = [
  {
    number: '1',
    icon: 'i-lucide-calendar-plus',
    title: 'Registrera dig',
    description: 'Välj sport, tid och arena som passar dig.'
  },
  {
    number: '2',
    icon: 'i-lucide-message-square-check',
    title: 'Svara på SMS:et',
    description: 'Några dagar innan frågar vi om du vill spela. <strong>Svara JA – klart!</strong>'
  },
  {
    number: '3',
    icon: 'i-lucide-users-round',
    title: 'Spela!',
    description: 'Vi kontaktar dina kompisar först, sedan fyller vi på med <strong>rätt nivå</strong>.'
  }
]

const faqs = [
  {
    question: 'Vad händer om ingen annan vill spela samma tid?',
    answer: 'Då väntar din bokning tills vi hittar matchande spelare. Du debiteras inte förrän tiden är bekräftad.'
  },
  {
    question: 'Kan jag hoppa av en vecka?',
    answer: 'Ja! Skicka ett SMS så tar vi bort dig för den veckan. Du debiteras inte för lediga veckor.'
  },
  {
    question: 'Hur fungerar avbokningar?',
    answer: 'Du kan avboka fram till 24 timmar innan utan kostnad. Vid senare avbokning debiteras halva banpriset.'
  },
  {
    question: 'Hur betalar jag?',
    answer: 'Betalning sker månadsvis i efterskott via Swish eller banköverföring.'
  }
]
</script>

<template>
  <div class="landing-page">
    <!-- Background Effects -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-grid"></div>

    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 border-b border-white/10">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            M
          </div>
          <span class="font-semibold text-white">Matchmaker</span>
        </div>
        <UButton to="/admin" variant="ghost" size="sm" class="text-slate-400 hover:text-white">
          Admin →
        </UButton>
      </div>
    </header>

    <!-- Hero -->
    <section class="pt-40 pb-20 px-6 relative">
      <div class="max-w-3xl mx-auto text-center">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Sportbokning för dig som har koll
        </div>
        
        <h1 class="mb-6 leading-tight tracking-tight">
          <span class="block text-white text-6xl md:text-7xl font-black uppercase tracking-[-0.04em]">Sluta jaga.</span>
          <span class="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 text-6xl md:text-7xl font-black uppercase tracking-[-0.04em] mt-2">Börja spela.</span>
        </h1>

        <p class="text-xl text-slate-400 mb-10">
          Vi fixar medspelarna – du fixa formen.
        </p>

        <div class="flex flex-wrap justify-center gap-3 mb-10">
          <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-slate-200">
            ✓ Helt gratis
          </span>
          <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-slate-200">
            ✓ Inga medlemskap
          </span>
          <span class="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-slate-200">
            ✓ SMS-påminnelse
          </span>
        </div>

        <div class="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div v-for="(step, i) in steps" :key="step.number"
            class="step-card group">
            <div class="step-number" :class="i === 1 ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'">
              {{ step.number }}
            </div>
            <h2 class="font-semibold text-white text-lg mb-2">{{ step.title }}</h2>
            <p class="text-sm text-slate-400" v-html="step.description" />
          </div>
        </div>
      </div>
    </section>

    <!-- Illustration -->
    <section class="py-12 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <img src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=85"
            alt="Padelracketar och boll på en padelbana" class="h-72 md:h-96 w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <span class="rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm text-white border border-white/10">Fredag 18:00</span>
              <span class="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 text-white font-medium">4 spelare matchade</span>
            </div>
            <p class="mt-4 text-xl md:text-2xl font-bold text-white">Din tid. Ditt gäng. Rätt nivå.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Match images -->
    <section class="px-6 py-12">
      <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        <div class="relative overflow-hidden rounded-2xl h-72 border border-white/10">
          <img src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=85"
            alt="Spelare på en racketbana" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <p class="absolute bottom-5 left-5 text-white font-semibold text-lg">Spela med ditt vanliga gäng</p>
        </div>
        <div class="relative overflow-hidden rounded-2xl h-72 border border-white/10">
          <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=85"
            alt="Racket och boll på banan" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <p class="absolute bottom-5 left-5 text-white font-semibold text-lg">Alltid spelare på rätt nivå</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <span class="section-tag">Så enkelt</span>
          <h2 class="text-3xl md:text-4xl font-bold text-white mt-4">Allt sköts automatiskt</h2>
          <p class="text-slate-400 max-w-xl mx-auto mt-4">
            Vi har byggt ett system som tar hand om allt det tråkiga – så att du bara behöver tänka på spelet.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div v-for="feature in features" :key="feature.title"
            class="feature-card group">
            <div class="feature-icon">
              <UIcon :name="feature.icon" class="w-6 h-6" />
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-slate-400 text-sm leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Payment highlight -->
    <section class="py-12 px-6">
      <div class="max-w-3xl mx-auto">
        <div class="payment-highlight">
          <div class="payment-badge">
            <UIcon name="i-lucide-badge-check" class="w-7 h-7" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-amber-400">Helt gratis att använda</h2>
            <p class="text-slate-400 mt-1">Du betalar exakt samma pris som vid vanlig bokning – inga dolda avgifter.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-20 px-6">
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-white mb-4">Vanliga frågor</h2>
        </div>

        <div class="space-y-4">
          <div v-for="faq in faqs" :key="faq.question" class="faq-card">
            <h3 class="text-base font-semibold text-white mb-2">
              {{ faq.question }}
            </h3>
            <p class="text-slate-400 text-sm leading-relaxed">
              {{ faq.answer }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24 px-6 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
      <div class="cta-orb cta-orb-1"></div>
      <div class="cta-orb cta-orb-2"></div>
      
      <div class="max-w-2xl mx-auto text-center relative z-10">
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-5">
          Redo att börja spela?
        </h2>
        <p class="text-blue-200 text-lg mb-10">
          Det tar bara 2 minuter att registrera dig.
        </p>
        <UButton size="xl" class="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold shadow-xl hover:shadow-amber-400/30 hover:scale-105 transition-all">
          Registrera din tid →
        </UButton>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-10 px-6 bg-slate-950 border-t border-white/10">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span class="font-semibold text-white">Matchmaker</span>
          </div>
          <div class="flex gap-6 text-sm text-slate-400">
            <a href="#" class="hover:text-white transition-colors">Om oss</a>
            <a href="#" class="hover:text-white transition-colors">Kontakt</a>
            <a href="#" class="hover:text-white transition-colors">Integritetspolicy</a>
          </div>
          <div class="text-sm text-slate-500">
            © 2025
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  position: relative;
}

/* Background Effects */
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  pointer-events: none;
  z-index: 0;
}

.bg-orb-1 {
  width: 500px;
  height: 500px;
  top: -200px;
  right: -150px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.bg-orb-2 {
  width: 400px;
  height: 400px;
  bottom: 30%;
  left: -150px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  opacity: 0.2;
}

.bg-grid {
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

/* Hero Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  backdrop-filter: blur(10px);
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Step Cards */
.step-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.step-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-4px);
}

.step-number {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  border-radius: 14px;
  font-size: 22px;
  font-weight: 800;
  color: white;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

/* Section Tag */
.section-tag {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Feature Cards */
.feature-card {
  padding: 28px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(59, 130, 246, 0.3);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 14px;
  color: white;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

/* Payment Highlight */
.payment-highlight {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(249, 115, 22, 0.08));
  border: 1px solid rgba(251, 191, 36, 0.2);
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
  color: #0f172a;
  box-shadow: 0 4px 14px rgba(251, 191, 36, 0.3);
}

/* FAQ Cards */
.faq-card {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: all 0.2s ease;
}

.faq-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

/* CTA Section */
.cta-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.cta-orb-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: 10%;
  background: rgba(251, 191, 36, 0.2);
}

.cta-orb-2 {
  width: 250px;
  height: 250px;
  bottom: -80px;
  right: 15%;
  background: rgba(59, 130, 246, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .step-card {
    padding: 20px;
  }
  
  .step-number {
    width: 40px;
    height: 40px;
    font-size: 18px;
    margin-bottom: 12px;
  }
  
  .feature-card {
    padding: 20px;
  }
  
  .payment-highlight {
    flex-direction: column;
    text-align: center;
  }
}
</style>
