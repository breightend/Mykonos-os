import React, { useState, useEffect, useRef } from 'react'

// Simulate barcode generation (replace with actual library if needed)
const generateBarcode = (text) => {
  // In a real application, you'd use a library like jsbarcode,
  // but for this example, we'll just return a placeholder SVG.
  //  return `<svg><rect width="200" height="100" fill="#eee"/><text x="10" y="50">${text}</text></svg>`;

  // Placeholder SVG barcode (simple vertical lines)
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
        <style>
            .bar { fill: #000; }
            .text {
                font-size: 14px;
                text-anchor: middle;
                fill: #000;
                font-family: sans-serif;
            }
        </style>`
  const bars = [
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 3, space: 1 },
    { width: 1, space: 2 },
    { width: 1, space: 3 },
    { width: 3, space: 1 },
    { width: 1, space: 2 }, // First digit
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Second digit
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Third
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Fourth
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Fifth
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Sixth
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Seventh
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Eighth
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Ninth
    { width: 3, space: 2 },
    { width: 1, space: 3 },
    { width: 1, space: 1 },
    { width: 1, space: 3 },
    { width: 2, space: 1 },
    { width: 2, space: 2 },
    { width: 2, space: 1 }, // Tenth
    { width: 1, space: 2 },
    { width: 1, space: 2 },
    { width: 3, space: 1 },
    { width: 1, space: 3 },
    { width: 1, space: 3 },
    { width: 1, space: 3 },
    { width: 1, space: 4 } // last
  ]

  let x = 10
  let textX = 110
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    if (i == 7 || i == 49) {
      svgContent += `<rect x="${x}" y="10" width="5" height="70" class="bar" />`
      x += 5 + bar.space
    } else {
      svgContent += `<rect x="${x}" y="10" width="${bar.width}" height="70" class="bar" />`
      x += bar.width + bar.space
    }
  }
  svgContent += `<text x="${textX}" y="100" class="text">${text}</text>`
  svgContent += `</svg>`
  return svgContent
}

const BarcodeGenerator = () => {
  const [barcodeText, setBarcodeText] = useState('1234567890')
  const [barcodeSvg, setBarcodeSvg] = useState(generateBarcode('1234567890'))

  useEffect(() => {
    setBarcodeSvg(generateBarcode(barcodeText))
  }, [barcodeText])

  const handleTextChange = (e) => {
    setBarcodeText(e.target.value)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Código de barras</h2>
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={barcodeText}
          onChange={handleTextChange}
          placeholder="Ingrese el texto del barcode (10 dígitos)"
          className="input max-w-xs"
          maxLength={10}
        />
      </div>
      <div className="mb-4">
        <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
      </div>
    </div>
  )
}

export default BarcodeGenerator
