export const meta= {
  id: 'exemple',
  metrics: ['dummy']
};

export function start({sendMetric}){
  //Simule une métrique aléatoire
  setInterval(() => {
    const value = Math.floor(Math.random() * 100);
    sendMetric({dummy: value});
  }, 2000);
}