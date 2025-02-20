import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./results.css";

const materialDensities = {
  "IS 2062 GR.B": 0.00000785,
  "SA 516 GR.60": 0.00000780,
  "SA 516 GR.65": 0.00000780,
  "SA 516 GR.70": 0.00000780,
  "SA 387 GR11 CL2": 0.00000780,
  "SA537 CL-1": 0.00000780,
  "SA 240 GR.304": 0.00000793,
  "SA 240 GR.304L": 0.00000800,
  "SA 240 GR.316": 0.00000800,
  "SA 240 GR.316L": 0.00000800,
  "SA 240 GR.317L": 0.00000790,
  "SA 240 GR.321": 0.00000800,
  "SA 240 UNS 32205": 0.000007805,
  "SA 240 UNS 31803": 0.000007805,
  "SB424 UNS NO8825": 0.00000814,
  "SA 240 UNS 32750": 0.00000780,
  "SB 127 UNS N04400": 0.00000880,
  "SB 168 UNS N06600": 0.00000847,
};

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(0.05);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  const [weights, setWeights] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [layoutData, setLayoutData] = useState({});
  const { inputs } = location.state || {};

  useEffect(() => {
    if (inputs) {
      generateLayout();
    }
  }, [inputs]);

  const generateLayout = () => {
    const { internalDia, vesselLength, plateThickness, plateWidth, plateLength, material, ratePerKg } = inputs;
    const developedLength = Math.round((internalDia + plateThickness) * Math.PI + (plateThickness <= 35 ? plateThickness : 1.5 * plateThickness));
    const numPlatesWidth = Math.ceil(vesselLength / plateWidth);
    const lastPlateWidth = vesselLength - ((numPlatesWidth - 1) * plateWidth);
    const numPlatesLength = Math.ceil(developedLength / plateLength);
    const lastPlateLength = developedLength - ((numPlatesLength - 1) * plateLength);
    const density = materialDensities[material];

    let totalPlateVolume = numPlatesWidth * plateLength * plateWidth * plateThickness;
    let usedVolume = ((numPlatesWidth - 1) * developedLength * plateWidth * plateThickness) + (lastPlateWidth * developedLength * plateThickness);
    let offcutVolume = totalPlateVolume - usedVolume;

    const totalWeight = totalPlateVolume * density;
    const usedWeight = usedVolume * density;
    const offcutWeight = offcutVolume * density;

    const totalCost = totalWeight * ratePerKg;
    const usedCost = usedWeight * ratePerKg;
    const offcutCost = offcutWeight * ratePerKg;

    setWeights({ totalWeight, totalCost, usedWeight, usedCost, offcutWeight, offcutCost });
    setLayoutData({ developedLength, numPlatesWidth, plateWidth, plateLength, lastPlateWidth, lastPlateLength });
    drawCanvas(developedLength, numPlatesWidth, plateWidth, plateLength, lastPlateWidth, lastPlateLength);
  };

  const drawCanvas = (developedLength, numPlatesWidth, plateWidth, plateLength, lastPlateWidth, lastPlateLength) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    for (let i = 0; i < numPlatesWidth; i++) {
      let yOffset = i * (plateWidth + 20 / scale);
      let currentPlateWidth = i === numPlatesWidth - 1 ? lastPlateWidth : plateWidth;

      // Draw plate border
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(100 / scale, yOffset + 50 / scale, plateLength, plateWidth);

      ctx.fillStyle = "gray";
      ctx.fillRect(100 / scale, yOffset + 50 / scale, developedLength, currentPlateWidth);

      // Draw mesh pattern in the offcut area for each plate
      const meshSize = 10 / scale;
      ctx.strokeStyle = "rgb(0, 0, 0)";
      ctx.lineWidth = 0.5;
      for (let x = 100 / scale + developedLength; x < 100 / scale + plateLength; x += meshSize) {
        ctx.beginPath();
        ctx.moveTo(x, yOffset + 50 / scale);
        ctx.lineTo(x, yOffset + 50 / scale + currentPlateWidth);
        ctx.stroke();
      }
      for (let y = yOffset + 50 / scale; y < yOffset + 50 / scale + currentPlateWidth; y += meshSize) {
        ctx.beginPath();
        ctx.moveTo(100 / scale + developedLength, y);
        ctx.lineTo(100 / scale + plateLength, y);
        ctx.stroke();
      }

      // Draw dimensions with arrows
      ctx.fillStyle = "black";
      ctx.font = `bold ${12 / scale}px Arial`;

      // Width arrow and text
      ctx.beginPath();
      ctx.moveTo(100 / scale, yOffset + currentPlateWidth / 2 + 5 / scale);
      ctx.lineTo(50 / scale, yOffset + currentPlateWidth / 2 + 5 / scale);
      ctx.stroke();
      ctx.fillText(`Width: ${Math.round(currentPlateWidth)} mm`, 50 / scale, yOffset + currentPlateWidth / 2 + 5 / scale);

      // Height arrow and text
      ctx.beginPath();
      ctx.moveTo(plateLength / 2 + 100 / scale, yOffset - 5 / scale);
      ctx.lineTo(plateLength / 2 + 100 / scale, yOffset - 20 / scale);
      ctx.stroke();
      ctx.fillText(`Height: ${Math.round(plateLength)} mm`, plateLength / 2 + 100 / scale, yOffset - 25 / scale);

      // Developed Length arrow and text
      ctx.beginPath();
      ctx.moveTo(developedLength / 2 + 100 / scale, yOffset + 20 / scale);
      ctx.lineTo(developedLength / 2 + 100 / scale, yOffset + 35 / scale);
      ctx.stroke();
      ctx.fillText(`Developed Length: ${Math.round(developedLength)} mm`, developedLength / 2 + 100 / scale, yOffset + 40 / scale);

      // Offcut arrow and text
      ctx.beginPath();
      ctx.moveTo(100 / scale + (developedLength + lastPlateLength) / 2, yOffset + currentPlateWidth / 2);
      ctx.lineTo(100 / scale + (developedLength + lastPlateLength) / 2 + 15 / scale, yOffset + currentPlateWidth / 2);
      ctx.stroke();
      ctx.fillStyle = "red";
      ctx.fillText(`Offcut: ${Math.round(plateLength - lastPlateLength)} mm`, 100 / scale + (developedLength + lastPlateLength) / 2 + 20 / scale, yOffset + currentPlateWidth / 2);
    }

    // Draw tooltip if visible
    if (tooltip.visible) {
      ctx.fillStyle = "rgb(255, 0, 0)";
      ctx.fillRect(tooltip.x / scale, tooltip.y / scale, 100 / scale, 30 / scale);
      ctx.fillStyle = "white";
      ctx.fillText(tooltip.text, tooltip.x / scale + 5 / scale, tooltip.y / scale + 20 / scale);
    }

    ctx.restore();
  };

  const handleMouseMove = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if the mouse is over a specific area and update tooltip
    const { developedLength, lastPlateLength } = layoutData;
    const offcutX = 100 + (developedLength + lastPlateLength) * scale;
    if (x >= offcutX && x <= offcutX + 150 && y >= 50 && y <= canvasRef.current.height) {
      setTooltip({ visible: true, text: "Offcut Area", x: x + 10, y: y - 20 });
    } else {
      setTooltip({ visible: false, text: "", x: 0, y: 0 });
    }

    if (isDragging) {
      setOffset({
        x: x - clickPosition.x,
        y: y - clickPosition.y,
      });
    }
  };

  const handleMouseDown = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setClickPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.01, 0.1));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.01, 0.01));
  };

  useEffect(() => {
    if (inputs) {
      const { developedLength, numPlatesWidth, plateWidth, plateLength, lastPlateWidth, lastPlateLength } = layoutData;
      drawCanvas(developedLength, numPlatesWidth, plateWidth, plateLength, lastPlateWidth, lastPlateLength);
    }
  }, [scale, tooltip, offset, layoutData]);

  return (
    <div className="container">
      <div className="results-container">
        <div className="results-output">
          <h1>Cutting Layout Results</h1>
          <p><strong>Material:</strong> {inputs?.material}</p>
          <p><strong>Total Plate Weight:</strong> {weights?.totalWeight?.toFixed(2)} kg | Cost: ₹{weights?.totalCost?.toFixed(2)}</p>
          <p><strong>Used Plate Weight:</strong> {weights?.usedWeight?.toFixed(2)} kg | Cost: ₹{weights?.usedCost?.toFixed(2)}</p>
          <p><strong>Offcut Weight:</strong> {weights?.offcutWeight?.toFixed(2)} kg | Cost: ₹{weights?.offcutCost?.toFixed(2)}</p>
          <button onClick={() => navigate("/")}>Back</button>
        </div>
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width="800"
            height="600"
            style={{ border: "1px solid black" }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          ></canvas>
          <div>
            <button onClick={handleZoomIn}>Zoom In</button>
            <button onClick={handleZoomOut}>Zoom Out</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
