// bin2dec.js - Binary to Decimal Converter

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const binaryDisplay = document.getElementById('binary-display');
    const binaryInput = document.getElementById('binary-input');
    const decimalResult = document.getElementById('decimal-result');
    const binaryDisplayResult = document.getElementById('binary-display-result');
    const calculationSteps = document.getElementById('calculation-steps');
    const clearBtn = document.getElementById('clear-btn');
    const randomBtn = document.getElementById('random-btn');
    const copyBtn = document.getElementById('copy-btn');
    const exampleBtns = document.querySelectorAll('.example-btn');
    
    // Initialize with 16 bits (all zeros)
    let binaryArray = Array(16).fill('0');
    
    // Generate binary digit buttons
    function generateBinaryDisplay() {
        binaryDisplay.innerHTML = '';
        
        binaryArray.forEach((bit, index) => {
            const position = binaryArray.length - 1 - index;
            const powerValue = Math.pow(2, index);
            
            const digitDiv = document.createElement('div');
            digitDiv.className = `binary-digit flex flex-col items-center justify-center p-3 rounded-lg 
                                 ${bit === '1' ? 'active bg-gradient-to-br from-pink-450/20 to-purple-450/20 border border-pink-450/30' : 
                                                  'bg-gray-800/50 border border-gray-700'}`;
            digitDiv.dataset.index = position;
            digitDiv.dataset.value = bit;
            
            digitDiv.innerHTML = `
                <div class="text-2xl font-bold font-mono mb-1 ${bit === '1' ? 'text-white' : 'text-gray-400'}">${bit}</div>
                <div class="power-value">2<sup>${index}</sup> = ${powerValue}</div>
                <div class="text-xs text-gray-500 mt-1">Bit ${position}</div>
            `;
            
            digitDiv.addEventListener('click', () => {
                toggleBit(position);
            });
            
            binaryDisplay.appendChild(digitDiv);
        });
    }
    
    // Toggle a bit (0 ↔ 1)
    function toggleBit(position) {
        const index = binaryArray.length - 1 - position;
        binaryArray[index] = binaryArray[index] === '0' ? '1' : '0';
        updateDisplay();
    }
    
    // Update all displays based on binary array
    function updateDisplay() {
        // Update binary display
        generateBinaryDisplay();
        
        // Update input field
        const binaryString = binaryArray.join('');
        binaryInput.value = binaryString.replace(/^0+/, '') || '0';
        
        // Convert and update result
        const decimalValue = convertBinaryToDecimal(binaryArray);
        decimalResult.textContent = decimalValue;
        
        // Update formatted binary display
        const formattedBinary = binaryString.match(/.{1,4}/g).join(' ');
        binaryDisplayResult.textContent = formattedBinary;
        
        // Show calculation steps
        showCalculationSteps(binaryArray, decimalValue);
    }
    
    // Convert binary array to decimal
    function convertBinaryToDecimal(binaryArray) {
        return binaryArray.reduce((total, bit, index) => {
            const power = binaryArray.length - 1 - index;
            return total + (parseInt(bit) * Math.pow(2, power));
        }, 0);
    }
    
    // Show step-by-step calculation
    function showCalculationSteps(binaryArray, decimalValue) {
        calculationSteps.innerHTML = '';
        
        let stepsHTML = '<div class="text-gray-400 mb-3">Step-by-step calculation:</div>';
        let calculationParts = [];
        let total = 0;
        
        // Generate calculation for each bit
        binaryArray.forEach((bit, index) => {
            const power = binaryArray.length - 1 - index;
            const powerValue = Math.pow(2, power);
            const bitValue = parseInt(bit);
            const contribution = bitValue * powerValue;
            
            if (bitValue === 1) {
                calculationParts.push(`${bitValue}×2<sup>${power}</sup>`);
                total += contribution;
                
                stepsHTML += `
                    <div class="flex items-center p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                        <div class="w-8 h-8 flex items-center justify-center rounded-full bg-pink-450/20 text-pink-350 mr-3 font-bold">
                            ${power}
                        </div>
                        <div class="flex-1">
                            <div class="text-white">Bit ${power} = ${bit} × 2<sup>${power}</sup></div>
                            <div class="text-gray-400 text-sm">= ${bit} × ${powerValue} = ${contribution}</div>
                        </div>
                        <div class="text-pink-350 font-bold">${contribution}</div>
                    </div>
                `;
            }
        });
        
        // If no bits are 1, show zero calculation
        if (total === 0) {
            stepsHTML = `
                <div class="text-center p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
                    <div class="text-gray-400">All bits are 0, so:</div>
                    <div class="text-white mt-2">0 × 2<sup>n</sup> = 0 for all positions</div>
                </div>
            `;
        } else {
            // Add total calculation
            stepsHTML += `
                <div class="flex items-center justify-between p-4 mt-4 rounded-lg bg-gradient-to-r from-pink-450/10 to-purple-450/10 border border-pink-450/30">
                    <div class="text-white font-semibold">Total = ${calculationParts.join(' + ')}</div>
                    <div class="text-2xl font-bold text-pink-350">= ${total}</div>
                </div>
            `;
        }
        
        calculationSteps.innerHTML = stepsHTML;
    }
    
    // Generate random binary number
    function generateRandomBinary() {
        const length = Math.floor(Math.random() * 16) + 1; // 1 to 16 bits
        binaryArray = Array(16).fill('0');
        
        for (let i = 0; i < length; i++) {
            const bit = Math.random() > 0.5 ? '1' : '0';
            binaryArray[15 - i] = bit; // Fill from right
        }
        
        updateDisplay();
    }
    
    // Validate binary input
    function validateBinaryInput(input) {
        return /^[01]+$/.test(input);
    }
    
    // Update binary array from input string
    function updateFromInput(inputStr) {
        if (!inputStr) {
            binaryArray = Array(16).fill('0');
            updateDisplay();
            return;
        }
        
        if (!validateBinaryInput(inputStr)) {
            // Remove non-binary characters
            inputStr = inputStr.replace(/[^01]/g, '');
            binaryInput.value = inputStr;
        }
        
        // Pad to 16 bits with zeros on the left
        let padded = inputStr.padStart(16, '0');
        
        // If longer than 16 bits, take the rightmost 16 bits
        if (padded.length > 16) {
            padded = padded.slice(-16);
            binaryInput.value = padded.replace(/^0+/, '') || '0';
        }
        
        binaryArray = padded.split('');
        updateDisplay();
    }
    
    // Copy result to clipboard
    function copyResultToClipboard() {
        const result = decimalResult.textContent;
        const binary = binaryArray.join('').replace(/^0+/, '') || '0';
        const text = `Binary: ${binary}₂ = Decimal: ${result}₁₀`;
        
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
            copyBtn.classList.add('bg-green-500/20', 'border-green-400', 'text-green-300');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('bg-green-500/20', 'border-green-400', 'text-green-300');
            }, 2000);
        });
    }
    
    // Event Listeners
    binaryInput.addEventListener('input', (e) => {
        updateFromInput(e.target.value);
    });
    
    binaryInput.addEventListener('keydown', (e) => {
        // Only allow 0, 1, backspace, delete, arrow keys
        if (!/[01]|Backspace|Delete|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Tab/.test(e.key)) {
            e.preventDefault();
        }
    });
    
    clearBtn.addEventListener('click', () => {
        binaryArray = Array(16).fill('0');
        updateDisplay();
        binaryInput.value = '0';
        binaryInput.focus();
    });
    
    randomBtn.addEventListener('click', () => {
        generateRandomBinary();
    });
    
    copyBtn.addEventListener('click', copyResultToClipboard);
    
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const binaryText = e.currentTarget.querySelector('.font-mono').textContent;
            updateFromInput(binaryText);
            
            // Add visual feedback
            e.currentTarget.classList.add('border-pink-450', 'bg-pink-450/20', 'text-white');
            setTimeout(() => {
                e.currentTarget.classList.remove('border-pink-450', 'bg-pink-450/20', 'text-white');
            }, 500);
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space to generate random
        if (e.code === 'Space' && e.target !== binaryInput) {
            e.preventDefault();
            generateRandomBinary();
        }
        
        // Escape to clear
        if (e.code === 'Escape') {
            e.preventDefault();
            binaryArray = Array(16).fill('0');
            updateDisplay();
            binaryInput.value = '0';
        }
        
        // Ctrl/Cmd + C to copy
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
            copyResultToClipboard();
        }
    });
    
    // Initialize
    generateBinaryDisplay();
    updateDisplay();
    
    // Add some cool effects
    setTimeout(() => {
        // Flash the bits once for demonstration
        const bits = document.querySelectorAll('.binary-digit');
        bits.forEach((bit, index) => {
            setTimeout(() => {
                bit.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    bit.style.transform = '';
                }, 100);
            }, index * 50);
        });
    }, 500);
    
    // Add tooltip to copy button
    copyBtn.title = 'Copy result (Ctrl+C)';
    randomBtn.title = 'Generate random binary (Space)';
    clearBtn.title = 'Clear all (Esc)';
});