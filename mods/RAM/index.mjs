export const meta= {
  id: 'RAM_exercice',
  metrics: ['RAM_exercice']
};


export function start({sendMetric}){
  //Simule une métrique aléatoire
  setInterval(() => {
    const value = Math.floor(Math.random() * 100);
    sendMetric({RAM_exercice: value});
  }, 2000);
}