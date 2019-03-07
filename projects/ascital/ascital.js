const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

function mapCoords(value, oLow, oMax, nLow, nMax) {
    return nLow + (value - oLow) / (oMax - oLow) * (nMax - nLow)
}


function renderFractal(maxIter, width, height, fillEdges = false, xMin = -2, xMax = 1, yMin = 1, yMax = -1) {
    const area = document.getElementById("fractal")

    for (let y = 0; y < height; ++y) {
        let line = document.createElement("p")

        for (let x = 0; x < width; ++x) {
            const cre = mapCoords(x, 0, width - 1, xMin, xMax)
            const cim = mapCoords(y, 0, height - 1, yMin, yMax)
            let zre = 0, zim = 0
            let iter = 0

            while (iter < maxIter && zre*zre + zim*zim < 2) {
                //compute z = z^2 + c
                const newzre = zre*zre - zim*zim
                const newzim = 2 * zre * zim

                zre = newzre + cre
                zim = newzim + cim

                ++iter
            }

            //choose which character to use for that portion
            let char = ' '

            if (iter < maxIter && (fillEdges || iter > 1)) {
                char = alphabet[iter % alphabet.length]
            }

            line.innerText += char
        }

        //add the line to the DOM
        area.appendChild(line)  
    }
}