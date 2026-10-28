<script setup lang="ts">
/**
 * The home page's scroll story: a notes column of stops, and a sticky stage where a desktop, a tablet and a
 * phone sit above one host. Each stop fully describes one frame of the stage; nothing carries over from the
 * stop before.
 */
import { onMounted, onUnmounted, ref } from 'vue';
import { withBase } from 'vitepress';
import { BRANDS } from './brands';

type Kind = 'desktop' | 'tablet' | 'phone';
type Lane = 'models' | 'connectors';

/** One stop of the story. */
interface Stop {
  id: string;
  /** The chapter: `a`, `b`, or `end` for the closing stop. */
  ch: 'a' | 'b' | 'end';
  /** The chapter title, on the first stop of a chapter. */
  chapter?: string;
  scene: keyof typeof SCENES;
  /** The devices drawn with an accent ring. */
  focus: Kind[];
  /** The devices whose wire carries a pulse to the host. */
  send: Kind[];
  views: Partial<Record<Kind, keyof typeof VIEWS>>;
  /** The labels on the host rail; an icon id shows its icon. */
  chips: string[];
  /** The lane nodes lit under the host. */
  lanes?: Partial<Record<Lane, string[]>>;
  /** A label above a device, naming the client on it. */
  tags?: Partial<Record<Kind, string>>;
  title: string;
  text: string;
  /** The pages that document the stop. */
  docs?: [string, string][];
  /** The closing stop's button. */
  cta?: [string, string];
}

/** The stage is a fixed 640x520 world, scaled to the column width. */
const WORLD_WIDTH = 640;
/** The top of the host rail, where every wire ends. */
const RAIL_Y = 384;
const SIZE: Record<Kind, [number, number]> = { desktop: [300, 190], tablet: [150, 200], phone: [80, 160] };
const KINDS = Object.keys(SIZE) as Kind[];
/** Each scene places the devices it shows as [x, y, scale]; a device it leaves out fades away. */
const SCENES: Record<string, Partial<Record<Kind, [number, number, number]>>> = {
  trio: { desktop: [185, 160, 1], tablet: [20, 150, 1], phone: [520, 190, 1] },
  solo: { desktop: [80, 40, 1.6] },
  phone: { desktop: [40, 190, 0.8], phone: [400, 90, 1.6] },
  pair: { desktop: [30, 190, 0.8], tablet: [340, 65, 1.4] },
};
/** How far a device slides right as it fades away. */
const AWAY_NUDGE = 48;

/** Each icon id as its name, the letter on its tile when it has no brand glyph, and the tile colour. */
const ICONS: Record<string, [string, string, string]> = {
  claude: ['Claude', 'C', '#c96442'], pi: ['pi', 'π', '#6366f1'], codex: ['Codex', 'Cx', '#10a37f'], cofold: ['cofold', 'cf', '#0e7490'],
  anthropic: ['Anthropic', 'A', '#b4532a'], openai: ['OpenAI', 'O', '#0f766e'], openrouter: ['OpenRouter', 'OR', '#4f46e5'], local: ['Local', 'L', '#475569'],
  slack: ['Slack', 'S', '#7e22ce'], github: ['GitHub', 'G', '#334155'], linear: ['Linear', 'Li', '#5e6ad2'], resend: ['Resend', 'R', '#1f2937'],
};
/** The icon ids drawn with another brand's glyph. */
const GLYPH: Record<string, string> = { codex: 'openai' };

const ico = (id: string) => {
  const brand = BRANDS[GLYPH[id] ?? id];
  return brand
    ? `<span class="ico" style="--c:${brand.hex}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${brand.path}"/></svg></span>`
    : `<span class="ico" style="--c:${ICONS[id][2]}">${ICONS[id][1]}</span>`;
};

const LANES: Record<Lane, string[]> = { models: ['anthropic', 'openai', 'openrouter', 'local'], connectors: ['slack', 'github', 'linear', 'resend'] };

const chat = (state: 'waiting' | 'approved') => `
  <div class="bar"><b>Fix the flaky login test</b><span class="r tool">${ico('claude')}Claude</span></div>
  <div class="msg me">Run the tests and fix the failure</div>
  <div class="msg">I'll run the suite first.</div>
  ${state === 'approved'
    ? `<div class="msg">2 failed in login.spec.ts. Fixing the wait.</div><div class="ask bottom"><span><code>npm test</code></span><span class="ok">✓ Approved</span></div>`
    : `<div class="ask bottom pending"><span>Run <code>npm test</code>?</span><div class="btns"><span class="btn">Deny</span><span class="btn go">Approve</span></div></div>`}`;

/** The screens a device can show, as HTML. The names and figures on them are examples. */
const VIEWS = {
  home: () => `
    <div class="bar"><b>Sessions</b><span class="r ok">● ahpd</span></div>
    <div class="sess run"><span class="dot"></span>Check dependencies</div>
    <div class="sess"><span class="dot"></span>Write release notes</div>
    <div class="sess"><span class="dot"></span>Refactor the auth module</div>
    <div class="btns" style="margin-top:auto"><span class="btn go">New session</span></div>`,
  chat: () => chat('waiting'),
  chatApproved: () => chat('approved'),
  agents: () => `
    <div class="bar"><b>New session</b><span class="r">pick an agent</span></div>
    <div class="row sel"><span class="tool">${ico('claude')}Claude</span><span>Opus · Sonnet · Haiku</span></div>
    <div class="row"><span class="tool">${ico('pi')}pi</span><span class="dim">Sonnet · GPT-5</span></div>
    <div class="row"><span class="tool">${ico('codex')}Codex</span><span class="dim">GPT-5 Codex</span></div>
    <div class="row"><span class="tool">${ico('cofold')}cofold</span><span class="dim">DeepSeek · Kimi</span></div>
    <div class="dim" style="margin-top:auto">Each agent is a plugin on the host.</div>`,
  push: () => `
    <div class="clock">14:32</div>
    <div class="notif"><b>ahpd</b><span>Claude asks to run <code>npm test</code></span><div class="btns stack"><span class="btn go">Approve</span><span class="btn">Deny</span></div></div>
    <div class="dim" style="margin-top:auto;text-align:center">over the tunnel</div>`,
  automation: () => `
    <div class="bar"><b>Automations</b><span class="r ok">1 running</span></div>
    <div class="row"><span>Check dependencies</span><span class="dim mono">0 7 * * mon-fri</span></div>
    <div class="ask"><b>Write release notes</b><span class="dim">webhook: push to main · 14:38</span><span class="ok">running · open session</span></div>
    <div class="msg">Reading commits since v0.9.0</div>
    <div class="msg">Drafting CHANGELOG.md</div>`,
  terminal: () => `
    <div class="bar"><b>Terminal</b><span class="r">computer: dev container web</span></div>
    <div class="banner">Claude's terminal · you took it over</div>
    <div class="term"><span class="dim">$</span> npm test -- login
<span class="fail">✗</span> waits for the redirect (5003 ms)
<span class="dim">$</span> npx playwright show-trace<span class="ok">▌</span></div>`,
  policy: () => `
    <div class="bar"><b>Policy</b><span class="r">who may use what</span></div>
    <div class="tbl" style="grid-template-columns: 0.9fr 0.8fr 1.6fr 0.9fr">
      <span class="h">role</span><span class="h">agents</span><span class="h">models</span><span class="h">connectors</span>
      <span>admin</span><span>all</span><span>all</span><span>all</span>
      <span class="hl">developer</span><span class="icos">${ico('claude')}${ico('pi')}</span><span>Fable, Opus, Sonnet, Haiku</span><span class="icos">${ico('github')}${ico('linear')}</span>
      <span>marketing</span><span class="icos">${ico('claude')}</span><span>Opus 5.5</span><span class="icos">${ico('slack')}${ico('resend')}</span>
      <span>guest</span><span class="icos">${ico('pi')}</span><span class="mono">deepseek-flash</span><span class="dim">none</span>
    </div>
    <div class="dim" style="margin-top:auto">ana@team · developer · token ••••3f</div>`,
  pool: () => `
    <div class="bar"><b>Pool: team</b></div>
    <div class="dim">today</div>
    <div class="big">$17.40</div>
    <div class="gauge"><i style="width:87%"></i></div>
    <div class="dim">of $20.00 a day</div>
    <div style="margin-top:auto">Resets 00:00 UTC</div>`,
  vault: () => `
    <div class="bar"><b>Vault</b><span class="r">names, never values</span></div>
    <div class="tbl" style="grid-template-columns: 1.3fr 0.7fr 1fr">
      <span class="h">secret</span><span class="h">value</span><span class="h">used by</span>
      <span class="mono hl">host:github</span><span>••••••</span><span class="tool">${ico('github')}GitHub</span>
      <span class="mono">host:slack-work</span><span>••••••</span><span class="tool">${ico('slack')}Slack</span>
      <span class="mono">host:anthropic</span><span>••••••</span><span class="tool">${ico('anthropic')}proxy</span>
      <span class="mono">host:openrouter</span><span>••••••</span><span class="tool">${ico('openrouter')}proxy</span>
    </div>
    <div class="dim" style="margin-top:auto">Saved once. Used by name.</div>`,
  vaultUse: () => `
    <div class="bar"><b>Connector · GitHub</b><span class="r tool">${ico('github')}</span></div>
    <div class="card"><span class="k">app id</span><span>184213</span></div>
    <div class="card"><span class="k">private key</span><span><span class="pill lock">🔒 host:github</span></span></div>
    <div class="dim" style="margin-top:auto">The setting names the secret. The host reads the value from the vault.</div>`,
  proxy: () => `
    <div class="bar"><b>Model proxy</b></div>
    <div class="flow">
      <div class="col">
        <span class="box tool">${ico('claude')}Claude Code</span><span class="box tool">${ico('pi')}pi</span><span class="box">your app</span>
      </div>
      <span class="arrow">→</span>
      <div class="box hl col"><b>ahpd</b><span>your token</span><span>your rules</span></div>
      <span class="arrow">→</span>
      <div class="col">
        <span class="box tool">${ico('anthropic')}Anthropic</span><span class="box tool">${ico('openrouter')}OpenRouter</span><span class="box tool">${ico('local')}Local</span>
      </div>
    </div>
    <div class="dim" style="margin-top:auto">The provider keys never leave the host.</div>`,
  connectorsList: () => `
    <div class="bar"><b>Connectors</b><span class="r">one account each</span></div>
    <div class="row sel"><span class="tool">${ico('slack')}Slack · work</span><span>vault key</span></div>
    <div class="row sel"><span class="tool">${ico('github')}GitHub · ahpd org</span><span>vault key</span></div>
    <div class="row"><span class="tool">${ico('linear')}Linear</span><span class="dim">vault key</span></div>
    <div class="row"><span class="tool">${ico('resend')}Resend</span><span class="dim">vault key</span></div>`,
  connectorsChat: () => `
    <div class="bar"><b>Release v0.9.1</b><span class="r tool">${ico('claude')}Claude</span></div>
    <div class="msg me">Open the release PR and tell #releases</div>
    <div class="msg tool">${ico('github')}github: create pull request <span class="ok">done</span></div>
    <div class="ask bottom pending"><span class="tool">${ico('slack')}slack: send message to #releases?</span><div class="btns"><span class="btn">Deny</span><span class="btn go">Approve</span></div></div>`,
  usage: () => `
    <div class="bar"><b>Usage</b><span class="r">by pool</span></div>
    <div class="tbl" style="grid-template-columns: 0.9fr 1.6fr 0.8fr 0.8fr 0.9fr; font-size: 1.1em">
      <span class="h">pool</span><span class="h">today, of the cap</span><span class="h">week</span><span class="h">month</span><span class="h">resets</span>
      <span>team</span><span class="meter"><span>$17.40 of $20</span><span class="gauge"><i style="width:87%"></i></span></span><span>$61.20</span><span>$212.90</span><span class="dim">00:00 UTC</span>
      <span>personal</span><span class="meter"><span>$2.10 of $10</span><span class="gauge"><i class="ok" style="width:21%"></i></span></span><span>$9.80</span><span>$31.00</span><span class="dim">00:00 UTC</span>
      <span>ci</span><span class="meter"><span>$0.00 of $50</span><span class="gauge"><i class="ok" style="width:1%"></i></span></span><span>$14.30</span><span>$48.75</span><span class="dim">00:00 UTC</span>
    </div>`,
  usageGlance: () => `
    <div class="bar"><b>Usage today</b></div>
    <div class="tbl" style="grid-template-columns: 1fr; row-gap: 2px">
      <span class="meter"><span class="split"><span>team</span><span>$17.40 / $20</span></span><span class="gauge"><i style="width:87%"></i></span></span>
      <span class="meter"><span class="split"><span>personal</span><span>$2.10 / $10</span></span><span class="gauge"><i class="ok" style="width:21%"></i></span></span>
      <span class="meter"><span class="split"><span>ci</span><span>$0.00 / $50</span></span><span class="gauge"><i class="ok" style="width:1%"></i></span></span>
    </div>`,
  doneDesk: () => `
    <div class="bar"><b>Fix the flaky login test</b><span class="r tool">${ico('claude')}Claude</span></div>
    <div class="msg me">Run the tests and fix the failure</div>
    <div class="msg">The login test did not wait for the redirect. I fixed the wait.</div>
    <div class="msg"><span class="ok">✓</span> <code>npm test</code>: 42 passed</div>`,
  doneTerm: () => `
    <div class="term wrap"><span class="dim">$</span> ahpc attach login-test
<b>Fix the flaky login test</b> · Claude
<span class="dim">you</span>  Run the tests and fix the failure
<span class="ok">●</span> The login test did not wait for the redirect. I fixed the wait.
<span class="ok">✓</span> npm test: 42 passed</div>`,
  donePhone: () => `
    <div class="bar"><b>Login test</b></div>
    <div class="msg">I fixed the wait.</div>
    <div class="msg"><span class="ok">✓</span> 42 passed</div>`,
};

const STOPS: Stop[] = [
  { id: 'a0', ch: 'a', chapter: 'From anywhere', scene: 'trio', focus: [], send: ['desktop', 'tablet', 'phone'],
    views: { desktop: 'home', tablet: 'home', phone: 'home' }, chips: ['connected'],
    title: 'One host, many clients', text: 'The desktop, the tablet and the phone connect to the same host, and show the same sessions.' },
  { id: 'a1', ch: 'a', scene: 'solo', focus: ['desktop'], send: ['desktop'],
    views: { desktop: 'agents' }, chips: ['claude', 'pi', 'codex', 'cofold'],
    title: 'Start at the desk', text: 'Start a session and pick the agent: Claude, pi, or Codex over ACP. Each agent is a plugin.',
    docs: [['agent-claude', '/plugins/agent-claude'], ['agent-pi', '/plugins/agent-pi'], ['agent-acp', '/plugins/agent-acp'], ['agent-cofold', '/plugins/agent-cofold']] },
  { id: 'a2', ch: 'a', scene: 'phone', focus: ['phone'], send: ['phone'],
    views: { desktop: 'chat', phone: 'push' }, chips: ['tunnel', 'push'],
    title: 'Approve from your phone', text: 'You left the desk. The phone gets a push, and you approve the tool call over the tunnel.',
    docs: [['Remote access', '/server/REMOTE'], ['push', '/plugins/push'], ['tunnel-devtunnel', '/plugins/tunnel-devtunnel']] },
  { id: 'a3', ch: 'a', scene: 'pair', focus: ['tablet'], send: ['tablet', 'desktop'],
    views: { desktop: 'chatApproved', tablet: 'automation' }, chips: ['automations', 'webhook'],
    title: 'Work starts while you are away', text: 'An automation runs with nobody watching: on a schedule, or when a webhook calls. The tablet follows the run into its session.',
    docs: [['Automations', '/sdk/AUTOMATIONS'], ['Webhooks', '/plugins/WEBHOOKS']] },
  { id: 'a4', ch: 'a', scene: 'solo', focus: ['desktop'], send: ['desktop'],
    views: { desktop: 'terminal' }, chips: ['computers'],
    title: 'Take over the terminal', text: 'Watch the agent work in its terminal from any screen. When you want to type, take it over.',
    docs: [['Terminals', '/sdk/TERMINALS'], ['Computers', '/plugins/COMPUTERS']] },
  { id: 'a5', ch: 'a', scene: 'trio', focus: [], send: ['desktop', 'tablet', 'phone'], tags: { desktop: 'desktop', tablet: 'ahpc', phone: 'ahpapp' },
    views: { desktop: 'doneDesk', tablet: 'doneTerm', phone: 'donePhone' }, chips: ['3 clients'],
    title: 'The same session everywhere', text: 'The desktop app, ahpc in a terminal and ahpapp on the phone show the same session, down to the last message.',
    docs: [['Connect a client', '/server/CONNECT']] },

  { id: 'b1', ch: 'b', chapter: 'In control', scene: 'pair', focus: ['tablet'], send: ['tablet', 'desktop'],
    views: { desktop: 'connectorsChat', tablet: 'connectorsList' }, chips: ['connectors'], lanes: { connectors: ['slack', 'github'] },
    title: 'Connect your services', text: 'A connector is one account: a Slack workspace, a GitHub App. A session binds it, and its actions become tools.',
    docs: [['activepieces', '/plugins/activepieces']] },
  { id: 'b2', ch: 'b', scene: 'solo', focus: ['desktop'], send: ['desktop'],
    views: { desktop: 'proxy' }, chips: ['proxy'], lanes: { models: ['anthropic', 'openrouter', 'local'] },
    title: 'Share models, keep the keys', text: 'Anything that talks to a model can go through ahpd. Each person signs in with their own token, the provider keys stay on the host, and you decide who may use which model.',
    docs: [['Proxy', '/server/PROXY']] },
  { id: 'b3', ch: 'b', scene: 'pair', focus: ['tablet'], send: ['tablet', 'desktop'],
    views: { desktop: 'vaultUse', tablet: 'vault' }, chips: ['vault'],
    title: 'Secrets by name', text: 'Provider and connector keys live in the vault, not in the config file. A setting names the secret, and the host reads the value when it needs it. Nobody sees it again.',
    docs: [['Vault', '/server/VAULT']] },
  { id: 'b4', ch: 'b', scene: 'solo', focus: ['desktop'], send: ['desktop'],
    views: { desktop: 'policy' }, chips: ['users', 'policy'],
    title: 'Who may use what', text: 'Each person has a token and a role. A policy says which agents, models and connectors each role may use.',
    docs: [['Users', '/server/USERS'], ['Policy', '/sdk/POLICY']] },
  { id: 'b5', ch: 'b', scene: 'trio', focus: ['phone'], send: ['desktop', 'tablet', 'phone'],
    views: { desktop: 'usage', tablet: 'usageGlance', phone: 'pool' }, chips: ['limits', 'usage'],
    title: 'A limit you can see', text: 'Every pool shows what it spent today, this week and this month. The team pool is near its daily cap, and every screen shows when it resets.',
    docs: [['Usage', '/server/USAGE']] },

  { id: 'end', ch: 'end', scene: 'trio', focus: [], send: ['desktop', 'tablet', 'phone'],
    views: { desktop: 'home', tablet: 'home', phone: 'home' }, chips: ['connected'],
    title: 'Your host, your rules', text: 'Install the daemon, connect a client, and run it for a team.', cta: ['Get started', '/server/GET-STARTED'] },
];

/** Each stop's place in its chapter, as `01 / 06`; empty for the closing stop. */
const numbers = STOPS.map((stop) => {
  if (stop.ch === 'end') return '';
  const chapter = STOPS.filter((other) => other.ch === stop.ch);
  const at = chapter.indexOf(stop) + 1;
  return `${String(at).padStart(2, '0')} / ${String(chapter.length).padStart(2, '0')}`;
});

const CHAPTERS = STOPS.filter((stop) => stop.chapter);

const active = ref(0);
const stage = ref<HTMLElement>();
const world = ref<HTMLElement>();
/** The elements of each step, device, wire and lane drop, by index. */
const steps: HTMLElement[] = [];
const devices: HTMLElement[] = [];
const wires: HTMLElement[] = [];
const downs: HTMLElement[] = [];

const jump = (id: string) => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
};

let stop = () => {};

onMounted(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lastPlace = { ...SCENES.trio } as Record<Kind, [number, number, number]>;
  const shownView: Partial<Record<Kind, string>> = {};
  let shown = -1;

  const setView = (kind: Kind, name: keyof typeof VIEWS) => {
    if (shownView[kind] === name) return;
    shownView[kind] = name;
    const screen = devices[KINDS.indexOf(kind)].querySelector('.screen')!;
    /* Every view still on the screen goes, so a fast scroll never stacks two. */
    for (const old of screen.querySelectorAll('.view')) {
      old.classList.add('out', 'leaving');
      setTimeout(() => old.remove(), reduced ? 0 : 320);
    }
    const fresh = document.createElement('div');
    fresh.className = 'view out';
    fresh.innerHTML = VIEWS[name]();
    screen.append(fresh);
    requestAnimationFrame(() => fresh.classList.remove('out'));
  };

  /** Replays a pulse's animation from the start. */
  const pulse = (element: HTMLElement, on: boolean) => {
    element.classList.remove('send');
    if (!on) return;
    void element.offsetWidth;
    element.classList.add('send');
  };

  const show = (index: number) => {
    if (index === shown) return;
    shown = index;
    active.value = index;
    const at = STOPS[index];
    const scene = SCENES[at.scene];
    KINDS.forEach((kind, k) => {
      const device = devices[k];
      const wire = wires[k];
      const place = scene[kind];
      const [width, height] = SIZE[kind];
      if (place) {
        lastPlace[kind] = place;
        const [x, y, s] = place;
        device.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
        wire.style.left = `${x + (width * s) / 2}px`;
        wire.style.top = `${y + height * s}px`;
        wire.style.height = `${RAIL_Y - (y + height * s)}px`;
        setView(kind, at.views[kind]!);
      } else {
        const [x, y, s] = lastPlace[kind];
        device.style.transform = `translate3d(${x + AWAY_NUDGE}px, ${y}px, 0) scale(${s})`;
      }
      pulse(wire, Boolean(place) && at.send.includes(kind));
    });
    (Object.keys(LANES) as Lane[]).forEach((lane, l) => pulse(downs[l], Boolean(at.lanes?.[lane]?.length)));
  };

  const fit = () => {
    /* `zoom` lays the text out at its final size; a scale transform spaces small letters unevenly. */
    world.value!.style.zoom = String(stage.value!.clientWidth / WORLD_WIDTH);
  };
  const resizes = new ResizeObserver(fit);
  resizes.observe(stage.value!);
  fit();

  /* The active stop is the last step whose top has crossed the reading line. */
  const readingLine = () => (matchMedia('(max-width: 860px)').matches
    ? stage.value!.getBoundingClientRect().bottom + 40
    : innerHeight * 0.45);
  let queued = false;
  const pick = () => {
    queued = false;
    const line = readingLine();
    let index = 0;
    steps.forEach((step, s) => { if (step.getBoundingClientRect().top <= line) index = s; });
    show(index);
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(pick);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', pick);
  pick();

  stop = () => {
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', pick);
    resizes.disconnect();
  };
});

onUnmounted(() => stop());

const at = (index: number) => STOPS[index];
const placed = (kind: Kind) => Boolean(SCENES[at(active.value).scene][kind]);
</script>

<template>
  <section class="host-story">
    <nav class="chapters" aria-label="Chapters">
      <a v-for="chapter in CHAPTERS" :key="chapter.id" :href="`#${chapter.id}`" :class="{ on: at(active).ch === chapter.ch }"
        @click.prevent="jump(chapter.id)">{{ chapter.chapter }}</a>
    </nav>

    <div class="story">
      <div class="notes">
        <template v-for="(item, index) in STOPS" :key="item.id">
          <div v-if="item.chapter" class="chapter-head">
            <div class="eyebrow">Chapter {{ item.ch === 'a' ? 1 : 2 }}</div>
            <h2>{{ item.chapter }}</h2>
          </div>
          <section :id="item.id" :ref="(el) => (steps[index] = el as HTMLElement)" class="step" :class="{ on: index === active, end: item.ch === 'end' }">
            <div v-if="numbers[index]" class="num">{{ numbers[index] }}</div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
            <div v-if="item.docs" class="docs">
              <template v-for="([label, link], d) in item.docs" :key="link">
                <template v-if="d > 0"> · </template><a :href="withBase(link)">{{ label }}</a>
              </template>
            </div>
            <a v-if="item.cta" class="cta" :href="withBase(item.cta[1])">{{ item.cta[0] }}</a>
          </section>
        </template>
      </div>

      <div class="stage-col">
        <div ref="stage" class="stage" aria-hidden="true">
          <div ref="world" class="world">
            <template v-for="(kind, k) in KINDS" :key="kind">
              <div :ref="(el) => (wires[k] = el as HTMLElement)" class="wire" :class="{ away: !placed(kind), live: at(active).focus.includes(kind) }"><span class="pulse"></span></div>
              <div :ref="(el) => (devices[k] = el as HTMLElement)" class="device" :class="[kind, { away: !placed(kind), focus: at(active).focus.includes(kind), tagged: at(active).tags?.[kind] }]"
                :style="{ '--d': `${['tablet', 'desktop', 'phone'].indexOf(kind) * 0.06}s` }">
                <span class="client-tag">{{ at(active).tags?.[kind] }}</span>
                <div class="screen"></div>
              </div>
            </template>
            <div class="rail">
              <span class="host">ahpd<small>host</small></span>
              <span class="chips">
                <span v-for="chip in at(active).chips" :key="`${active}-${chip}`" class="chip">
                  <span v-if="ICONS[chip]" v-html="ico(chip)"></span>{{ ICONS[chip]?.[0] ?? chip }}
                </span>
              </span>
            </div>
            <template v-for="(ids, lane, l) in LANES" :key="lane">
              <div :ref="(el) => (downs[l] = el as HTMLElement)" class="down" :class="{ on: at(active).lanes?.[lane]?.length }" :style="{ left: `${168 + l * 304}px` }"><span class="pulse"></span></div>
              <div class="lane" :class="{ on: at(active).lanes?.[lane] }" :style="{ left: `${20 + l * 304}px` }">
                <span v-for="id in ids" :key="id" class="node" :class="{ lit: at(active).lanes?.[lane]?.includes(id) }"><span v-html="ico(id)"></span>{{ ICONS[id][0] }}</span>
              </div>
              <div class="lane-name" :style="{ left: `${20 + l * 304}px` }">{{ lane === 'models' ? 'Models, through the proxy' : 'Connectors' }}</div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
/* Not scoped: the device screens are set as HTML, which scoped styles do not reach. */
.host-story {
  --hs-screen: #0f172a;
  --hs-screen-fg: #cbd5e0;
  --hs-screen-dim: #74839a;
  --hs-screen-accent: #4ec9b0;
  --hs-warn: #f59e0b;
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 48px;
}
.dark .host-story { --hs-screen: #0b1222; }
@media (min-width: 640px) { .host-story { padding-inline: 48px; } }
@media (min-width: 960px) { .host-story { padding-inline: 64px; } }

.host-story .chapters { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 8px 24px; }
.host-story .chapters a {
  font-size: 13px; text-decoration: none; color: var(--vp-c-text-2); padding: 4px 10px; border: 1px solid var(--vp-c-divider); border-radius: 999px;
}
.host-story .chapters a.on { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }

.host-story .story { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 48px; align-items: start; }
.host-story .notes { min-width: 0; }
.host-story .stage-col { position: sticky; top: max(calc(var(--vp-nav-height) + 24px), calc(50vh - 240px)); }

.host-story .chapter-head { padding-top: 24px; }
.host-story .chapter-head .eyebrow { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--vp-c-brand-1); font-weight: 600; }
.host-story .chapter-head h2 { margin: 4px 0 0; font-size: 30px; line-height: 1.2; font-weight: 600; border: 0; padding: 0; text-wrap: balance; }

.host-story .step { min-height: 62vh; padding-block: 28px; opacity: 0.38; transition: opacity 0.35s; scroll-margin-top: calc(var(--vp-nav-height) + 16px); }
.host-story .step.on { opacity: 1; }
.host-story .step .num { font-family: var(--vp-font-family-mono); font-size: 12px; color: var(--vp-c-text-2); }
.host-story .step h3 { margin: 4px 0 6px; font-size: 21px; line-height: 1.3; font-weight: 600; text-wrap: balance; }
.host-story .step p { margin: 0; color: var(--vp-c-text-2); max-width: 46ch; line-height: 1.6; }
.host-story .step.end h3 { font-size: 30px; }
.host-story .step .docs { margin-top: 10px; font-size: 12px; font-family: var(--vp-font-family-mono); color: var(--vp-c-text-3); }
.host-story .step .docs a { color: var(--vp-c-brand-1); text-decoration: none; }
.host-story .step .docs a:hover { text-decoration: underline; }
.host-story .step .cta {
  display: inline-block; margin-top: 18px; padding: 0 20px; line-height: 40px; border-radius: 20px; font-size: 14px; font-weight: 600;
  background: var(--vp-button-brand-bg); color: var(--vp-button-brand-text); text-decoration: none; transition: background 0.25s;
}
.host-story .step .cta:hover { background: var(--vp-button-brand-hover-bg); }
.host-story a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }

/* The stage: a fixed 640x520 world, scaled to the column width. */
.host-story .stage { position: relative; width: 100%; aspect-ratio: 640 / 520; }
/* Geometric text keeps small letters evenly spaced once a device is scaled. */
.host-story .world { position: absolute; left: 0; top: 0; width: 640px; height: 520px; text-rendering: geometricPrecision; }

.host-story .device {
  position: absolute; left: 0; top: 0; transform-origin: 0 0;
  transition: transform 0.55s cubic-bezier(.2,.7,.2,1), opacity 0.4s;
  transition-delay: var(--d, 0s);
  background: #1e293b; border-radius: 10px; padding: 6px; box-shadow: 0 10px 30px rgba(2, 6, 23, 0.25);
}
.host-story .device.desktop { width: 300px; height: 190px; border-radius: 8px; padding: 5px; }
.host-story .device.tablet { width: 150px; height: 200px; border-radius: 12px; padding: 7px; }
.host-story .device.phone { width: 80px; height: 160px; border-radius: 14px; padding: 5px; }
.host-story .device.focus { box-shadow: 0 0 0 2px var(--hs-screen-accent), 0 10px 30px rgba(2, 6, 23, 0.3); }
.host-story .device.away { opacity: 0; }

.host-story .screen {
  position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 4px;
  background: var(--hs-screen); color: var(--hs-screen-fg); font-size: 8px; line-height: 1.35;
}
.host-story .device.phone .screen { border-radius: 9px; font-size: 6px; }
.host-story .device.tablet .screen { border-radius: 6px; font-size: 7px; }
.host-story .view { position: absolute; inset: 0; padding: 7px; display: flex; flex-direction: column; gap: 4px; transition: opacity 0.3s; }
.host-story .view.out { opacity: 0; }
.host-story .view.leaving { transition-duration: 0.15s; }

.host-story .client-tag {
  position: absolute; left: 50%; bottom: calc(100% + 6px); transform: translateX(-50%); white-space: nowrap;
  font-size: 9px; font-weight: 600; color: var(--vp-c-brand-1); background: var(--vp-c-bg); border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px; padding: 1px 7px; opacity: 0; transition: opacity 0.3s;
}
.host-story .device.tagged .client-tag { opacity: 1; }

.host-story .wire { position: absolute; width: 2px; margin-left: -1px; background: var(--vp-c-divider); transition: left 0.55s cubic-bezier(.2,.7,.2,1), top 0.55s cubic-bezier(.2,.7,.2,1), height 0.55s cubic-bezier(.2,.7,.2,1), opacity 0.4s; }
.host-story .wire.away { opacity: 0; }
.host-story .wire.live { background: var(--vp-c-brand-1); }
.host-story .pulse { position: absolute; left: -2px; width: 6px; height: 6px; border-radius: 50%; background: var(--vp-c-brand-1); opacity: 0; }
.host-story .wire.send .pulse { animation: hs-up 0.9s ease-out 0.45s 1 both; }
@keyframes hs-up { 0% { top: 100%; opacity: 1; } 90% { opacity: 1; } 100% { top: -3px; opacity: 0; } }

.host-story .rail {
  position: absolute; left: 40px; top: 384px; width: 560px; height: 40px; border-radius: 8px;
  background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); display: flex; align-items: center; gap: 8px; padding: 0 12px;
}
.host-story .rail .host { font-weight: 700; font-size: 13px; color: var(--vp-c-brand-1); letter-spacing: 0.02em; }
.host-story .rail .host small { font-weight: 500; color: var(--vp-c-text-2); font-size: 10px; margin-left: 4px; letter-spacing: 0.06em; text-transform: uppercase; }
.host-story .rail .chips { display: flex; gap: 6px; margin-left: auto; flex-wrap: nowrap; }
.host-story .chip {
  display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-family: var(--vp-font-family-mono); padding: 2px 7px;
  border-radius: 999px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); animation: hs-pop 0.35s ease-out both;
}
.host-story .chip > span, .host-story .node > span { display: contents; }
@keyframes hs-pop { from { transform: translateY(4px); opacity: 0; } to { transform: none; opacity: 1; } }

/* Below the host: the model providers and the connectors it calls out to. */
.host-story .lane {
  position: absolute; top: 452px; width: 296px; height: 44px; display: flex; align-items: center; justify-content: space-around;
  padding: 0 8px; border: 1px dashed var(--vp-c-divider); border-radius: 8px; opacity: 0.45; transition: opacity 0.4s, border-color 0.4s;
}
.host-story .lane.on { opacity: 1; border-color: var(--vp-c-brand-1); }
.host-story .lane-name { position: absolute; top: 500px; width: 296px; text-align: center; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--vp-c-text-2); }
.host-story .node { display: flex; align-items: center; gap: 4px; font-size: 9px; color: var(--vp-c-text-2); transition: color 0.3s; }
.host-story .node.lit { color: var(--vp-c-text-1); font-weight: 600; }
.host-story .node.lit .ico { box-shadow: 0 0 0 2px var(--vp-c-brand-1); }
.host-story .down { position: absolute; top: 424px; height: 28px; width: 2px; margin-left: -1px; background: var(--vp-c-divider); transition: background 0.3s; }
.host-story .down.on { background: var(--vp-c-brand-1); }
.host-story .down.send .pulse { animation: hs-down 0.7s ease-in 0.5s 1 both; }
@keyframes hs-down { 0% { top: -3px; opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

/* An icon tile: the brand glyph in white on its colour, or a letter. */
.host-story .ico {
  display: inline-grid; place-items: center; flex: none; width: 16px; height: 16px; border-radius: 4px; background: var(--c);
  color: #fff; font-size: 7.5px; font-weight: 700; line-height: 1; box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
}
.host-story .ico svg { width: 10px; height: 10px; fill: #fff; }

/* Screen parts. */
.host-story .screen code, .host-story .mono, .host-story .term { font-family: var(--vp-font-family-mono); }
.host-story .screen code { font-size: inherit; background: none; padding: 0; color: inherit; }
.host-story .bar { display: flex; align-items: center; gap: 4px; color: var(--hs-screen-dim); font-size: 0.9em; border-bottom: 1px solid rgba(116,131,154,.2); padding-bottom: 3px; }
.host-story .bar b { color: var(--hs-screen-fg); font-weight: 600; }
.host-story .bar .r { margin-left: auto; }
.host-story .msg { padding: 3px 5px; border-radius: 4px; background: rgba(116,131,154,.16); max-width: 88%; }
.host-story .msg.me { align-self: flex-end; background: rgba(78,201,176,.2); }
.host-story .ask { border: 1px solid var(--hs-screen-accent); border-radius: 4px; padding: 4px 5px; display: flex; flex-direction: column; gap: 3px; }
.host-story .ask.bottom { margin-top: auto; }
.host-story .ask.pending { border-color: var(--hs-warn); }
.host-story .ask.pending .btn.go, .host-story .notif .btn.go { background: var(--hs-warn); color: #241500; }
.host-story .btns { display: flex; gap: 4px; justify-content: flex-end; }
.host-story .btns.stack { flex-direction: column; }
.host-story .btns.stack .btn { text-align: center; padding-block: 2px; }
.host-story .btn { padding: 1px 6px; border-radius: 3px; background: rgba(116,131,154,.25); }
.host-story .btn.go { background: var(--hs-screen-accent); color: #04211c; font-weight: 600; }
.host-story .tbl { display: grid; column-gap: 6px; align-items: center; }
.host-story .tbl > span { padding: 3px 0; border-bottom: 1px solid rgba(116,131,154,.12); min-width: 0; }
.host-story .tbl .h { color: var(--hs-screen-dim); font-size: 0.9em; }
.host-story .tbl .hl { color: var(--hs-screen-accent); }
.host-story .icos { display: flex; gap: 2px; align-items: center; flex-wrap: wrap; }
.host-story .pill { display: inline-block; padding: 0 4px; border-radius: 3px; background: rgba(116,131,154,.22); font-size: 0.92em; }
.host-story .pill.lock { background: rgba(78,201,176,.16); color: var(--hs-screen-accent); }
.host-story .meter { display: flex; flex-direction: column; gap: 2px; }
.host-story .meter .gauge { height: 4px; }
.host-story .split { display: flex; justify-content: space-between; }
.host-story .card { border: 1px solid rgba(116,131,154,.3); border-radius: 4px; padding: 4px 6px; display: flex; flex-direction: column; gap: 3px; }
.host-story .card .k { color: var(--hs-screen-dim); font-size: 0.9em; }
.host-story .sess { display: flex; align-items: center; gap: 5px; padding: 2px 0; border-bottom: 1px solid rgba(116,131,154,.12); }
.host-story .sess .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--hs-screen-dim); flex: none; }
.host-story .sess.run .dot { background: var(--hs-screen-accent); box-shadow: 0 0 0 2px rgba(78,201,176,.25); }
.host-story .sess:not(.run) { color: var(--hs-screen-dim); }
.host-story .tool { display: flex; align-items: center; gap: 4px; }
.host-story .row .tool { gap: 5px; }
.host-story .ok { color: var(--hs-screen-accent); }
.host-story .fail { color: #f87171; }
.host-story .dim { color: var(--hs-screen-dim); }
.host-story .row { display: flex; justify-content: space-between; gap: 6px; padding: 2px 0; border-bottom: 1px solid rgba(116,131,154,.12); }
.host-story .row.sel { color: var(--hs-screen-accent); }
.host-story .term { white-space: pre; font-size: 0.92em; line-height: 1.45; }
.host-story .term.wrap { white-space: pre-wrap; }
.host-story .banner { background: rgba(245,158,11,.18); color: #fbbf24; border-radius: 3px; padding: 2px 5px; }
.host-story .gauge { height: 6px; border-radius: 3px; background: rgba(116,131,154,.25); overflow: hidden; }
.host-story .gauge i { display: block; height: 100%; background: var(--hs-warn); }
.host-story .gauge i.ok { background: var(--hs-screen-accent); }
.host-story .big { font-size: 2em; font-weight: 700; line-height: 1.1; }
.host-story .flow { display: flex; align-items: stretch; justify-content: space-between; gap: 4px; margin-block: 6px; }
.host-story .flow .col { display: flex; flex-direction: column; justify-content: center; gap: 3px; }
.host-story .box { border: 1px solid rgba(116,131,154,.4); border-radius: 4px; padding: 4px 6px; text-align: center; }
.host-story .box.hl { border-color: var(--hs-screen-accent); color: var(--hs-screen-accent); }
.host-story .arrow { color: var(--hs-screen-dim); align-self: center; }
.host-story .clock { text-align: center; font-size: 2.4em; font-weight: 300; margin-top: 6px; }
.host-story .notif { background: rgba(116,131,154,.22); border-radius: 6px; padding: 5px; display: flex; flex-direction: column; gap: 3px; }

@media (max-width: 860px) {
  .host-story .story { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .host-story .stage-col {
    order: -1; top: var(--vp-nav-height); z-index: 2; background: var(--vp-c-bg); padding-block: 8px; border-bottom: 1px solid var(--vp-c-divider);
  }
  .host-story .step { min-height: 52vh; }
}
@media (prefers-reduced-motion: reduce) {
  .host-story .device, .host-story .wire, .host-story .view, .host-story .step,
  .host-story .lane, .host-story .node, .host-story .down { transition: none; }
  .host-story .pulse, .host-story .chip { animation: none !important; }
}
</style>
