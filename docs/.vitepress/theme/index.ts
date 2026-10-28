import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import HostStory from './HostStory.vue';
import './custom.css';

/** VitePress's default theme, with the ahpd brand colour, and the scroll story between the home hero and its features. */
export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-features-before': () => h(HostStory) }),
};
