import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

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

const PlateCuttingLayout = () => {
  const [inputs, setInputs] = useState({
    internalDia: "",
    vesselLength: "",
    plateThickness: "",
    plateWidth: "",
    plateLength: "",
    material: "IS 2062 GR.B",
    ratePerKg: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: name === "material" ? value : parseFloat(value) || 0 });
  };

  const generateLayout = () => {
    const { internalDia, vesselLength, plateThickness, plateWidth, plateLength, material, ratePerKg } = inputs;

    // Check for empty fields
    if (!internalDia || !vesselLength || !plateThickness || !plateWidth || !plateLength || !ratePerKg) {
      setError("All fields must be filled out.");
      return;
    }

    setError(""); // Clear any previous errors

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

    const results = {
      totalWeight,
      totalCost,
      usedWeight,
      usedCost,
      offcutWeight,
      offcutCost,
    };

    navigate("/results", { state: { inputs, results, developedLength, numPlatesWidth, lastPlateWidth, plateWidth, plateLength, lastPlateLength } });
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1>Plate Cutting Layout</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {Object.keys(inputs).map((key) =>
          key !== "material" ? (
            <label key={key}>
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:
              <input type="number" name={key} value={inputs[key]} onChange={handleChange} />
            </label>
          ) : (
            <label key={key}>
              Material:
              <select name="material" value={inputs.material} onChange={handleChange}>
                {Object.keys(materialDensities).map((mat) => (
                  <option key={mat} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
            </label>
          )
        )}
        <button onClick={generateLayout}>Generate Layout</button>
      </div>
    </div>
  );
};

export default PlateCuttingLayout;
