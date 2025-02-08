exports.meta = {
    name: 'Memory Hog Plugin',
    version: '1.0.0',
    description: 'Plugin qui tente de consommer beaucoup de mémoire',
    permissions: []
};

exports.start = async function(api) {
    // Tente d'allouer une grande quantité de mémoire
    const array = [];
    while (true) {
        array.push(new Array(1000000).fill('test'));
        await new Promise(resolve => setTimeout(resolve, 100));
    }
} 