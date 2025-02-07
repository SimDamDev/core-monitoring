 import { loadPlugins } from './core/loader.mjs';

 async function main(){
    console.log('🔍 Chargement des plugins...');
    const plugins = await loadPlugins();

    if (plugins.length === 0) {  
        console.log('🤷 Aucun plugin trouvé ! Créez un dossier dans mods/');  
        return;  
      } 

      console.log(`✅ ${plugins.length} plugins chargés :`); 
      plugins.forEach((plugin) => {
        console.log(`- ${plugin.code.meta.id} v${plugin.config}`);

        //Demarrer le plugin
        plugin.code.start({
            sendMetric: (data) => console.log('[METRIQUE]', data),
        });
      });
 }

 main().catch(console.error);
