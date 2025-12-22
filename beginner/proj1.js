// number-converter.js - Universal Number System Converter

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const numberInput = document.getElementById('number-input');
    const inputBaseIndicator = document.getElementById('input-base-indicator');
    const inputTypeBtns = document.querySelectorAll('.input-type-btn');
    const clearInputBtn = document.getElementById('clear-input-btn');
    const randomInputBtn = document.getElementById('random-input-btn');
    const currentBaseName = document.getElementById('current-base-name');
    const inputValidation = document.getElementById('input-validation');
    
    // Result elements
    const resultBinary = document.getElementById('result-binary');
    const resultDecimal = document.getElementById('result-decimal');
    const resultHexadecimal = document.getElementById('result-hexadecimal');
    const resultOctal = document.getElementById('result-octal');
    const resultAscii = document.getElementById('result-ascii');
    const result32Bit = document.getElementById('result-32bit');
    const resultCustom = document.getElementById('result-custom');
    const asciiCode = document.getElementById('ascii-code');
    const binaryDigits = document.getElementById('binary-digits');
    const hexDigits = document.getElementById('hex-digits');
    const octalDigits = document.getElementById('octal-digits');
    
    // Custom base input
    const customBaseInput = document.getElementById('custom-base-input');
    
    // Copy buttons
    const copyBtns = document.querySelectorAll('.copy-btn');
    
    // Example buttons
    const exampleBtns = document.querySelectorAll('.example-btn');
    
    // Current input base (default: binary)
    let currentBase = 2;
    let currentInput = '';
    let errorState = false;

    // Base names mapping
    const baseNames = {
        2: { name: 'Binary', color: 'pink' },
        10: { name: 'Decimal', color: 'green' },
        16: { name: 'Hexadecimal', color: 'blue' },
        8: { name: 'Octal', color: 'yellow' }
    };
    
    // Character sets for validation
    const baseCharacters = {
        2: '01',
        8: '01234567',
        10: '0123456789-',
        16: '0123456789ABCDEFabcdef'
    };
    
    // Max safe integer for JavaScript
    const MAX_SAFE_INTEGER = 9007199254740991;
    
    // Initialize
    function init() {
        // Reset error state
        errorState = false;
        
        // Set active input type button
        setActiveInputType(2);
        updateAllConversions('0');
        setupEventListeners();
        setupKeyboardShortcuts();
    }
    
    // Set active input type
    function setActiveInputType(base) {
        currentBase = base;
        
        // Reset error state when changing base
        errorState = false;
        inputValidation.textContent = '';
        
        // Update buttons
        inputTypeBtns.forEach(btn => {
            const btnBase = parseInt(btn.getAttribute('data-base'));
            if (btnBase === base) {
                btn.classList.add('active');
                btn.style.background = getButtonGradient(btnBase);
                btn.style.color = 'white';
                btn.style.borderColor = getButtonColor(btnBase);
            } else {
                btn.classList.remove('active');
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            }
        });
        
        // Update base indicator
        inputBaseIndicator.textContent = base;
        inputBaseIndicator.style.color = getButtonColor(base);
        
        // Update current base name
        const baseInfo = baseNames[base];
        currentBaseName.textContent = `${baseInfo.name} (Base ${base})`;
        currentBaseName.style.color = `var(--tw-${baseInfo.color}-400)`;
        
        // Update placeholder
        const examples = {
            2: 'e.g., 10101101',
            10: 'e.g., 255',
            16: 'e.g., FF or 1A3',
            8: 'e.g., 777'
        };
        numberInput.placeholder = `Enter ${baseInfo.name.toLowerCase()} number (${examples[base]})`;
        
        // Re-validate current input
        if (currentInput) {
            validateAndConvert(currentInput);
        }
    }
    
    // Get button gradient based on base
    function getButtonGradient(base) {
        switch(base) {
            case 2: return 'linear-gradient(135deg, #FF6B9D, #C77DFF)';
            case 10: return 'linear-gradient(135deg, #10B981, #34D399)';
            case 16: return 'linear-gradient(135deg, #3B82F6, #60A5FA)';
            case 8: return 'linear-gradient(135deg, #F59E0B, #FBBF24)';
            default: return 'linear-gradient(135deg, #FF6B9D, #C77DFF)';
        }
    }
    
    // Get button color based on base
    function getButtonColor(base) {
        switch(base) {
            case 2: return '#FF6B9D';
            case 10: return '#10B981';
            case 16: return '#3B82F6';
            case 8: return '#F59E0B';
            default: return '#FF6B9D';
        }
    }
    
    // Validate input for current base
    function validateInput(input, base) {
        if (!input || input.trim() === '') {
            return { isValid: false, message: 'Please enter a number' };
        }
        
        const chars = baseCharacters[base];
        const inputUpper = input.toUpperCase();
        
        // Check for negative sign in decimal
        if (base === 10 && inputUpper.includes('-')) {
            // Ensure negative sign is only at the beginning
            if (inputUpper.indexOf('-') > 0) {
                return { 
                    isValid: false, 
                    message: 'Negative sign must be at the beginning' 
                };
            }
            // Check remaining characters
            const remaining = inputUpper.substring(1);
            for (let char of remaining) {
                if (!'0123456789'.includes(char)) {
                    return { 
                        isValid: false, 
                        message: `Invalid decimal digit: "${char}"` 
                    };
                }
            }
            return { isValid: true, message: `Valid ${baseNames[base].name} number` };
        }
        
        // Check each character for other bases
        for (let char of inputUpper) {
            if (!chars.includes(char)) {
                return { 
                    isValid: false, 
                    message: `Invalid ${baseNames[base].name.toLowerCase()} digit: "${char}". Valid digits: ${chars}` 
                };
            }
        }
        
        return { isValid: true, message: `Valid ${baseNames[base].name} number` };
    }
    
    // Safe conversion to decimal with error handling
    function toDecimal(numberStr, fromBase) {
        try {
            // Remove any whitespace and convert to uppercase
            numberStr = numberStr.trim().toUpperCase();
            if (numberStr === '' || numberStr === '-') return 0;
            
            // Handle negative numbers
            let isNegative = false;
            if (numberStr.startsWith('-')) {
                isNegative = true;
                numberStr = numberStr.substring(1);
            }
            
            // For decimal base, just parse it
            if (fromBase === 10) {
                const num = parseInt(numberStr, 10);
                if (isNaN(num)) return 0;
                if (Math.abs(num) > MAX_SAFE_INTEGER) {
                    throw new Error('Number too large for accurate conversion');
                }
                return isNegative ? -num : num;
            }
            
            let decimal = 0;
            const digits = numberStr.split('');
            
            // Check if number is too long for safe conversion
            if (digits.length > 15) {
                throw new Error('Number too large for accurate conversion');
            }
            
            // Convert each digit
            for (let i = 0; i < digits.length; i++) {
                const digit = digits[i];
                let digitValue;
                
                if (digit >= '0' && digit <= '9') {
                    digitValue = parseInt(digit);
                } else if (digit >= 'A' && digit <= 'F') {
                    digitValue = digit.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
                } else {
                    digitValue = 0;
                }
                
                const power = digits.length - 1 - i;
                const powerValue = Math.pow(fromBase, power);
                
                // Check for overflow
                if (powerValue > MAX_SAFE_INTEGER || decimal > MAX_SAFE_INTEGER - (digitValue * powerValue)) {
                    throw new Error('Number too large for accurate conversion');
                }
                
                decimal += digitValue * powerValue;
            }
            
            if (decimal > MAX_SAFE_INTEGER) {
                throw new Error('Number too large for accurate conversion');
            }
            
            return isNegative ? -decimal : decimal;
        } catch (error) {
            console.warn('Conversion error:', error.message);
            throw error;
        }
    }
    
    // Convert decimal to any base
    function fromDecimal(decimalNumber, toBase) {
        try {
            if (decimalNumber === 0) return '0';
            
            // Handle large numbers
            if (Math.abs(decimalNumber) > MAX_SAFE_INTEGER) {
                throw new Error('Number too large for conversion');
            }
            
            let number = Math.abs(decimalNumber);
            let result = '';
            const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            
            // Convert
            while (number > 0) {
                const remainder = number % toBase;
                result = digits[remainder] + result;
                number = Math.floor(number / toBase);
            }
            
            result = result || '0';
            
            // Add negative sign if needed
            if (decimalNumber < 0) {
                result = '-' + result;
            }
            
            return result;
        } catch (error) {
            console.warn('Conversion error:', error.message);
            throw error;
        }
    }
    
    // Convert between any bases
    function convertBase(numberStr, fromBase, toBase) {
        try {
            if (fromBase === toBase) return numberStr.toUpperCase();
            
            // Convert to decimal first
            const decimal = toDecimal(numberStr, fromBase);
            
            // Convert from decimal to target base
            return fromDecimal(decimal, toBase);
        } catch (error) {
            throw error;
        }
    }
    
    // Update all conversion results
    function updateAllConversions(inputValue) {
        currentInput = inputValue;
        
        // Reset error state
        errorState = false;
        inputValidation.textContent = '';
        inputValidation.style.color = '';
        
        // Clear input or empty string
        if (inputValue === '') {
            clearResults();
            inputValidation.textContent = 'Enter a number to convert';
            inputValidation.style.color = '#6B7280';
            return;
        }
        
        // Validate input
        const validation = validateInput(inputValue, currentBase);
        if (!validation.isValid) {
            inputValidation.textContent = validation.message;
            inputValidation.style.color = '#EF4444';
            clearResults();
            return;
        }
        
        try {
            // Main conversions
            const decimalValue = toDecimal(inputValue, currentBase);
            
            // Check if value is within reasonable bounds
            if (Math.abs(decimalValue) > 1e15) {
                inputValidation.textContent = 'Note: Very large number, precision may be limited';
                inputValidation.style.color = '#F59E0B';
            } else {
                inputValidation.textContent = validation.message;
                inputValidation.style.color = '#10B981';
            }
            
            // Binary
            const binary = convertBase(inputValue, currentBase, 2);
            resultBinary.textContent = formatBinary(binary);
            binaryDigits.textContent = binary.replace(/[^01]/g, '').length;
            
            // Decimal
            resultDecimal.textContent = formatLargeNumber(decimalValue);
            
            // Hexadecimal
            const hexadecimal = convertBase(inputValue, currentBase, 16);
            resultHexadecimal.textContent = hexadecimal;
            hexDigits.textContent = hexadecimal.replace(/[^0-9A-F]/g, '').length;
            
            // Octal
            const octal = convertBase(inputValue, currentBase, 8);
            resultOctal.textContent = octal;
            octalDigits.textContent = octal.replace(/[^0-7]/g, '').length;
            
            // ASCII Character
            updateAsciiConversion(decimalValue);
            
            // 32-bit Binary
            update32BitBinary(decimalValue);
            
            // Custom Base
            updateCustomBaseConversion(decimalValue);
            
        } catch (error) {
            console.warn('Conversion failed:', error.message);
            errorState = true;
            inputValidation.textContent = `Error: ${error.message}. Try a smaller number.`;
            inputValidation.style.color = '#EF4444';
            clearResults();
        }
    }
    
    // Format large numbers with commas
    function formatLargeNumber(num) {
        if (Math.abs(num) >= 1e12) {
            return num.toExponential(6);
        }
        return num.toLocaleString();
    }
    
    // Format binary with spacing
    function formatBinary(binary) {
        // Handle negative binary
        if (binary.startsWith('-')) {
            return '-' + binary.substring(1).replace(/(.{4})/g, '$1 ').trim();
        }
        return binary.replace(/(.{4})/g, '$1 ').trim();
    }
    
    // Update ASCII conversion
    function updateAsciiConversion(decimalValue) {
        if (decimalValue >= 0 && decimalValue <= 127) {
            const char = String.fromCharCode(decimalValue);
            // Check if it's a printable character
            if (decimalValue >= 32 && decimalValue <= 126) {
                resultAscii.textContent = char;
            } else {
                // Control character names
                const controlChars = {
                    0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
                    8: 'BS', 9: 'TAB', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
                    16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN',
                    23: 'ETB', 24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS',
                    30: 'RS', 31: 'US', 127: 'DEL'
                };
                resultAscii.textContent = controlChars[decimalValue] || `CTRL-${decimalValue}`;
            }
            asciiCode.textContent = decimalValue;
        } else {
            resultAscii.textContent = 'N/A';
            asciiCode.textContent = 'N/A';
        }
    }
    
    // Update 32-bit binary representation
    function update32BitBinary(decimalValue) {
        try {
            if (decimalValue >= -2147483648 && decimalValue <= 2147483647) {
                // Convert to 32-bit signed binary
                let binary32;
                if (decimalValue >= 0) {
                    binary32 = decimalValue.toString(2).padStart(32, '0');
                } else {
                    // Two's complement for negative numbers
                    binary32 = (decimalValue >>> 0).toString(2);
                }
                result32Bit.textContent = binary32.replace(/(.{8})/g, '$1 ').trim();
            } else {
                result32Bit.textContent = 'Out of 32-bit range';
            }
        } catch (error) {
            result32Bit.textContent = 'Conversion error';
        }
    }
    
    // Update custom base conversion
    function updateCustomBaseConversion(decimalValue) {
        try {
            const customBase = parseInt(customBaseInput.value) || 5;
            
            if (customBase >= 2 && customBase <= 36) {
                const customResult = fromDecimal(decimalValue, customBase);
                resultCustom.textContent = customResult;
            } else {
                resultCustom.textContent = 'Invalid base';
            }
        } catch (error) {
            resultCustom.textContent = 'Error';
        }
    }
    
    // Clear all results
    function clearResults() {
        resultBinary.textContent = '0';
        resultDecimal.textContent = '0';
        resultHexadecimal.textContent = '0';
        resultOctal.textContent = '0';
        resultAscii.textContent = 'NUL';
        result32Bit.textContent = '00000000000000000000000000000000';
        resultCustom.textContent = '0';
        asciiCode.textContent = '0';
        binaryDigits.textContent = '1';
        hexDigits.textContent = '1';
        octalDigits.textContent = '1';
    }
    
    // Generate random number based on current base
    function generateRandomNumber() {
        // Reset error state
        errorState = false;
        inputValidation.textContent = '';
        
        let randomNum = '';
        let chars;
        
        // Get valid characters for current base
        if (currentBase === 10) {
            // For decimal, include negative numbers sometimes
            chars = '0123456789';
            const maxLength = 8;
            const length = Math.floor(Math.random() * maxLength) + 1;
            
            // Generate random digits
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * chars.length);
                randomNum += chars[randomIndex];
            }
            
            // Remove leading zeros
            randomNum = randomNum.replace(/^0+/, '') || '0';
            
            // 25% chance to add negative sign
            if (Math.random() < 0.25 && randomNum !== '0') {
                randomNum = '-' + randomNum;
            }
        } else {
            chars = baseCharacters[currentBase].replace('-', '');
            const maxLength = currentBase === 16 || currentBase === 2 ? 8 : 4;
            const length = Math.floor(Math.random() * maxLength) + 1;
            
            // Generate random digits
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * chars.length);
                randomNum += chars[randomIndex];
            }
            
            // Remove leading zeros
            randomNum = randomNum.replace(/^0+/, '') || '0';
        }
        
        numberInput.value = randomNum;
        validateAndConvert(randomNum);
    }
    
    // Validate and convert input
    function validateAndConvert(inputValue) {
        updateAllConversions(inputValue);
    }
    
    // Copy result to clipboard
    function copyToClipboard(text, button) {
        // Don't copy if in error state
        if (errorState) return;
        
        navigator.clipboard.writeText(text).then(() => {
            // Visual feedback
            const originalHTML = button.innerHTML;
            const originalClasses = button.className;
            
            button.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
            button.classList.add('copy-success');
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copy-success');
                button.className = originalClasses;
            }, 1500);
        }).catch(err => {
            console.error('Copy failed:', err);
            button.innerHTML = '<i class="fas fa-times mr-1"></i> Error';
            setTimeout(() => {
                button.innerHTML = '<i class="far fa-copy mr-1"></i> Copy';
            }, 1500);
        });
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Input type buttons
        inputTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const base = parseInt(btn.getAttribute('data-base'));
                setActiveInputType(base);
                if (numberInput.value) {
                    validateAndConvert(numberInput.value);
                }
            });
        });
        
        // Number input
        numberInput.addEventListener('input', (e) => {
            validateAndConvert(e.target.value);
        });
        
        // Clear input button
        clearInputBtn.addEventListener('click', () => {
            numberInput.value = '';
            errorState = false;
            validateAndConvert('');
            numberInput.focus();
        });
        
        // Random input button
        randomInputBtn.addEventListener('click', generateRandomNumber);
        
        // Copy buttons
        copyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (errorState) return;
                
                const target = btn.getAttribute('data-target');
                let textToCopy = '';
                
                switch(target) {
                    case 'binary':
                        textToCopy = resultBinary.textContent.replace(/ /g, '');
                        break;
                    case 'decimal':
                        textToCopy = resultDecimal.textContent.replace(/,/g, '');
                        break;
                    case 'hexadecimal':
                        textToCopy = resultHexadecimal.textContent;
                        break;
                    case 'octal':
                        textToCopy = resultOctal.textContent;
                        break;
                    case 'ascii':
                        textToCopy = resultAscii.textContent;
                        break;
                    case '32bit':
                        textToCopy = result32Bit.textContent.replace(/ /g, '');
                        break;
                    case 'custom':
                        textToCopy = resultCustom.textContent;
                        break;
                }
                
                copyToClipboard(textToCopy, btn);
            });
        });
        
        // Example buttons
        exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Reset error state
                errorState = false;
                
                const binaryText = btn.querySelector('.font-mono').textContent;
                numberInput.value = binaryText;
                validateAndConvert(binaryText);
                numberInput.focus();
                
                // Visual feedback
                btn.style.borderColor = '#FF6B9D';
                btn.style.backgroundColor = 'rgba(255, 107, 157, 0.1)';
                btn.style.color = 'white';
                
                setTimeout(() => {
                    btn.style.borderColor = '';
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                }, 500);
            });
        });
        
        // Custom base input
        customBaseInput.addEventListener('input', () => {
            if (errorState) return;
            
            const customBase = parseInt(customBaseInput.value);
            if (customBase >= 2 && customBase <= 36 && numberInput.value) {
                try {
                    const decimalValue = toDecimal(numberInput.value, currentBase);
                    updateCustomBaseConversion(decimalValue);
                } catch (error) {
                    resultCustom.textContent = 'Error';
                }
            }
        });
    }
    
    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Clear on Escape
            if (e.key === 'Escape') {
                numberInput.value = '';
                errorState = false;
                validateAndConvert('');
                numberInput.focus();
            }
            
            // Random on R
            if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                generateRandomNumber();
            }
            
            // Switch bases with number keys
            if (e.key === '2' && e.ctrlKey) {
                e.preventDefault();
                setActiveInputType(2);
            } else if (e.key === '8' && e.ctrlKey) {
                e.preventDefault();
                setActiveInputType(8);
            } else if (e.key === '1' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                setActiveInputType(10);
            } else if (e.key === '6' && e.ctrlKey) {
                e.preventDefault();
                setActiveInputType(16);
            }
        });
    }
    
    // Initialize the converter
    init();
    
    // Focus input on load
    numberInput.focus();
    
    // Force reset on page reload
    window.addEventListener('beforeunload', () => {
        errorState = false;
    });
});