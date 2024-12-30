document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Fetch and display the daily verse
    fetchVerse();

    // Add event listener for refresh button
    const refreshButton = document.getElementById('refreshVerse');
    refreshButton.addEventListener('click', fetchVerse);

    // Navigation setup
    const verseBtn = document.getElementById('verseBtn');
    const interpretationBtn = document.getElementById('interpretationBtn');
    const prayerBtn = document.getElementById('prayerBtn');

    const verseSection = document.querySelector('.verse-section');
    const interpretationSection = document.querySelector('.interpretation-section');
    const prayerSection = document.querySelector('.prayer-section');

    function showSection(section) {
        // Hide all sections
        verseSection.style.display = 'none';
        interpretationSection.style.display = 'none';
        prayerSection.style.display = 'none';

        // Remove active class from all buttons
        verseBtn.classList.remove('active');
        interpretationBtn.classList.remove('active');
        prayerBtn.classList.remove('active');

        // Show selected section and activate button
        switch(section) {
            case 'verse':
                verseSection.style.display = 'block';
                verseBtn.classList.add('active');
                break;
            case 'interpretation':
                interpretationSection.style.display = 'block';
                interpretationBtn.classList.add('active');
                break;
            case 'prayer':
                prayerSection.style.display = 'block';
                prayerBtn.classList.add('active');
                break;
        }
    }

    // Initial state
    showSection('verse');

    // Add click event listeners
    verseBtn.addEventListener('click', () => showSection('verse'));
    interpretationBtn.addEventListener('click', () => showSection('interpretation'));
    prayerBtn.addEventListener('click', () => showSection('prayer'));
});

function fetchVerse() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const verseElement = document.getElementById('verse');
    const referenceElement = document.getElementById('verseReference');
    const interpretationElement = document.getElementById('interpretation');
    const prayerElement = document.getElementById('prayer');

    // Show loading state
    loading.style.display = 'block';
    error.style.display = 'none';
    verseElement.innerHTML = '';
    referenceElement.textContent = '';
    interpretationElement.innerHTML = '';
    prayerElement.innerHTML = '';

    fetch('/get_verse')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data); // Debug log

            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.verse) {
                throw new Error('No verse data received');
            }

            // Log the raw verse data
            console.log('Raw verse data:', data.verse);

            // Split into lines and filter out empty lines
            const lines = data.verse.split('\n').filter(line => line.trim());
            console.log('Split lines:', lines);

            // Find section indices
            const verseSectionIndex = lines.findIndex(line => line.trim() === 'Bible Verse:');
            const interpretationSectionIndex = lines.findIndex(line => line.trim() === 'Interpretation:');
            const prayerSectionIndex = lines.findIndex(line => line.trim() === 'Prayer/Affirmation:');

            console.log('Section indices:', {
                verse: verseSectionIndex,
                interpretation: interpretationSectionIndex,
                prayer: prayerSectionIndex
            });

            if (verseSectionIndex === -1) {
                throw new Error('Could not find Bible Verse section');
            }

            // Extract verse content (should be between Bible Verse: and Interpretation:)
            const verseEndIndex = interpretationSectionIndex !== -1 ? interpretationSectionIndex : lines.length;
            const verseLines = lines.slice(verseSectionIndex + 1, verseEndIndex);
            console.log('Verse lines:', verseLines);

            if (verseLines.length < 2) {
                throw new Error('Invalid verse format');
            }

            // Last line should be the reference
            const reference = verseLines[verseLines.length - 1].replace(/^-\s*/, '').trim();
            // Everything else is the verse content
            const verseContent = verseLines.slice(0, -1)
                .join(' ')
                .replace(/^[""]|[""]$/g, '')
                .trim();

            // Extract interpretation
            let interpretation = 'Interpretation not available';
            if (interpretationSectionIndex !== -1) {
                const interpretationEndIndex = prayerSectionIndex !== -1 ? prayerSectionIndex : lines.length;
                interpretation = lines
                    .slice(interpretationSectionIndex + 1, interpretationEndIndex)
                    .join(' ')
                    .trim();
            }

            // Extract prayer
            let prayer = 'Prayer not available';
            if (prayerSectionIndex !== -1) {
                prayer = lines
                    .slice(prayerSectionIndex + 1)
                    .join(' ')
                    .trim();
            }

            console.log('Parsed content:', {
                verseContent,
                reference,
                interpretation,
                prayer
            });
            
            // Update the DOM
            verseElement.textContent = `"${verseContent}"`;
            referenceElement.textContent = reference;
            interpretationElement.innerHTML = `<p>${interpretation}</p>`;
            prayerElement.innerHTML = `<p>${prayer}</p>`;
        })
        .catch(err => {
            console.error('Error:', err); // Debug log
            error.textContent = `Error: ${err.message}`;
            error.style.display = 'block';
        })
        .finally(() => {
            loading.style.display = 'none';
        });
}
