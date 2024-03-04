var digitCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~" ;

function decode83(str) {
    var value = 0;
    for(var i = 0; i < str.length; i++)
        value = value * 83 + digitCharacters.indexOf(str[i]);
    return value;
};

function sRGBToLinear(value) {
    let v = value / 255;
    if (v <= 0.04045)
        return v / 12.92;
    else
        return Math.pow((v + 0.055) / 1.055, 2.4);
};

function linearTosRGB(value) {
    let v = Math.max(0, Math.min(1, value));
    if (v <= 0.0031308)
        return Math.trunc(v * 12.92 * 255 + 0.5);
    else
        return Math.trunc((1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5);
};

function signPow(val, exp) {
    return (val < 0 ? -1 : 1) * Math.pow(Math.abs(val), exp);
}

function validateBlurhash(blurhash) {
    if (!blurhash || blurhash.length < 6)
        throw new Error("The blurhash string must be at least 6 characters");

    var sizeFlag = decode83(blurhash[0]);
    var numY = Math.floor(sizeFlag / 9) + 1;
    var numX = (sizeFlag % 9) + 1;

    if (blurhash.length != 4 + 2 * numX * numY)
        throw new Error(`blurhash length mismatch: length is ${blurhash.length} but it should be ${4 + 2 * numX * numY}`);
};

function isBlurhashValid(blurhash) {
    try {
        validateBlurhash(blurhash);
    } catch (error) {
        return { result: false, errorReason: error.message };
    }

    return { result: true };
};

function decodeDC(value) {
    return [sRGBToLinear(value >> 16), sRGBToLinear((value >> 8) & 255), sRGBToLinear(value & 255)];
}

function decodeAC(value, maximumValue) {
    return [
        signPow((Math.floor(value / (19 * 19)) - 9) / 9, 2.0) * maximumValue,
        signPow((Math.floor(value / 19) % 19 - 9) / 9, 2.0) * maximumValue,
        signPow((value % 19 - 9) / 9, 2.0) * maximumValue,
    ];
}

function decodeBlurhash(blurhash, width, height, punch = 1) {
    validateBlurhash(blurhash);

    var sizeFlag = decode83(blurhash[0]);
    var numY = Math.floor(sizeFlag / 9) + 1;
    var numX = (sizeFlag % 9) + 1;

    var quantisedMaximumValue = decode83(blurhash[1]);
    var maximumValue = (quantisedMaximumValue + 1) / 166;

    var colors = new Array(numX * numY);

    for (var i = 0; i < colors.length; i++) {
        if (i == 0)
            colors[i] = decodeDC(decode83(blurhash.substring(2, 6)));
        else
            colors[i] = decodeAC(decode83(blurhash.substring(4 + i * 2, 6 + i * 2)), maximumValue * punch);
    }

    var bytesPerRow = width * 4;
    var pixels = new Uint8ClampedArray(bytesPerRow * height);

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var r = 0;
            var g = 0;
            var b = 0;

            for (var j = 0; j < numY; j++) {
                var basisY = Math.cos((Math.PI * y * j) / height);
                for (var i = 0; i < numX; i++) {
                    var basis = Math.cos((Math.PI * x * i) / width) * basisY;
                    var color = colors[i + j * numX];
                    r += color[0] * basis;
                    g += color[1] * basis;
                    b += color[2] * basis;
                }
            }

            var intR = linearTosRGB(r);
            var intG = linearTosRGB(g);
            var intB = linearTosRGB(b);

            pixels[4 * x + 0 + y * bytesPerRow] = intR;
            pixels[4 * x + 1 + y * bytesPerRow] = intG;
            pixels[4 * x + 2 + y * bytesPerRow] = intB;
            pixels[4 * x + 3 + y * bytesPerRow] = 255; // alpha
        }
    }
    return pixels;
}

function blurhashToURL(blurhash, width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width || screen.width;
    canvas.height = height || screen.height;
    var ctx = canvas.getContext("2d");
    var imageData = ctx.createImageData(canvas.width, canvas.height);
    imageData.data.set(decodeBlurhash(blurhash, width, height));
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

function getMainColor(blurhash) {
    return "#" + decode83(blurhash.substring(2, 6)).toString(16);
}
