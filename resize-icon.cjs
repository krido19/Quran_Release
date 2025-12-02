const Jimp = require('jimp');
const path = require('path');

const SOURCE = 'public/logo-baru.png';
const BASE_DIR = 'android/app/src/main/res';

const SIZES = {
    'mipmap-mdpi': { legacy: 48, adaptive: 108 },
    'mipmap-hdpi': { legacy: 72, adaptive: 162 },
    'mipmap-xhdpi': { legacy: 96, adaptive: 216 },
    'mipmap-xxhdpi': { legacy: 144, adaptive: 324 },
    'mipmap-xxxhdpi': { legacy: 192, adaptive: 432 }
};

async function resize() {
    try {
        console.log(`Reading ${SOURCE}...`);
        const image = await Jimp.read(SOURCE);

        for (const [folder, sizes] of Object.entries(SIZES)) {
            const dir = path.join(BASE_DIR, folder);

            // Legacy icons
            console.log(`Writing to ${folder} (Legacy: ${sizes.legacy}x${sizes.legacy})...`);
            const legacyIcon = image.clone().resize(sizes.legacy, sizes.legacy);
            await legacyIcon.writeAsync(path.join(dir, 'ic_launcher.png'));
            await legacyIcon.writeAsync(path.join(dir, 'ic_launcher_round.png'));

            // Adaptive foreground
            console.log(`Writing to ${folder} (Adaptive: ${sizes.adaptive}x${sizes.adaptive})...`);
            const adaptiveIcon = image.clone().resize(sizes.adaptive, sizes.adaptive);
            await adaptiveIcon.writeAsync(path.join(dir, 'ic_launcher_foreground.png'));
        }

        console.log('Done!');
    } catch (e) {
        console.error('Error resizing icons:', e);
    }
}

resize();
