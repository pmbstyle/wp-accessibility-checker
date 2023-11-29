function runAccessibilityTests() {
    // Run tests and collect detailed results
    var textToSpeechResults = checkTextToSpeechAccessibility();
    var keyboardNavigationResults = checkKeyboardNavigation();
    var colorContrastResults = checkColorContrast();
    var altTextResults = checkAltTextForImages();

    // Create results HTML
    var resultsHtml = '<div class="accessibility-results">';
    resultsHtml += '<h2>Accessibility Test</h2>';

    // Add detailed results to the HTML
    resultsHtml += formatTestResults('Text-to-Speech Accessibility', textToSpeechResults);
    resultsHtml += formatTestResults('Keyboard Navigation', keyboardNavigationResults);
    resultsHtml += formatTestResults('Color Contrast', colorContrastResults);
    resultsHtml += formatTestResults('Alternative Text for Images', altTextResults);

    resultsHtml += '</div>';

    // Display the results in a popup
    showPopup(resultsHtml);
}

function formatTestResults(testName, results) {
    var resultHtml = `<h3>${testName}:</h3>`;
    if (results.passed) {
        resultHtml += '<p class="green">All checks passed.</p>';
    } else {
        resultHtml += '<p class="red">Failed Checks:</p><ul>';
        results.failedItems.forEach((item, index) => {
            resultHtml += `<li><a href="#" onclick="highlightElement('${item.identifier}', event)">${item.message}</a></li>`;
        });
        resultHtml += '</ul>';
    }
    return resultHtml;
}

// Global variable to keep track of the currently highlighted element
var currentlyHighlighted = null;

function highlightElement(identifier, event) {
    event.preventDefault();

    // Remove highlight from the previously highlighted element
    if (currentlyHighlighted) {
        currentlyHighlighted.style.outline = '';
        currentlyHighlighted.style.backgroundColor = '';
    }

    // Find and highlight the new element
    var element = document.querySelector(identifier);
    if (element) {
        element.style.outline = '2px solid red';
        element.style.backgroundColor = 'yellow';
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Update the currently highlighted element
        currentlyHighlighted = element;
    }
}

function showPopup(content) {
    var popup = document.createElement('div');
    popup.className = 'accessibility-checker-popup';
    popup.innerHTML = '<button class="wp-block-button" onclick="closePopup(this)">Close</button>' + content;
    document.body.appendChild(popup);
    document.querySelector('body').classList.add('accessibility-checker-active');
}

function closePopup(button) {
    document.querySelector('body').classList.remove('accessibility-checker-active');
    button.parentNode.remove();
}

function isElementInAdminBar(element) {
    return element.closest('#wpadminbar') !== null;
}

function checkTextToSpeechAccessibility() {
    const elements = document.querySelectorAll('article, section, p, [aria-label]');
    var failedItems = new Set(); // Use a Set to avoid duplicates

    elements.forEach(element => {
        if (!isElementInAdminBar(element) && element.textContent.trim().length === 0) {
            var identifier = `${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ').join('.') : ''}`;
            var message = `${element.tagName.toLowerCase()}.${element.className || ''}</br> <strong>Error: Empty text content</strong>`;
            failedItems.add(JSON.stringify({ message, identifier })); // Stringify to use an object in a Set
        }
    });

    return {
        passed: failedItems.size === 0,
        failedItems: Array.from(failedItems).map(item => JSON.parse(item)) // Convert back to objects
    };
}

function checkKeyboardNavigation() {
    const interactiveElements = document.querySelectorAll('a, button, input, [tabindex]');
    var failedItems = new Set();

    interactiveElements.forEach(element => {
        if (!isElementInAdminBar(element) && element.tabIndex < 0) {
            var identifier = `${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ').join('.') : ''}`;
            var message = `${element.tagName.toLowerCase()}.${element.className || ''}</br> <strong>Error: Not focusable via keyboard</strong>`;
            failedItems.add(JSON.stringify({ message, identifier }));
        }
    });

    return {
        passed: failedItems.size === 0,
        failedItems: Array.from(failedItems).map(item => JSON.parse(item))
    };
}

function hexToRgb(color) {
    if (color.startsWith('#')) {
        // Handle hex colors
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        color = color.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    } else if (color.startsWith('rgb')) {
        // Handle rgb and rgba colors
        const result = color.match(/(\d+), (\d+), (\d+)/);
        return result ? {
            r: parseInt(result[1]),
            g: parseInt(result[2]),
            b: parseInt(result[3])
        } : null;
    }
    return null; // Unsupported color format
}

function getRelativeLuminance(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return 0; // Default to 0 if invalid color

    const a = [rgb.r, rgb.g, rgb.b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getColorContrastRatio(foregroundColor, backgroundColor) {
    const L1 = getRelativeLuminance(foregroundColor);
    const L2 = getRelativeLuminance(backgroundColor);

    // Ensure L1 is lighter than L2
    if (L1 > L2) {
        return (L1 + 0.05) / (L2 + 0.05);
    } else {
        return (L2 + 0.05) / (L1 + 0.05);
    }
}

function getBackgroundColor(element) {
    let color = window.getComputedStyle(element).backgroundColor;
    while (element.parentElement && color === 'rgba(0, 0, 0, 0)') {
        element = element.parentElement;
        color = window.getComputedStyle(element).backgroundColor;
    }
    return color;
}

function checkColorContrast() {
    const elements = document.querySelectorAll('body *:not(#wpadminbar *):not(.nojq):not(script)');
    var failedItems = new Set();

    elements.forEach(element => {
        const textColor = window.getComputedStyle(element).color;
        const backgroundColor = getBackgroundColor(element);

        const contrastRatio = getColorContrastRatio(textColor, backgroundColor);

        if (contrastRatio < 4.5) {
            var identifier = `${element.tagName.toLowerCase()}${element.className ? '.' + String(element.className).split(' ').join('.') : ''}`;
            var message = `${element.tagName.toLowerCase()}.${element.className || ''}</br> <strong>Error: Low contrast ratio (${contrastRatio.toFixed(2)})</strong>`;
            failedItems.add(JSON.stringify({ message, identifier }));
        }
    });

    return {
        passed: failedItems.size === 0,
        failedItems: Array.from(failedItems).map(item => JSON.parse(item))
    };
}

function checkAltTextForImages() {
    const images = document.querySelectorAll('img');
    var failedItems = new Set();

    images.forEach(img => {
        if (!isElementInAdminBar(img) && !img.alt.trim().length) {
            var identifier = `img${img.className ? '.' + img.className.split(' ').join('.') : ''}[src="${img.src}"]`;
            var message = `img.${img.className || 'none'}</br> <strong>Error: Missing alt text, src: ${img.src}</strong>`;
            failedItems.add(JSON.stringify({ message, identifier }));
        }
    });

    return {
        passed: failedItems.size === 0,
        failedItems: Array.from(failedItems).map(item => JSON.parse(item))
    };
}


