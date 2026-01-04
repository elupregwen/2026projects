// number-converter.js - Universal Number System Converter

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements with null checks
    const numberInput = document.getElementById('number-input');
    const inputBaseIndicator = document.getElementById('input-base-indicator');
    const inputTypeBtns = document.querySelectorAll('.input-type-btn');
    const clearInputBtn = document.getElementById('clear-input-btn');
    const randomInputBtn = document.getElementById('random-input-btn');
    const currentBaseName = document.getElementById('current-base-name');
    const inputValidation = document.getElementById('input-validation');

    // Result elements with null checks
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

    // Safe element update function
    function safeUpdate(element, value) {
        if (element && element.textContent !== undefined) {
            element.textContent = value;
        }
    }

    // Safe element style update
    function safeStyleUpdate(element, property, value) {
        if (element && element.style) {
            element.style[property] = value;
        }
    }

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

        // Check if essential elements exist
        if (!numberInput) {
            console.error('Number input element not found!');
            return;
        }

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
        safeUpdate(inputValidation, '');

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
        safeUpdate(inputBaseIndicator, base.toString());
        safeStyleUpdate(inputBaseIndicator, 'color', getButtonColor(base));

        // Update current base name
        const baseInfo = baseNames[base];
        safeUpdate(currentBaseName, `${baseInfo.name} (Base ${base})`);

        // Update placeholder
        const examples = {
            2: 'e.g., 10101101',
            10: 'e.g., 255',
            16: 'e.g., FF or 1A3',
            8: 'e.g., 777'
        };
        if (numberInput) {
            numberInput.placeholder = `Enter ${baseInfo.name.toLowerCase()} number (${examples[base]})`;
        }

        // Re-validate current input
        if (currentInput) {
            validateAndConvert(currentInput);
        }
    }

    // Get button gradient based on base
    function getButtonGradient(base) {
        switch (base) {
            case 2: return 'linear-gradient(135deg, #FF6B9D, #C77DFF)';
            case 10: return 'linear-gradient(135deg, #10B981, #34D399)';
            case 16: return 'linear-gradient(135deg, #3B82F6, #60A5FA)';
            case 8: return 'linear-gradient(135deg, #F59E0B, #FBBF24)';
            default: return 'linear-gradient(135deg, #FF6B9D, #C77DFF)';
        }
    }

    // Get button color based on base
    function getButtonColor(base) {
        switch (base) {
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
                return isNegative ? -num : num;
            }

            let decimal = 0;
            const digits = numberStr.split('');

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
                decimal += digitValue * Math.pow(fromBase, power);
            }

            return isNegative ? -decimal : decimal;
        } catch (error) {
            console.warn('Conversion error:', error.message);
            throw new Error('Number too large for conversion');
        }
    }

    // Convert decimal to any base
    function fromDecimal(decimalNumber, toBase) {
        try {
            if (decimalNumber === 0) return '0';

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
            throw new Error('Conversion error');
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
        try {
            currentInput = inputValue;

            // Reset error state
            errorState = false;
            safeUpdate(inputValidation, '');
            safeStyleUpdate(inputValidation, 'color', '');

            // Clear input or empty string
            if (inputValue === '') {
                clearResults();
                safeUpdate(inputValidation, 'Enter a number to convert');
                safeStyleUpdate(inputValidation, 'color', '#6B7280');
                return;
            }

            // Validate input
            const validation = validateInput(inputValue, currentBase);
            if (!validation.isValid) {
                safeUpdate(inputValidation, validation.message);
                safeStyleUpdate(inputValidation, 'color', '#EF4444');
                clearResults();
                return;
            }

            // Main conversions
            const decimalValue = toDecimal(inputValue, currentBase);

            safeUpdate(inputValidation, validation.message);
            safeStyleUpdate(inputValidation, 'color', '#10B981');

            // Binary
            const binary = convertBase(inputValue, currentBase, 2);
            safeUpdate(resultBinary, formatBinary(binary));
            safeUpdate(binaryDigits, binary.replace(/[^01]/g, '').length.toString());

            // Decimal
            safeUpdate(resultDecimal, decimalValue.toLocaleString());

            // Hexadecimal
            const hexadecimal = convertBase(inputValue, currentBase, 16);
            safeUpdate(resultHexadecimal, hexadecimal);
            safeUpdate(hexDigits, hexadecimal.replace(/[^0-9A-F]/g, '').length.toString());

            // Octal
            const octal = convertBase(inputValue, currentBase, 8);
            safeUpdate(resultOctal, octal);
            safeUpdate(octalDigits, octal.replace(/[^0-7]/g, '').length.toString());

            // ASCII Character
            updateAsciiConversion(decimalValue);

            // 32-bit Binary
            update32BitBinary(decimalValue);

            // Custom Base
            updateCustomBaseConversion(decimalValue);

        } catch (error) {
            console.warn('Conversion failed:', error.message);
            errorState = true;
            safeUpdate(inputValidation, `Error: ${error.message}. Try a smaller number.`);
            safeStyleUpdate(inputValidation, 'color', '#EF4444');
            clearResults();
        }
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
        try {
            if (decimalValue >= 0 && decimalValue <= 127) {
                const char = String.fromCharCode(decimalValue);
                // Check if it's a printable character
                if (decimalValue >= 32 && decimalValue <= 126) {
                    safeUpdate(resultAscii, char);
                } else {
                    // Control character names
                    const controlChars = {
                        0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
                        8: 'BS', 9: 'TAB', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
                        16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN',
                        23: 'ETB', 24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS',
                        30: 'RS', 31: 'US', 127: 'DEL'
                    };
                    safeUpdate(resultAscii, controlChars[decimalValue] || `CTRL-${decimalValue}`);
                }
                safeUpdate(asciiCode, decimalValue.toString());
            } else {
                safeUpdate(resultAscii, 'N/A');
                safeUpdate(asciiCode, 'N/A');
            }
        } catch (error) {
            safeUpdate(resultAscii, 'Error');
            safeUpdate(asciiCode, 'Error');
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
                safeUpdate(result32Bit, binary32.replace(/(.{8})/g, '$1 ').trim());
            } else {
                safeUpdate(result32Bit, 'Out of 32-bit range');
            }
        } catch (error) {
            safeUpdate(result32Bit, 'Conversion error');
        }
    }

    // Update custom base conversion
    function updateCustomBaseConversion(decimalValue) {
        try {
            if (customBaseInput) {
                const customBase = parseInt(customBaseInput.value) || 5;

                if (customBase >= 2 && customBase <= 36) {
                    const customResult = fromDecimal(decimalValue, customBase);
                    safeUpdate(resultCustom, customResult);
                } else {
                    safeUpdate(resultCustom, 'Invalid base');
                }
            }
        } catch (error) {
            safeUpdate(resultCustom, 'Error');
        }
    }

    // Clear all results
    function clearResults() {
        safeUpdate(resultBinary, '0');
        safeUpdate(resultDecimal, '0');
        safeUpdate(resultHexadecimal, '0');
        safeUpdate(resultOctal, '0');
        safeUpdate(resultAscii, 'NUL');
        safeUpdate(result32Bit, '00000000000000000000000000000000');
        safeUpdate(resultCustom, '0');
        safeUpdate(asciiCode, '0');
        safeUpdate(binaryDigits, '1');
        safeUpdate(hexDigits, '1');
        safeUpdate(octalDigits, '1');
    }

    // Generate random number based on current base
    function generateRandomNumber() {
        // Reset error state
        errorState = false;
        safeUpdate(inputValidation, '');

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

        if (numberInput) {
            numberInput.value = randomNum;
            validateAndConvert(randomNum);
        }
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
                if (numberInput && numberInput.value) {
                    validateAndConvert(numberInput.value);
                }
            });
        });

        // Number input
        if (numberInput) {
            numberInput.addEventListener('input', (e) => {
                validateAndConvert(e.target.value);
            });
        }

        // Clear input button
        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', () => {
                if (numberInput) {
                    numberInput.value = '';
                }
                errorState = false;
                validateAndConvert('');
                if (numberInput) {
                    numberInput.focus();
                }
            });
        }

        // Random input button
        if (randomInputBtn) {
            randomInputBtn.addEventListener('click', generateRandomNumber);
        }

        // Copy buttons
        copyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (errorState) return;

                const target = btn.getAttribute('data-target');
                let textToCopy = '';

                switch (target) {
                    case 'binary':
                        textToCopy = resultBinary ? resultBinary.textContent.replace(/ /g, '') : '';
                        break;
                    case 'decimal':
                        textToCopy = resultDecimal ? resultDecimal.textContent.replace(/,/g, '') : '';
                        break;
                    case 'hexadecimal':
                        textToCopy = resultHexadecimal ? resultHexadecimal.textContent : '';
                        break;
                    case 'octal':
                        textToCopy = resultOctal ? resultOctal.textContent : '';
                        break;
                    case 'ascii':
                        textToCopy = resultAscii ? resultAscii.textContent : '';
                        break;
                    case '32bit':
                        textToCopy = result32Bit ? result32Bit.textContent.replace(/ /g, '') : '';
                        break;
                    case 'custom':
                        textToCopy = resultCustom ? resultCustom.textContent : '';
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
                if (numberInput) {
                    numberInput.value = binaryText;
                    validateAndConvert(binaryText);
                    numberInput.focus();
                }

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
        if (customBaseInput) {
            customBaseInput.addEventListener('input', () => {
                if (errorState || !numberInput || !numberInput.value) return;

                const customBase = parseInt(customBaseInput.value);
                if (customBase >= 2 && customBase <= 36) {
                    try {
                        const decimalValue = toDecimal(numberInput.value, currentBase);
                        updateCustomBaseConversion(decimalValue);
                    } catch (error) {
                        safeUpdate(resultCustom, 'Error');
                    }
                }
            });
        }
    }

    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Clear on Escape
            if (e.key === 'Escape') {
                if (numberInput) {
                    numberInput.value = '';
                }
                errorState = false;
                validateAndConvert('');
                if (numberInput) {
                    numberInput.focus();
                }
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
    if (numberInput) {
        numberInput.focus();
    }

    // Log any missing elements for debugging
    const elements = [
        { name: 'numberInput', element: numberInput },
        { name: 'resultBinary', element: resultBinary },
        { name: 'resultDecimal', element: resultDecimal },
        { name: 'resultHexadecimal', element: resultHexadecimal },
        { name: 'resultOctal', element: resultOctal }
    ];

    elements.forEach(item => {
        if (!item.element) {
            console.warn(`Element not found: ${item.name}`);
        }
    });
});