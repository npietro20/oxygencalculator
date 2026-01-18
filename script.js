// Conversion factors for gas oxygen tanks (L/PSI)
const TANK_CONVERSION_FACTORS = {
    'D': 0.16,  // D cylinder: 0.16 L/PSI
    'E': 0.28,  // E cylinder: 0.28 L/PSI
    'M': 1.56,  // M cylinder: 1.56 L/PSI
    'H': 3.14   // H cylinder: 3.14 L/PSI
};

// Konami code: Up, Up, Down, Down, Left, Right, Left, Right, B, A
const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];
let konamiCodePosition = 0;

// Swipe sequence for mobile: Up, Up, Down, Down, Left, Right, Left, Right
const SWIPE_KONAMI_CODE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
let swipeKonamiCodePosition = 0;
let touchStartX = 0;
let touchStartY = 0;

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

    // Konami code detection (keyboard)
    document.addEventListener('keydown', function(event) {
        // Check if the pressed key matches the next key in the sequence
        if (event.code === KONAMI_CODE[konamiCodePosition]) {
            konamiCodePosition++;
            // If we've completed the sequence
            if (konamiCodePosition === KONAMI_CODE.length) {
                activateKonamiCode();
                konamiCodePosition = 0; // Reset for next time
            }
        } else {
            // Reset if wrong key is pressed
            konamiCodePosition = 0;
        }
    });

    // Konami code detection (swipe gestures for mobile)
    document.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', function(event) {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Determine swipe direction
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        // Minimum swipe distance (in pixels) to register as a swipe
        const minSwipeDistance = 30;
        
        if (absX < minSwipeDistance && absY < minSwipeDistance) {
            // Too small to be a swipe, reset
            touchStartX = 0;
            touchStartY = 0;
            return;
        }
        
        let swipeDirection = '';
        
        if (absX > absY) {
            // Horizontal swipe
            swipeDirection = deltaX > 0 ? 'right' : 'left';
        } else {
            // Vertical swipe
            swipeDirection = deltaY > 0 ? 'down' : 'up';
        }
        
        // Check if swipe matches the next in sequence
        if (swipeDirection === SWIPE_KONAMI_CODE[swipeKonamiCodePosition]) {
            swipeKonamiCodePosition++;
            // If we've completed the sequence
            if (swipeKonamiCodePosition === SWIPE_KONAMI_CODE.length) {
                activateKonamiCode();
                swipeKonamiCodePosition = 0; // Reset for next time
            }
        } else {
            // Reset if wrong swipe direction
            swipeKonamiCodePosition = 0;
        }
        
        // Reset touch positions
        touchStartX = 0;
        touchStartY = 0;
    }, { passive: true });

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

    if (!flowRate || flowRate <= 0) {
        alert('Please enter a valid flow rate');
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

    if (!flowRate || flowRate <= 0) {
        alert('Please enter a valid flow rate');
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

function activateKonamiCode() {
    // Create a fun celebration effect
    const body = document.body;
    
    // Add rainbow animation
    body.style.animation = 'rainbow 2s ease-in-out';
    
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
        createConfetti();
    }
    
    // Show the University of Critical Care Paramedic Florida logo
    const logoContainer = document.createElement('div');
    logoContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        animation: fadeInOut 4s ease-in-out;
        pointer-events: none;
    `;
    
    // Display the logo image
    const logoImg = document.createElement('img');
    logoImg.src = 'uf-ccp-logo.jpg';
    logoImg.alt = 'University of Critical Care Paramedic Florida';
    logoImg.style.cssText = `
        width: 400px;
        height: 400px;
        background: #FFFFFF;
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
    `;
    
    logoContainer.appendChild(logoImg);
    document.body.appendChild(logoContainer);
    
    // Remove logo after animation
    setTimeout(() => {
        logoContainer.remove();
        body.style.animation = '';
    }, 4000);
}

function createConfetti() {
    const confetti = document.createElement('div');
    const colors = ['#0021A5', '#FA4616', '#FFD700', '#00FF00', '#FF00FF'];
    confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}vw;
        top: -10px;
        z-index: 9999;
        pointer-events: none;
        animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
    `;
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 5000);
}
