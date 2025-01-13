// preloadRcsImages.ts
import * as PIXI from 'pixi.js';

export async function preloadRcsImages(): Promise<
  Record<string, PIXI.Texture>
> {
  const imageFilenames = [
    '1.png',
    '2.png',
    '3.png',
    '4.png',
    '5.png',
    '6.png',
    '7.png',
    '8.png',
    '9.png',
    '10.png',
    '11.png',
    '12.png',
    '13.png',
    '14.png',
    '15.png',
    '16.png',
    '17.png',
    '18.png',
    '19.png',
    '20.png',
    '21.png',
    '22.png',
    '29.png',
    '249.png',
    '250.png',
    '251.png',
    '252.png',
    '253.png',
    '254.png',
    '255.png',
  ];

  // Create an array to hold individual load promises with error handling.
  const loadPromises = imageFilenames.map((file) => {
    const path = `/assets/rcs/${file}`;
    // Wrap each load in a promise that catches errors so you know which file failed.
    return PIXI.Assets.load(path)
      .then((texture: PIXI.Texture) => {
        console.log(`Loaded ${path}`);
        texture.source.scaleMode = 'linear';
        return texture;
      })
      .catch((error) => {
        console.error(`Error loading ${path}:`, error);
        // Optionally, you can decide to return a fallback texture or simply null.
        return null;
      });
  });

  // Wait for all promises to resolve
  const textures = await Promise.all(loadPromises);

  // Create a lookup object mapping filename to its texture
  const textureMap: Record<string, PIXI.Texture> = {};
  imageFilenames.forEach((file, index) => {
    // Log the status for each file.
    if (textures[index]) {
      textureMap[file] = textures[index]!;
    } else {
      console.warn(`Texture for file ${file} is null. Check the file path.`);
    }
  });

  console.log('All images loaded:', textureMap);

  return textureMap;
}
