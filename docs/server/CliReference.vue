<script setup lang="ts">
/** One table of `REFERENCE.md`, from the data `reference.data.ts` reads out of the built server. */
import { h } from 'vue';
import { data } from './reference.data';

/** Inline code that wraps only at its spaces, never inside a flag. */
const Code = (props: { text: string }) =>
  h('code', props.text.split(' ').flatMap((word, index) => [...(index === 0 ? [] : [' ']), h('span', word)]));
Code.props = ['text'];

defineProps<{ section: 'commands' | 'daemon' | 'globals' }>();
</script>

<template>
  <table class="cli-reference" v-if="section === 'commands'">
    <thead>
      <tr><th>Command</th><th>Arguments</th><th>Summary</th><th>Options</th></tr>
    </thead>
    <tbody>
      <tr v-for="command in data.commands" :key="command.usage">
        <td><Code :text="command.usage" /></td>
        <td>
          <div v-for="argument in command.arguments" :key="argument.name">
            <Code :text="argument.name" /> {{ argument.description }}
          </div>
        </td>
        <td>{{ command.summary }}</td>
        <td>
          <div v-if="command.daemonOptions"><a href="#daemon-options">Daemon options</a></div>
          <div v-for="option in command.options" :key="option.flags[0]">
            <template v-for="flag in option.flags" :key="flag"><Code :text="flag" /> </template>
            {{ option.description }}<template v-if="option.notes.length > 0"> ({{ option.notes.join(', ') }})</template>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <table class="cli-reference" v-else-if="section === 'daemon'">
    <thead>
      <tr><th>Key</th><th>Flag</th><th>Type</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr v-for="row in data.daemon" :key="row.key ?? row.flags[0]">
        <td><Code v-if="row.key" :text="row.key" /><em v-else>flag only</em></td>
        <td>
          <template v-if="row.flags.length > 0">
            <div v-for="flag in row.flags" :key="flag"><Code :text="row.value ? `${flag} ${row.value}` : flag" /></div>
          </template>
          <em v-else>file only</em>
          <div v-if="row.env">env <Code :text="row.env" /></div>
        </td>
        <td>{{ row.type }}</td>
        <td>{{ row.description }}</td>
      </tr>
    </tbody>
  </table>

  <table class="cli-reference" v-else>
    <thead>
      <tr><th>Option</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr v-for="option in data.globals" :key="option.flags[0]">
        <td>
          <Code v-if="option.short" :text="option.short" /><template v-if="option.short">, </template>
          <template v-for="flag in option.flags" :key="flag"><Code :text="flag" /> </template>
          <div v-if="option.env">env <Code :text="option.env" /></div>
        </td>
        <td>{{ option.description }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.cli-reference {
  font-size: 14px;
  line-height: 1.5;
}

.cli-reference th,
.cli-reference td {
  padding: 6px 10px;
  vertical-align: top;
}

/* A flag and its value may go on two lines; neither breaks inside itself. */
.cli-reference td code {
  font-size: 12px;
}

.cli-reference td code > span {
  white-space: nowrap;
}

.cli-reference td:last-child {
  min-width: 11em;
}
</style>
