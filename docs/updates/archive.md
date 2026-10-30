# All releases

Every ahpd release, by year. Each page holds a minor release and its patch releases.

<script setup>
import { data } from './releases.data';

const years = [...new Set(data.map((release) => release.date.slice(0, 4)))]
  .map((year) => ({ year, releases: data.filter((release) => release.date.startsWith(year)) }));
</script>

<template v-for="group in years" :key="group.year">
<h2 :id="group.year" tabindex="-1">{{ group.year }} <a class="header-anchor" :href="`#${group.year}`" aria-hidden="true"></a></h2>
<ul>
<li v-for="release in group.releases" :key="release.version"><a :href="`.${release.link.slice('/updates'.length)}`">ahpd {{ release.version }}</a></li>
</ul>
</template>
