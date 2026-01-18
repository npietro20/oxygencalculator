// Conversion factors for gas oxygen tanks (L/PSI)
const TANK_CONVERSION_FACTORS = {
    'D': 0.16,  // D cylinder: 0.16 L/PSI
    'E': 0.28,  // E cylinder: 0.28 L/PSI
    'M': 1.56,  // M cylinder: 1.56 L/PSI
    'H': 3.14   // H cylinder: 3.14 L/PSI
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Oxygen type selector
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            switchOxygenType(type);
        });
    });

    // Tank size selector
    const tankSizeSelect = document.getElementById('tank-size');
    tankSizeSelect.addEventListener('change', function() {
        const tankSize = this.value;
        if (tankSize && TANK_CONVERSION_FACTORS[tankSize]) {
            document.getElementById('conversion-factor').value = TANK_CONVERSION_FACTORS[tankSize];
        } else {
            document.getElementById('conversion-factor').value = '';
        }
    });

    // Transport duration input - calculate recommended tanks
    const transportDurationInput = document.getElementById('transport-duration');
    transportDurationInput.addEventListener('input', function() {
        calculateRecommendedTanks();
    });

});

function switchOxygenType(type) {
    const gasForm = document.getElementById('gas-form');
    const liquidForm = document.getElementById('liquid-form');
    const typeButtons = document.querySelectorAll('.type-btn');

    typeButtons.forEach(btn => {
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (type === 'gas') {
        gasForm.classList.add('active');
        gasForm.style.display = 'block';
        liquidForm.classList.remove('active');
        liquidForm.style.display = 'none';
    } else {
        gasForm.classList.remove('active');
        gasForm.style.display = 'none';
        liquidForm.classList.add('active');
        liquidForm.style.display = 'block';
    }

    // Hide results when switching
    document.getElementById('gas-result').style.display = 'none';
    document.getElementById('liquid-result').style.display = 'none';
}

function calculateGasOxygen() {
    const tankSize = document.getElementById('tank-size').value;
    const psi = parseFloat(document.getElementById('psi').value);
    const safetyResidual = parseFloat(document.getElementById('safety-residual').value) || 0;
    const flowRate = parseFloat(document.getElementById('flow-rate').value);
    const fio2 = parseFloat(document.getElementById('fio2').value);

    // Validation
    if (!tankSize) {
        alert('Please select a tank size');
        return;
    }

    if (!psi || psi <= 0 || !Number.isInteger(psi)) {
        alert('Please enter a valid whole number PSI value');
        return;
    }

    if (safetyResidual < 0 || (safetyResidual > 0 && !Number.isInteger(safetyResidual))) {
        alert('Safety residual must be a whole number and cannot be negative');
        return;
    }

    if (safetyResidual >= psi) {
        alert('Safety residual cannot be greater than or equal to total PSI');
        return;
    }

    if (!flowRate || flowRate <= 0 || !Number.isInteger(flowRate)) {
        alert('Please enter a valid whole number flow rate');
        return;
    }

    if (!fio2 || fio2 < 21 || fio2 > 100 || !Number.isInteger(fio2)) {
        alert('Please enter a valid whole number FiO2 percentage (between 21% and 100%)');
        return;
    }

    // Convert FiO2 percentage to decimal (e.g., 21% -> 0.21)
    const fio2Decimal = fio2 / 100;

    // Calculate duration: (conversion factor * (PSI - Safety Residual)) / (Flow * FiO2)
    const conversionFactor = TANK_CONVERSION_FACTORS[tankSize];
    const usablePSI = psi - safetyResidual;
    const totalLiters = conversionFactor * usablePSI;
    const durationMinutes = totalLiters / (flowRate * fio2Decimal);

    // Display result
    displayGasResult(durationMinutes);
}

function calculateLiquidOxygen() {
    const litersRemaining = parseFloat(document.getElementById('liters-remaining').value);
    const flowRate = parseFloat(document.getElementById('liquid-flow-rate').value);
    const fio2 = parseFloat(document.getElementById('liquid-fio2').value);

    // Validation
    if (!litersRemaining || litersRemaining <= 0 || !Number.isInteger(litersRemaining)) {
        alert('Please enter a valid whole number liters remaining value');
        return;
    }

    if (!flowRate || flowRate <= 0 || !Number.isInteger(flowRate)) {
        alert('Please enter a valid whole number flow rate');
        return;
    }

    if (!fio2 || fio2 < 21 || fio2 > 100 || !Number.isInteger(fio2)) {
        alert('Please enter a valid whole number FiO2 percentage (between 21% and 100%)');
        return;
    }

    // Convert FiO2 percentage to decimal (e.g., 21% -> 0.21)
    const fio2Decimal = fio2 / 100;

    // Calculate duration: (Liters × 860) / (LPM × FiO2)
    const durationMinutes = (litersRemaining * 860) / (flowRate * fio2Decimal);

    // Display result
    displayLiquidResult(durationMinutes);
}

function displayGasResult(durationMinutes) {
    const resultContainer = document.getElementById('gas-result');
    const durationElement = document.getElementById('gas-duration');
    
    const formattedDuration = formatDuration(durationMinutes);
    durationElement.textContent = formattedDuration;
    
    resultContainer.style.display = 'block';
    
    // Store tank duration for transport calculation
    window.tankDurationMinutes = durationMinutes;
    
    // Calculate recommended tanks if transport duration is set
    calculateRecommendedTanks();
}

function displayLiquidResult(durationMinutes) {
    const resultContainer = document.getElementById('liquid-result');
    const durationElement = document.getElementById('liquid-duration');
    
    const formattedDuration = formatDuration(durationMinutes);
    durationElement.textContent = formattedDuration;
    
    resultContainer.style.display = 'block';
    
    // Store tank duration for transport calculation
    window.tankDurationMinutes = durationMinutes;
    
    // Calculate recommended tanks if transport duration is set
    calculateRecommendedTanks();
}

function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes.toFixed(1)} minutes`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.floor(minutes % 60);
        if (remainingMinutes === 0) {
            return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        } else {
            return `${hours}h ${remainingMinutes}m`;
        }
    }
}

function toggleMinuteVolumeCalculator() {
    const content = document.getElementById('mv-calc-content');
    const icon = document.getElementById('mv-calc-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

function toggleSafetyResidual() {
    const content = document.getElementById('safety-residual-content');
    const icon = document.getElementById('safety-residual-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

function calculateMinuteVolume() {
    const respiratoryRate = parseFloat(document.getElementById('respiratory-rate').value);
    const tidalVolume = parseFloat(document.getElementById('tidal-volume').value);

    // Validation
    if (!respiratoryRate || respiratoryRate <= 0 || !Number.isInteger(respiratoryRate)) {
        alert('Please enter a valid whole number respiratory rate');
        return;
    }

    if (!tidalVolume || tidalVolume <= 0 || !Number.isInteger(tidalVolume)) {
        alert('Please enter a valid whole number tidal volume');
        return;
    }

    // Calculate minute volume: Respiratory Rate × Tidal Volume (convert mL to L)
    // Tidal volume is entered in mL, so divide by 1000 to convert to L
    const tidalVolumeLiters = tidalVolume / 1000;
    const minuteVolume = respiratoryRate * tidalVolumeLiters;

    // Display result
    const resultContainer = document.getElementById('mv-result');
    const valueElement = document.getElementById('mv-value');
    
    valueElement.textContent = `${minuteVolume.toFixed(2)} L/min`;
    resultContainer.style.display = 'block';
    
    // Store the calculated value for use in main form
    window.calculatedMinuteVolume = minuteVolume;
}

function useCalculatedMinuteVolume() {
    if (window.calculatedMinuteVolume) {
        // Set the flow rate in the active form (gas or liquid)
        const gasFlowRate = document.getElementById('flow-rate');
        const liquidFlowRate = document.getElementById('liquid-flow-rate');
        
        // Check which form is active
        const gasForm = document.getElementById('gas-form');
        if (gasForm.classList.contains('active')) {
            gasFlowRate.value = window.calculatedMinuteVolume.toFixed(2);
        } else {
            liquidFlowRate.value = window.calculatedMinuteVolume.toFixed(2);
        }
    }
}

function calculateRecommendedTanks() {
    const transportDuration = parseFloat(document.getElementById('transport-duration').value);
    const tankDuration = window.tankDurationMinutes;
    
    const recommendationContainer = document.getElementById('tanks-recommendation');
    const tanksCountElement = document.getElementById('tanks-count');
    
    // Only calculate if both values are available
    if (!transportDuration || transportDuration <= 0 || !Number.isInteger(transportDuration) || !tankDuration || tankDuration <= 0) {
        recommendationContainer.style.display = 'none';
        return;
    }
    
    // Calculate recommended number of tanks (round up)
    const recommendedTanks = Math.ceil(transportDuration / tankDuration);
    
    // Display result
    tanksCountElement.textContent = recommendedTanks + (recommendedTanks === 1 ? ' tank' : ' tanks');
    recommendationContainer.style.display = 'block';
}
