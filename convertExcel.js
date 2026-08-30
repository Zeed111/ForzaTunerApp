/* eslint-env node */
const fs = require('fs');
const xlsx = require('xlsx');

// 1. Load workbook & target the stats sheet
const workbook = xlsx.readFile('./Forza Horizon 6 Car List.xlsx');
const targetSheetName = workbook.SheetNames.includes('Detailed Car List + Stats')
  ? 'Detailed Car List + Stats'
  : workbook.SheetNames[workbook.SheetNames.length - 1];

const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[targetSheetName]);
console.log(`Loaded ${rawData.length} cars from sheet "${targetSheetName}". Converting...`);

const formattedCars = rawData.map((row, index) => {
  const name = String(row['Model'] || `Car ${index + 1}`).trim();
  const brand = String(row['Make'] || 'Custom').trim();
  const year = parseInt(row['Year'], 10) || 2020;
  const carType = String(row['Type'] || '').trim();

  // 1. PI Class (e.g., "C 450" -> "C")
  const rawClass = String(row['Class'] || 'A').trim();
  const piClass = rawClass.split(' ')[0] || 'A';

  // 2. Drivetrain ("Rear" -> "RWD", "Front" -> "FWD", "All" -> "AWD")
  const rawDrive = String(row['Drivetrain'] || '').trim().toLowerCase();
  let drivetrain = 'RWD';
  if (rawDrive.includes('all') || rawDrive.includes('awd') || rawDrive.includes('4wd')) {
    drivetrain = 'AWD';
  } else if (rawDrive.includes('front') || rawDrive.includes('fwd')) {
    drivetrain = 'FWD';
  } else if (rawDrive.includes('rear') || rawDrive.includes('rwd')) {
    drivetrain = 'RWD';
  } else {
    // Fallback if cell is blank
    const combined = `${brand} ${name}`.toLowerCase();
    if (/quattro|awd|4wd|evo\b|wrx|gt-r|baja|truck|safari|rubicon/i.test(combined)) drivetrain = 'AWD';
    else if (/civic|integra|golf|fiesta|veloster/i.test(combined)) drivetrain = 'FWD';
  }

  // 3. Power (HP)
  const hp = parseInt(row['Power (HP)'], 10) || 350;

  // 4. Weight (Convert lbs -> kg)
  const weightLbs = parseFloat(row['Weight (lbs)']) || 3100;
  const weight = Math.round(weightLbs / 2.20462);

  // 5. Weight distribution front % (e.g. 0.54 -> 54.0)
  const rawBalance = parseFloat(row['Balance (F)']) || 0.52;
  const frontWeightPct = rawBalance < 1.0 ? +(rawBalance * 100).toFixed(1) : +rawBalance.toFixed(1);

  // 6. Category classification
  const combined = `${carType} ${brand} ${name}`.toLowerCase();
  let category = 'jdm';
  if (/supercar|hypercar|ferrari|lamborghini|mclaren|koenigsegg|bugatti|pagani/i.test(combined)) {
    category = 'supercar';
  } else if (/track|gt3|gte|extreme|radical|mono|valkyrie|senna|race/i.test(combined)) {
    category = 'track';
  } else if (year < 1980 || /classic|vintage|muscle|cult|rod/i.test(combined)) {
    category = 'classic';
  }

  // 7. Dynamic suspension slider limits proportional to weight
  const baseSpring = Math.round(weight * 0.35);
  const springMin = Math.max(70, Math.round(baseSpring * 0.35));
  const springMax = Math.round(baseSpring * 2.1);

  // 8. Engine Profile
  let engineType = 'balanced';
  let redlineRpm = 7500;
  if (category === 'supercar' || /vtec|s2000|type r|high-rev/i.test(combined)) {
    engineType = 'highrev';
    redlineRpm = 8500;
  } else if (/muscle|v8|truck|diesel|hemi/i.test(combined)) {
    engineType = 'torque';
    redlineRpm = 6800;
  }

  const slug = `${brand.toLowerCase()}-${name.toLowerCase()}`
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');

  return {
    id: `fh6-${slug}-${year}-${index}`,
    name,
    brand,
    year,
    piClass,
    specs: {
      category,
      drivetrain,
      hp,
      weight,
      frontWeightPct,
      tWidthF: 245,
      tProfileF: 40,
      tRimF: 18,
      tWidthR: drivetrain !== 'FWD' ? 275 : 245,
      tProfileR: drivetrain !== 'FWD' ? 35 : 40,
      tRimR: 18,
      springFrontMin: springMin,
      springFrontMax: springMax,
      springRearMin: springMin,
      springRearMax: springMax,
      heightFrontMin: category === 'supercar' ? 6.5 : 9.0,
      heightFrontMax: category === 'supercar' ? 13.0 : 18.0,
      heightRearMin: category === 'supercar' ? 6.5 : 9.0,
      heightRearMax: category === 'supercar' ? 13.0 : 18.0,
      aeroFrontMin: category === 'supercar' ? 80 : 35,
      aeroFrontMax: category === 'supercar' ? 350 : 180,
      aeroRearMin: category === 'supercar' ? 140 : 70,
      aeroRearMax: category === 'supercar' ? 600 : 320,
      redlineRpm,
      topSpeed: hp > 700 ? 350 : (hp > 400 ? 290 : 240),
      numGears: hp > 600 ? 7 : 6,
      engineType,
    },
  };
});

// Ensure directory exists & save
fs.writeFileSync('./src/data/cars.json', JSON.stringify(formattedCars, null, 2));
console.log(`\nSuccessfully converted ${formattedCars.length} cars into ./src/data/cars.json with real technical stats!`);