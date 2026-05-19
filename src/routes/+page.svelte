<script>
  let inputText = $state('');
  let cards = $state([]);
  let loading = $state(false);
  let generating = $state(false);
  let analyzing = $state(false);
  let error = $state('');
  let output = $state('');
  let outputFormat = $state('');
  let editingIndex = $state(-1);
  let toneData = $state(null);
  let selectedMetric = $state('style');
  let analyzeTimer = null;

  async function decompose() {
    if (!inputText.trim()) return;
    loading = true;
    error = '';
    output = '';
    cards = [];
    toneData = null;
    try {
      const res = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      cards = await res.json();
    } catch (e) {
      error = 'Something went wrong. Please try again.';
    }
    loading = false;
  }

  async function generateOutput(format) {
    if (cards.length === 0) return;
    generating = true;
    outputFormat = format;
    output = '';
    toneData = null;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, format })
      });
      const data = await res.json();
      output = data.text;
      analyzeOutput(output);
    } catch (e) {
      error = 'Generation failed. Please try again.';
    }
    generating = false;
  }

  async function analyzeOutput(text) {
    if (!text.trim()) return;
    analyzing = true;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      toneData = await res.json();
    } catch (e) {}
    analyzing = false;
  }

  function onOutputInput(e) {
    output = e.target.value;
    clearTimeout(analyzeTimer);
    analyzeTimer = setTimeout(() => analyzeOutput(output), 1200);
  }

  const typeConfig = {
    priority: {
      label: 'Priority', emoji: '🎯',
      bg: 'bg-[#f5efe6]', border: 'border-[#e8d5b7]', tag: 'bg-[#e8d5b7] text-[#8b6914]',
      color: '#e8d5b7'
    },
    summary: {
      label: 'Summary', emoji: '📋',
      bg: 'bg-[#eef2f7]', border: 'border-[#c8d8e8]', tag: 'bg-[#c8d8e8] text-[#2d5a8e]',
      color: '#c8d8e8'
    },
    reflection: {
      label: 'Reflection', emoji: '💭',
      bg: 'bg-[#eef7f0]', border: 'border-[#b8dfc0]', tag: 'bg-[#b8dfc0] text-[#2d6e3e]',
      color: '#b8dfc0'
    }
  };

  const formatLabels = {
    report: 'Professional Report',
    journal: 'Reflective Journal',
    update: 'Concise Update'
  };

  const metrics = [
    { id: 'style', label: '✍️ Writing Style' },
    { id: 'mood', label: '🎨 Author Mood' },
    { id: 'distribution', label: '📊 Card Distribution' },
  ];

  const styleLabels = {
    academic: 'Academic',
    formal: 'Formal',
    casual: 'Casual',
    humorous: 'Humorous',
    poetic: 'Poetic',
    persuasive: 'Persuasive',
    narrative: 'Narrative'
  };

  const styleColors = {
    academic: '#c8d8e8',
    formal: '#b8dfc0',
    casual: '#f5ddb7',
    humorous: '#f5c6c6',
    poetic: '#d4c8e8',
    persuasive: '#c8e8e0',
    narrative: '#e8d5b7'
  };

  const moodLabels = {
    happy: 'Happy 😊',
    anxious: 'Anxious 😰',
    sad: 'Sad 😔',
    angry: 'Angry 😤',
    excited: 'Excited 🤩',
    bored: 'Bored 😐',
    calm: 'Calm 😌',
    nostalgic: 'Nostalgic 🌙'
  };

  const moodColors = {
    happy: '#f5e6a0',
    anxious: '#f5c6c6',
    sad: '#c8d8e8',
    angry: '#f5b8b8',
    excited: '#f5ddb7',
    bored: '#d8d8d8',
    calm: '#b8dfc0',
    nostalgic: '#d4c8e8'
  };

  function getDistribution() {
    if (cards.length === 0) return [];
    const counts = {};
    for (const c of cards) counts[c.type] = (counts[c.type] || 0) + 1;
    const total = cards.length;
    return Object.entries(counts).map(([type, count]) => ({
      type, count,
      pct: Math.round((count / total) * 100),
      cfg: typeConfig[type] ?? { label: type, color: '#e8e0d6' }
    }));
  }

  function getConicGradient() {
    const dist = getDistribution();
    let acc = 0;
    return `conic-gradient(${dist.map(d => {
      const part = `${d.cfg.color} ${acc}% ${acc + d.pct}%`;
      acc += d.pct;
      return part;
    }).join(', ')})`;
  }
</script>

<div class="h-screen bg-[#f7f4f0] font-sans flex flex-col overflow-hidden">

  <!-- Top bar -->
  <div class="border-b border-[#e8e0d6] bg-[#f7f4f0] px-8 py-4 flex items-center justify-between shrink-0">
    <span class="text-sm font-semibold tracking-widest text-[#a89880] uppercase">Writing Decomposer</span>
    <span class="text-xs text-[#c4b8a8]">AI-assisted writing tool</span>
  </div>

  <div class="flex flex-1 overflow-hidden">

    <!-- LEFT COLUMN -->
    <div class="w-[40%] border-r border-[#3d3020] flex flex-col p-8 overflow-y-auto bg-[#2c2418]">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white leading-tight mb-3">
          Turn raw thoughts<br/>into structured writing.
        </h1>
        <p class="text-[#a89880] text-sm leading-relaxed">
          Paste your notes or journal. AI breaks it into cards — then generates whatever you need.
        </p>
      </div>

      <div class="bg-white rounded-3xl border border-[#e8e0d6] shadow-sm p-5 flex flex-col flex-1">
        <label class="block text-xs font-semibold tracking-widest text-[#a89880] uppercase mb-3">Your Notes</label>
        <textarea
          bind:value={inputText}
          placeholder="Today I had two meetings. Need to finish the prototype by Friday. Feeling a bit overwhelmed but also excited..."
          class="flex-1 resize-none text-[#2c2418] text-sm leading-relaxed outline-none placeholder-[#c4b8a8] bg-transparent"
        ></textarea>
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-[#f0ebe4]">
          <span class="text-xs text-[#c4b8a8]">{inputText.length} characters</span>
          <button
            onclick={decompose}
            disabled={loading}
            class="bg-[#2c2418] text-[#f7f4f0] px-6 py-2.5 rounded-2xl text-sm font-semibold hover:bg-[#3d3020] disabled:opacity-40 transition-all"
          >
            {loading ? 'Analyzing...' : 'Decompose →'}
          </button>
        </div>
      </div>

      {#if error}
        <p class="text-red-400 text-xs mt-3">{error}</p>
      {/if}
    </div>

    <!-- RIGHT COLUMN -->
    <div class="w-[60%] flex flex-col p-8 overflow-y-auto gap-6 bg-[#f7f4f0]">

      <!-- STRUCTURED CARDS -->
      <div class="bg-white rounded-3xl border border-[#e8e0d6] shadow-sm p-6">
        <p class="text-xs font-semibold tracking-widest text-[#a89880] uppercase mb-4">Structured Cards</p>

        {#if cards.length === 0 && !loading}
          <div class="flex flex-col items-center justify-center h-28 text-center">
            <p class="text-2xl mb-2">✦</p>
            <p class="text-[#c4b8a8] text-sm">Cards will appear here after you decompose your notes.</p>
          </div>
        {:else if loading}
          <div class="flex items-center gap-2 text-[#a89880] text-sm py-6 justify-center">
            <div class="w-4 h-4 border-2 border-[#a89880] border-t-transparent rounded-full animate-spin"></div>
            Analyzing your notes...
          </div>
        {:else}
          <div class="grid grid-cols-3 gap-3 mb-4">
            {#each cards as card, i}
              {@const cfg = typeConfig[card.type] ?? { label: card.type, emoji: '📝', bg: 'bg-white', border: 'border-[#e8e0d6]', tag: 'bg-[#e8e0d6] text-[#6b5c4e]' }}
              <div class="rounded-2xl border {cfg.bg} {cfg.border} p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full {cfg.tag} text-xs font-semibold">
                    {cfg.emoji} {cfg.label}
                  </div>
                  {#if cards.length > 1}
                    <button
                      onclick={() => cards = cards.filter((_, idx) => idx !== i)}
                      class="text-[#c4b8a8] hover:text-red-400 text-xs transition-colors"
                    >✕</button>
                  {/if}
                </div>
                {#if editingIndex === i}
                  <textarea
                    bind:value={card.content}
                    class="w-full text-[#2c2418] text-xs leading-relaxed bg-transparent outline-none resize-none"
                    rows="4"
                    onblur={() => editingIndex = -1}
                  ></textarea>
                {:else}
                  <p
                    class="text-[#4a3f32] text-xs leading-relaxed cursor-text"
                    onclick={() => editingIndex = i}
                  >{card.content}</p>
                  <p class="text-[#c4b8a8] text-xs mt-1">click to edit</p>
                {/if}
              </div>
            {/each}
          </div>

          <div class="flex items-center gap-2 flex-wrap pt-3 border-t border-[#f0ebe4]">
            <span class="text-xs text-[#a89880]">Add card:</span>
            {#each [['priority','🎯','Priority'], ['summary','📋','Summary'], ['reflection','💭','Reflection']] as [type, emoji, label]}
              <button
                onclick={() => cards = [...cards, { type, content: 'New card — click to edit.' }]}
                class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#e8e0d6] bg-[#f7f4f0] text-[#4a3f32] hover:border-[#c4b8a8] transition-all"
              >
                + {emoji} {label}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- GENERATE OUTPUT -->
      <div class="bg-white rounded-3xl border border-[#e8e0d6] shadow-sm p-6">
        <p class="text-xs font-semibold tracking-widest text-[#a89880] uppercase mb-4">Generate Output</p>

        {#if cards.length === 0}
          <div class="flex flex-col items-center justify-center h-16 text-center">
            <p class="text-[#c4b8a8] text-sm">Decompose your notes first to unlock output generation.</p>
          </div>
        {:else}
          <div class="flex flex-wrap gap-2 mb-4">
            {#each [['report','📄','Professional Report'], ['journal','📓','Reflective Journal'], ['update','💬','Concise Update']] as [fmt, emoji, label]}
              <button
                onclick={() => generateOutput(fmt)}
                disabled={generating}
                class="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-medium border transition-all
                  {outputFormat === fmt
                    ? 'bg-[#2c2418] text-[#f7f4f0] border-[#2c2418]'
                    : 'bg-[#f7f4f0] text-[#4a3f32] border-[#e8e0d6] hover:border-[#c4b8a8]'}
                  disabled:opacity-40"
              >
                {emoji} {label}
              </button>
            {/each}
          </div>

          {#if generating}
            <div class="flex items-center gap-2 text-[#a89880] text-sm py-2">
              <div class="w-4 h-4 border-2 border-[#a89880] border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </div>
          {:else if output}
            <div class="bg-[#f7f4f0] rounded-2xl p-4">
              <p class="text-xs font-semibold tracking-widest text-[#a89880] uppercase mb-2">{formatLabels[outputFormat]}</p>
              <textarea
                value={output}
                oninput={onOutputInput}
                class="w-full text-[#2c2418] text-sm leading-relaxed bg-transparent outline-none resize-none"
                rows="8"
              ></textarea>
            </div>
          {/if}
        {/if}
      </div>

      <!-- COMMUNICATION PATTERNS -->
      {#if output}
        <div class="bg-white rounded-3xl border border-[#e8e0d6] shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-xs font-semibold tracking-widest text-[#a89880] uppercase">Communication Patterns</p>
            {#if analyzing}
              <div class="flex items-center gap-1.5 text-[#a89880] text-xs">
                <div class="w-3 h-3 border-2 border-[#a89880] border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </div>
            {/if}
          </div>

          <div class="flex gap-6">

            <!-- Visualization -->
            <div class="flex-1 flex items-center justify-center min-h-[160px]">

              {#if !toneData && !analyzing}
                <p class="text-[#c4b8a8] text-sm">Analyzing your output...</p>

              {:else if selectedMetric === 'style' && toneData?.style}
                <div class="w-full flex flex-col gap-2">
                  {#each Object.entries(toneData.style) as [key, val]}
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-[#a89880] w-20 shrink-0">{styleLabels[key] ?? key}</span>
                      <div class="flex-1 bg-[#f0ebe4] rounded-full h-2.5">
                        <div class="h-2.5 rounded-full transition-all duration-500" style="width:{val}%; background:{styleColors[key] ?? '#c4b8a8'}"></div>
                      </div>
                      <span class="text-xs text-[#c4b8a8] w-6 text-right">{val}</span>
                    </div>
                  {/each}
                </div>

              {:else if selectedMetric === 'mood' && toneData?.mood}
                <div class="w-full flex flex-col gap-2">
                  {#each Object.entries(toneData.mood) as [key, val]}
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-[#a89880] w-24 shrink-0">{moodLabels[key] ?? key}</span>
                      <div class="flex-1 bg-[#f0ebe4] rounded-full h-2.5">
                        <div class="h-2.5 rounded-full transition-all duration-500" style="width:{val}%; background:{moodColors[key] ?? '#c4b8a8'}"></div>
                      </div>
                      <span class="text-xs text-[#c4b8a8] w-6 text-right">{val}</span>
                    </div>
                  {/each}
                </div>

              {:else if selectedMetric === 'distribution'}
                <div class="flex items-center gap-6">
                  <div class="w-24 h-24 rounded-full shrink-0" style="background: {getConicGradient()}"></div>
                  <div class="flex flex-col gap-1.5">
                    {#each getDistribution() as d}
                      <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full shrink-0" style="background:{d.cfg.color}"></div>
                        <span class="text-xs text-[#4a3f32]">{d.cfg.label} — {d.pct}%</span>
                      </div>
                    {/each}
                  </div>
                </div>

              {:else}
                <p class="text-[#c4b8a8] text-sm">Loading...</p>
              {/if}
            </div>

            <!-- Metric selector -->
            <div class="flex flex-col gap-2 shrink-0 justify-center">
              {#each metrics as m}
                <button
                  onclick={() => selectedMetric = m.id}
                  class="text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all
                    {selectedMetric === m.id
                      ? 'bg-[#2c2418] text-[#f7f4f0] border-[#2c2418]'
                      : 'bg-[#f7f4f0] text-[#4a3f32] border-[#e8e0d6] hover:border-[#c4b8a8]'}"
                >
                  {m.label}
                </button>
              {/each}
            </div>

          </div>
        </div>
      {/if}

    </div>
  </div>
</div>