// function applies grayscale to every pixel in the canvas element of the layer
// based on an example found here: https://medium.com/@xavierpenya/openlayers-3-osm-map-in-grayscale-5ced3a3ed942
function convertToGrayScale(context) {

  const imgd = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  const data = imgd.data;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    let gray = 0.2126 * red + 0.7152 * green + 0.0722 * blue; // CIE luminance weighted values for red, green and blue
    gray === 0.0 ? gray = 255.0 : gray = gray; // Show white background (instead of black) while loading new tiles
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    data[i + 3] = 255; // alpha (fully opaque)
  }

  context.putImageData(imgd,0,0);
}

export default convertToGrayScale;