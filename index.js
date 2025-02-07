import { loadPlugins } from './core/loader.mjs';

const plugins = await loadPlugins('./mods');
console.log('Plugins chargés:', plugins); 