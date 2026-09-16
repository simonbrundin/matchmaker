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
    title: 'Registrera dig för en sport, tid och plats',
    description: 'Exempelvis <strong>Tennis</strong> varannan tisdag kl. <strong>19.00</strong> på <strong>Sundsvall Racketklubb</strong>'
  },
  {
    number: '2',
    icon: 'i-lucide-message-square-check',
    title: 'Svara på bekräftelse-SMS:et',
    description: 'Några dagar före din valda tid får du ett SMS. Du kan <strong>alltid säga nej</strong> om det inte passar – din registrering ligger kvar.'
  },
  {
    number: '3',
    icon: 'i-lucide-users-round',
    title: 'Vi kontaktar spelare åt dig',
    description: 'Vi kontaktar <strong>dina kompisar först</strong> och fyller vid behov på med spelare på samma nivå.'
  }
]
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <span class="font-semibold text-gray-900">Matchmaker</span>
        </div>
        <UButton to="/admin" variant="ghost" size="sm">
          Admin →
        </UButton>
      </div>
    </header>

    <!-- Hero -->
    <section class="pt-40 pb-24 px-6">
      <div class="max-w-3xl mx-auto text-center">
        <div
          class="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Spela med ditt vanliga gäng – utan att jaga spelare
        </div>
        <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
          <span class="block text-gray-900 text-6xl md:text-7xl font-black uppercase tracking-[-0.04em]">Sluta jaga
            medspelare</span>
          <span class="mt-3 block text-gray-600">Vi jagar åt dig –<br />Du väljer speltiden</span>
        </h1>
        <div class="max-w-5xl mx-auto mt-12 mb-10 text-left">
          <p class="text-xl text-gray-500 mb-6 leading-relaxed text-center">
            Så här enkelt fungerar det:
          </p>
          <div class="grid md:grid-cols-3 gap-4">
            <div v-for="(step, i) in steps" :key="step.number"
              class="relative rounded-2xl bg-gray-50 p-6 border border-gray-100 text-center">
              <div v-if="i < steps.length - 1"
                class="hidden md:block absolute top-10 left-full w-4 h-0.5 bg-emerald-200 z-10" />
              <div
                class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center mx-auto mb-4">
                <UIcon :name="step.icon" class="w-5 h-5" />
              </div>
              <h2 class="font-semibold text-gray-900">{{ step.title }}</h2>
              <p class="mt-2 text-sm text-gray-500 leading-relaxed" v-html="step.description" />
            </div>
          </div>

          <div class="mt-5 flex gap-4 rounded-2xl bg-emerald-50 p-5 border border-emerald-100">
            <div
              class="flex-none w-8 h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow-sm">
              <UIcon name="i-lucide-badge-check" class="w-4 h-4" />
            </div>
            <div>
              <h2 class="font-semibold text-gray-900">Helt gratis</h2>
              <p class="mt-1 text-sm text-gray-600 leading-relaxed">
                Du betalar samma pris som för en vanlig bokning.
              </p>
            </div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <UButton size="lg" color="primary" class="shadow-lg shadow-emerald-200">
            Registrera dig nu
          </UButton>
          <UButton size="lg" variant="outline" color="gray">
            Läs mer
          </UButton>
        </div>
      </div>
    </section>

    <!-- Illustration -->
    <section class="py-16 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="relative overflow-hidden rounded-3xl shadow-xl">
          <img src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=85"
            alt="Padelracketar och boll på en padelbana" class="h-72 md:h-96 w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-gray-950/75 via-gray-900/10 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <span class="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">Fredag 18:00</span>
              <span class="rounded-full bg-emerald-500 px-3 py-1">4 spelare matchade</span>
            </div>
            <p class="mt-3 text-lg font-semibold">En bra match börjar med rätt spelare.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Match image -->
    <section class="px-6 pb-24 bg-gray-50">
      <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        <div class="relative overflow-hidden rounded-2xl h-72">
          <img src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=85"
            alt="Spelare på en racketbana" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-gray-950/70 to-transparent" />
          <p class="absolute bottom-5 left-5 text-white font-semibold">Spela med ditt vanliga gäng</p>
        </div>
        <div class="relative overflow-hidden rounded-2xl h-72">
          <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=85"
            alt="Racket och boll på banan" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-gray-950/70 to-transparent" />
          <p class="absolute bottom-5 left-5 text-white font-semibold">Alltid spelare på rätt nivå</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-24 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Allt sköts automatiskt</h2>
          <p class="text-gray-500 max-w-xl mx-auto">
            Vi har byggt ett system som tar hand om allt det tråkiga – så att du bara behöver tänka på spelet.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div v-for="feature in features" :key="feature.title"
            class="group bg-gray-50 hover:bg-emerald-50 rounded-2xl p-8 transition-colors border border-transparent hover:border-emerald-100">
            <div
              class="w-12 h-12 rounded-xl bg-white group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-sm transition-colors">
              <UIcon :name="feature.icon" class="w-6 h-6" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-24 px-6 bg-gray-50">
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Vanliga frågor</h2>
        </div>

        <div class="space-y-4">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              Vad händer om ingen annan vill spela samma tid?
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed">
              Då väntar din bokning tills vi hittar matchande spelare. Du debiteras inte förrän tiden är bekräftad.
            </p>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              Kan jag hoppa av en vecka?
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed">
              Ja! Skicka ett SMS så tar vi bort dig för den veckan. Du debiteras inte för lediga veckor.
            </p>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              Hur fungerar avbokningar?
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed">
              Du kan avboka fram till 24 timmar innan utan kostnad. Vid senare avbokning debiteras halva banpriset.
            </p>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-base font-semibold text-gray-900 mb-2">
              Hur betalar jag?
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed">
              Betalning sker månadsvis i efterskott via Swish eller banköverföring.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24 px-6 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-5">
          Redo att börja spela?
        </h2>
        <p class="text-emerald-100 text-lg mb-10">
          Det tar bara 2 minuter att registrera dig.
        </p>
        <UButton size="xl" color="white" class="text-emerald-600 shadow-xl">
          Registrera din tid →
        </UButton>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-10 px-6 bg-gray-900">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span class="font-semibold text-white">Matchmaker</span>
          </div>
          <div class="flex gap-6 text-sm text-gray-400">
            <a href="#" class="hover:text-white transition-colors">Om oss</a>
            <a href="#" class="hover:text-white transition-colors">Kontakt</a>
            <a href="#" class="hover:text-white transition-colors">Integritetspolicy</a>
          </div>
          <div class="text-sm text-gray-500">
            © 2025
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
